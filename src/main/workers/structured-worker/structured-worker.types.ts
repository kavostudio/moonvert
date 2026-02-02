import z from 'zod';

export type StructuredWorkerConversionRequest = {
    id: string;
    inputBuffer: Uint8Array;
    outputPath: string;
    sourceFormat: string;
    targetFormat: string;
};

export const StructuredWorkerMessageZod = z.union([
    z.object({
        id: z.string(),
        success: z.literal(true),
        outputPath: z.string(),
    }),
    z.object({
        id: z.string(),
        success: z.literal(false),
        error: z.string(),
    }),
]);

export type StructuredWorkerConversionResponse = z.infer<typeof StructuredWorkerMessageZod>;
