import * as toml from '@iarna/toml';
import yaml from 'js-yaml';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parentPort } from 'node:worker_threads';
import plist from 'plist';
import type { StructuredWorkerConversionRequest, StructuredWorkerConversionResponse } from './structured-worker.types';

function parseStructured(buffer: Uint8Array, sourceFormat: string): unknown {
    const content = Buffer.from(buffer).toString('utf-8');

    switch (sourceFormat.toLowerCase()) {
        case 'json':
            return JSON.parse(content);
        case 'yaml':
        case 'yml':
            return yaml.load(content);
        case 'plist':
            return plist.parse(content);
        case 'toml':
            return toml.parse(content);
        default:
            throw new Error(`Unsupported source format: ${sourceFormat}`);
    }
}

function serializeStructured(data: unknown, targetFormat: string): string {
    switch (targetFormat.toLowerCase()) {
        case 'json':
            return JSON.stringify(data, null, 2);
        case 'yaml':
        case 'yml':
            return yaml.dump(data);
        case 'plist':
            return plist.build(data as plist.PlistObject);
        case 'toml':
            return toml.stringify(data as toml.JsonMap);
        default:
            throw new Error(`Unsupported target format: ${targetFormat}`);
    }
}

async function convertStructured(request: StructuredWorkerConversionRequest): Promise<StructuredWorkerConversionResponse> {
    try {
        const { id, inputBuffer, sourceFormat, targetFormat, outputPath } = request;

        const parsed = parseStructured(inputBuffer, sourceFormat);
        const serialized = serializeStructured(parsed, targetFormat);
        const outputBuffer = new Uint8Array(Buffer.from(serialized, 'utf-8'));

        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, outputBuffer);

        return {
            id,
            success: true,
            outputPath,
        };
    } catch (error) {
        return {
            id: request.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

parentPort?.on('message', async (request: StructuredWorkerConversionRequest) => {
    const response = await convertStructured(request);
    parentPort?.postMessage(response);
});
