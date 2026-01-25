#!/bin/bash
# Download ARM64 ffmpeg binary for macOS

set -e

VERSION="8.0.1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMP_DIR="$(mktemp -d)"

FFMPEG_URL="https://evermeet.cx/ffmpeg/ffmpeg-$VERSION.zip"

OUTPUT_DIR="$PROJECT_ROOT/dist/ffmpeg/darwin-arm64"

if [ -f "$OUTPUT_DIR/ffmpeg" ]; then
  echo "✓ ffmpeg binary already exists"
  ls -lh "$OUTPUT_DIR/ffmpeg" | awk '{print "  ffmpeg size: " $5}'
  exit 0
fi

mkdir -p "$OUTPUT_DIR"
cd "$TEMP_DIR"

echo "Downloading ffmpeg $VERSION (macOS arm64)..."

curl -L -f -o "ffmpeg.zip" "$FFMPEG_URL"

if ! unzip -t "ffmpeg.zip" > /dev/null 2>&1; then
  echo "ffmpeg zip is invalid"
  exit 1
fi

echo "Extracting..."
unzip -q "ffmpeg.zip"

if [ ! -f "ffmpeg" ]; then
  echo "Missing extracted binary"
  exit 1
fi

cp "ffmpeg" "$OUTPUT_DIR/ffmpeg"

chmod +x "$OUTPUT_DIR/ffmpeg"

if command -v strip >/dev/null 2>&1; then
  echo "Stripping ffmpeg binary..."
  strip -x -S "$OUTPUT_DIR/ffmpeg" || true
fi

echo "Testing ffmpeg binary:"
"$OUTPUT_DIR/ffmpeg" -version | head -n 1

ls -lh "$OUTPUT_DIR/ffmpeg" | awk '{print "  ffmpeg size: " $5}'

echo "Done."

rm -rf "$TEMP_DIR"
