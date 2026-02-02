import type { ConversionProgress, FileFormat } from 'shared/types/conversion.types';

export type BridgeConversionOptions<SourceFormat extends FileFormat, TargetFormat extends FileFormat, AdditionalOptions extends object = {}> = {
    sourcePath: string;
    targetPath: string;
    sourceFormat: SourceFormat;
    targetFormat: TargetFormat;
    onProgress: (progress: ConversionProgress) => void;
    fileId: string;
    abortSignal: AbortSignal;
} & AdditionalOptions;

export type BridgeConversionResult<SuccessFields extends object, ErrorFields extends object> = {
    success: boolean;
} & (({ success: true; outputPath: string; fileSize: number; featuresCount?: number } & SuccessFields) | ({ success: false; error: string } & ErrorFields));

export type BridgeConversionFunction<Options extends BridgeConversionOptions<any, any>, Result extends BridgeConversionResult<any, any>> = (options: Options) => Promise<Result>;
