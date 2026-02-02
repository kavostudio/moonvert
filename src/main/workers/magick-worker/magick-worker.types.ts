import z from 'zod';

export type MagickWorkerConversionRequest = {
    id: string;
    inputBuffer: Uint8Array;
    sourceFormat: string;
    targetFormat: string;
    quality?: number;
    outputPath: string;
};

export const MagickWorkerMessageZod = z.union([
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

export type MagickWorkerConversionResponse = z.infer<typeof MagickWorkerMessageZod>;
