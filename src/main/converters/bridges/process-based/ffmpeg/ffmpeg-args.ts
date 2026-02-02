import type { AudioFileFormat, AudioConversionOptions as AudioOptions, VideoFileFormat } from 'shared/types/conversion.types';

type VideoPreset = {
    hwAccel?: { videoCodec: string; bitrate: string };
    software: { videoCodec: string; qualityArgs: string[] };
    audioCodec: string;
    extraArgs?: string[];
    format?: string;
};

export const VIDEO_PRESETS: Record<VideoFileFormat, VideoPreset> = {
    // H.264 compatible formats (support hardware acceleration)
    mp4: {
        hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
        software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
        audioCodec: 'aac',
        extraArgs: ['-movflags', '+faststart'],
    },
    m4v: {
        hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
        software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
        audioCodec: 'aac',
        extraArgs: ['-movflags', '+faststart'],
    },
    mov: {
        hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
        software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
        audioCodec: 'aac',
    },
    mkv: {
        hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
        software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
        audioCodec: 'aac',
    },
    avi: {
        hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
        software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
        audioCodec: 'aac',
    },
    '3gp': {
        hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '2M' },
        software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '26'] },
        audioCodec: 'aac',
        format: '3gp',
    },
    flv: {
        hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
        software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
        audioCodec: 'aac',
        format: 'flv',
    },
    ts: {
        hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
        software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
        audioCodec: 'aac',
        format: 'mpegts',
    },
    mts: {
        hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
        software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
        audioCodec: 'aac',
        format: 'mpegts',
    },
    m2ts: {
        hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
        software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
        audioCodec: 'aac',
        format: 'mpegts',
    },
    // Software-only formats (no hardware encoder available)
    webm: {
        software: { videoCodec: 'libvpx-vp9', qualityArgs: ['-crf', '32', '-b:v', '0'] },
        audioCodec: 'libopus',
    },
    wmv: {
        software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
        audioCodec: 'aac',
        format: 'asf',
    },
    ogv: {
        software: { videoCodec: 'libtheora', qualityArgs: ['-q:v', '7'] },
        audioCodec: 'libvorbis',
        format: 'ogg',
    },
    mpg: {
        software: { videoCodec: 'mpeg2video', qualityArgs: ['-q:v', '3'] },
        audioCodec: 'mp2',
        format: 'mpeg',
    },
    mpeg: {
        software: { videoCodec: 'mpeg2video', qualityArgs: ['-q:v', '3'] },
        audioCodec: 'mp2',
        format: 'mpeg',
    },
    mxf: {
        software: { videoCodec: 'mpeg2video', qualityArgs: ['-q:v', '3'] },
        audioCodec: 'pcm_s16le',
        format: 'mxf',
    },
    vob: {
        software: { videoCodec: 'mpeg2video', qualityArgs: ['-q:v', '3'] },
        audioCodec: 'mp2',
        format: 'vob',
    },
    gif: {
        software: { videoCodec: 'gif', qualityArgs: [] },
        audioCodec: 'none',
    },
};

type AudioPreset = {
    codec: string;
    bitrateFlag?: string;
    defaultBitrate?: number;
    extraArgs?: string[];
    format?: string;
};

const AUDIO_PRESETS: Record<AudioFileFormat, AudioPreset> = {
    mp3: { codec: 'libmp3lame', bitrateFlag: '-b:a', defaultBitrate: 192 },
    flac: { codec: 'flac', extraArgs: ['-compression_level', '8'] },
    aac: { codec: 'aac', bitrateFlag: '-b:a', defaultBitrate: 192 },
    m4a: { codec: 'aac', bitrateFlag: '-b:a', defaultBitrate: 192, format: 'ipod' },
    ogg: { codec: 'libvorbis', bitrateFlag: '-b:a', defaultBitrate: 192 },
    opus: { codec: 'libopus', bitrateFlag: '-b:a', defaultBitrate: 128 },
    wav: { codec: 'pcm_s16le' },
    aiff: { codec: 'pcm_s16be', format: 'aiff' },
    wma: { codec: 'wmav2', bitrateFlag: '-b:a', defaultBitrate: 192 },
    alac: { codec: 'alac' },
    ape: { codec: 'ape' },
    wv: { codec: 'wavpack' },
};

export function buildVideoArgs(sourcePath: string, targetPath: string, targetFormat: VideoFileFormat): string[] {
    const args = ['-y', '-i', sourcePath];

    // GIF uses complex filter instead of codecs
    if (targetFormat === 'gif') {
        args.push('-map', '0:v:0', '-an', '-vf', 'fps=15,scale=iw:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse', '-loop', '0');
        args.push('-progress', 'pipe:1', '-nostats', targetPath);
        return args;
    }

    const preset = VIDEO_PRESETS[targetFormat];
    const useHardwareAccel = process.platform === 'darwin' && preset.hwAccel;

    // Only map video and audio streams, ignore data/metadata streams
    args.push('-map', '0:v', '-map', '0:a?');

    if (useHardwareAccel && preset.hwAccel) {
        args.push('-c:v', preset.hwAccel.videoCodec, '-b:v', preset.hwAccel.bitrate);
    } else {
        args.push('-c:v', preset.software.videoCodec, ...preset.software.qualityArgs);
    }

    args.push('-c:a', preset.audioCodec);

    if (preset.extraArgs) {
        args.push(...preset.extraArgs);
    }
    if (preset.format) {
        args.push('-f', preset.format);
    }

    args.push('-progress', 'pipe:1', '-nostats', targetPath);
    return args;
}

export function buildAudioArgs(sourcePath: string, targetPath: string, targetFormat: AudioFileFormat, options?: Partial<AudioOptions>): string[] {
    const args = ['-y', '-i', sourcePath];
    const preset = AUDIO_PRESETS[targetFormat];

    if (!preset) {
        args.push('-c:a', 'copy', '-progress', 'pipe:1', '-nostats', targetPath);
        return args;
    }

    args.push('-c:a', preset.codec);

    if (preset.bitrateFlag && preset.defaultBitrate) {
        const bitrate = options?.bitrate || preset.defaultBitrate;
        args.push(preset.bitrateFlag, `${bitrate}k`);
    }

    if (preset.extraArgs) {
        args.push(...preset.extraArgs);
    }
    if (options?.sampleRate) {
        args.push('-ar', String(options.sampleRate));
    }
    if (options?.channels) {
        args.push('-ac', String(options.channels));
    }
    if (preset.format) {
        args.push('-f', preset.format);
    }

    args.push('-progress', 'pipe:1', '-nostats', targetPath);
    return args;
}
