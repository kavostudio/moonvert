import { type BrowserWindow, ipcMain } from 'electron';
import { availableParallelism, cpus } from 'node:os';
import pLimit from 'p-limit';
import type { BatchConversionProgress, ConversionProgress, ConversionResult } from 'shared/types/conversion.types';
import { type IPCRequest, type IPCResponse, IPCChannels, IPCEvents } from 'shared/ipc/ipc-config';
import { getConverter } from '../converters';
import { conversionManager } from 'main/converters/conversion-manager';
import { getAbortErrorMessage } from 'main/utils/abort-utils';
import { createConversionProgress } from 'main/converters/base/base-converter';
import { licenseService } from 'main/services/license-service';

function sendBatchProgress(window: BrowserWindow | undefined, progress: BatchConversionProgress) {
    if (window && !window.isDestroyed()) {
        window.webContents.send(IPCEvents.conversion.batchProgress, progress);
    }
}

export function registerConversionHandlers(window?: BrowserWindow): void {
    ipcMain.handle(IPCChannels.conversion.convertBatch, async (_, request: IPCRequest<'conversion:convert-batch'>): Promise<IPCResponse<'conversion:convert-batch'>> => {
        const { conversions } = request;

        const licenseCheck = await licenseService.canConvert();

        if (!licenseCheck.allowed) {
            conversions.forEach((conv, index) => {
                sendBatchProgress(window, {
                    total: conversions.length,
                    completed: 0,
                    failed: index + 1,
                    current: createConversionProgress.failed({
                        fileId: conv.fileId,
                        error: licenseCheck.reason || 'License required',
                    }),
                });
            });
            return conversions.map((conv) => ({
                fileId: conv.fileId,
                success: false,
                error: licenseCheck.reason || 'License required',
            }));
        }

        conversionManager.allowConversions(true);

        const batchProgress: BatchConversionProgress = {
            total: conversions.length,
            completed: 0,
            failed: 0,
        };

        sendBatchProgress(window, batchProgress);

        const availableCores = availableParallelism();
        const coresLimit = Math.max(1, availableCores - 2);
        console.log(`System has ${cpus().length} CPU cores, using up to ${coresLimit} for conversions.`);

        const limit = pLimit(coresLimit);

        const results = await Promise.all(
            conversions.map((conversionRequest) =>
                limit(async () => {
                    const { sourceFormat, targetFormat } = conversionRequest;
                    const { fileId } = conversionRequest;

                    if (conversionManager.conversionAllowed() === false) {
                        const errorMsg = 'No longer accepting new conversions';

                        batchProgress.failed++;

                        batchProgress.current = createConversionProgress.failed({
                            fileId,
                            error: errorMsg,
                        });

                        sendBatchProgress(window, batchProgress);

                        return {
                            fileId,
                            success: false,
                            error: errorMsg,
                        } satisfies ConversionResult;
                    }

                    const abortController = conversionManager.register(fileId);

                    if (!abortController) {
                        const errorMsg = 'No longer accepting new conversions';
                        const errorResult: ConversionResult = {
                            fileId,
                            success: false,
                            error: errorMsg,
                        };

                        batchProgress.failed++;

                        batchProgress.current = createConversionProgress.failed({
                            fileId,
                            error: errorMsg,
                        });

                        sendBatchProgress(window, batchProgress);

                        return errorResult;
                    }

                    const converter = getConverter(sourceFormat, targetFormat);
                    console.log(`Identified converter for ${sourceFormat} to ${targetFormat}: ${converter ? 'Yes' : 'No'}`);

                    if (!converter) {
                        const errorResult: ConversionResult = {
                            fileId,
                            success: false,
                            error: `No converter available for ${sourceFormat} to ${targetFormat}`,
                        };

                        batchProgress.failed++;

                        batchProgress.current = createConversionProgress.failed({
                            fileId,
                            error: errorResult.error || '',
                        });

                        sendBatchProgress(window, batchProgress);

                        return errorResult;
                    }

                    try {
                        const result = await converter(
                            conversionRequest,
                            (progress: ConversionProgress) => {
                                batchProgress.current = progress;
                                sendBatchProgress(window, batchProgress);
                            },
                            abortController.signal,
                        );

                        if (abortController.signal.aborted) {
                            const errorMessage = getAbortErrorMessage(abortController.signal);

                            batchProgress.failed++;
                            batchProgress.current = {
                                fileId,
                                status: 'failed',
                                progress: 100,
                                error: errorMessage,
                            };
                            sendBatchProgress(window, batchProgress);
                            return {
                                fileId,
                                success: false,
                                error: errorMessage,
                            } satisfies ConversionResult;
                        }

                        if (result.success) {
                            batchProgress.completed++;
                        } else {
                            batchProgress.failed++;
                        }

                        sendBatchProgress(window, batchProgress);

                        return result;
                    } catch (error) {
                        const errorMessage = abortController.signal.aborted
                            ? getAbortErrorMessage(abortController.signal)
                            : error instanceof Error
                              ? error.message
                              : 'Conversion error';

                        batchProgress.failed++;
                        batchProgress.current = {
                            fileId,
                            status: 'failed',
                            progress: 100,
                            error: errorMessage,
                        };
                        sendBatchProgress(window, batchProgress);

                        return {
                            fileId,
                            success: false,
                            error: errorMessage,
                        } satisfies ConversionResult;
                    } finally {
                        conversionManager.unregister(fileId);
                    }
                }),
            ),
        );

        if (batchProgress.completed >= 1) {
            licenseService.incrementConversion();
        }

        return results;
    });

    ipcMain.handle(IPCChannels.conversion.cancelAll, async (): Promise<IPCResponse<'conversion:cancel-all'>> => {
        conversionManager.abortAll('Conversion canceled');
        return { success: true };
    });
}
