#!/bin/bash
# Download pre-built static FFmpeg for Moonvert (macOS)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/dist/ffmpeg/darwin-arm64"

echo "Downloading static FFmpeg for macOS..."

mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

curl -L -o ffmpeg.zip "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip"
unzip -o ffmpeg.zip
rm -f ffmpeg.zip
chmod +x ffmpeg

echo "Done: $OUTPUT_DIR/ffmpeg"
./ffmpeg -version | head -1
