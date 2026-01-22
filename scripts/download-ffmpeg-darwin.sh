#!/bin/bash
# Download ARM64 ffmpeg + ffprobe binaries for macOS

set -e

VERSION="8.0.1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMP_DIR="$(mktemp -d)"

FFMPEG_URL="https://evermeet.cx/ffmpeg/ffmpeg-$VERSION.zip"
FFPROBE_URL="https://evermeet.cx/ffmpeg/ffprobe-$VERSION.zip"

OUTPUT_DIR="$PROJECT_ROOT/dist/ffmpeg/darwin-arm64"

if [ -f "$OUTPUT_DIR/ffmpeg" ] && [ -f "$OUTPUT_DIR/ffprobe" ]; then
  echo "✓ ffmpeg binaries already exist"
  ls -lh "$OUTPUT_DIR/ffmpeg" | awk '{print "  ffmpeg size: " $5}'
  ls -lh "$OUTPUT_DIR/ffprobe" | awk '{print "  ffprobe size: " $5}'
  exit 0
fi

mkdir -p "$OUTPUT_DIR"
cd "$TEMP_DIR"

echo "Downloading ffmpeg $VERSION (macOS arm64)..."

curl -L -f -o "ffmpeg.zip" "$FFMPEG_URL"
curl -L -f -o "ffprobe.zip" "$FFPROBE_URL"

if ! unzip -t "ffmpeg.zip" > /dev/null 2>&1; then
  echo "❌ ffmpeg zip is invalid"
  exit 1
fi

if ! unzip -t "ffprobe.zip" > /dev/null 2>&1; then
  echo "❌ ffprobe zip is invalid"
  exit 1
fi

echo "Extracting..."
unzip -q "ffmpeg.zip"
unzip -q "ffprobe.zip"

if [ ! -f "ffmpeg" ] || [ ! -f "ffprobe" ]; then
  echo "❌ Missing extracted binaries"
  exit 1
fi

cp "ffmpeg" "$OUTPUT_DIR/ffmpeg"
cp "ffprobe" "$OUTPUT_DIR/ffprobe"

chmod +x "$OUTPUT_DIR/ffmpeg" "$OUTPUT_DIR/ffprobe"

if command -v strip >/dev/null 2>&1; then
  echo "Stripping ffmpeg binaries..."
  strip -x -S "$OUTPUT_DIR/ffmpeg" || true
  strip -x -S "$OUTPUT_DIR/ffprobe" || true
fi

echo "Testing ffmpeg binary:"
"$OUTPUT_DIR/ffmpeg" -version | head -n 1


echo "Testing ffprobe binary:"
"$OUTPUT_DIR/ffprobe" -version | head -n 1

ls -lh "$OUTPUT_DIR/ffmpeg" | awk '{print "  ffmpeg size: " $5}'
ls -lh "$OUTPUT_DIR/ffprobe" | awk '{print "  ffprobe size: " $5}'

echo "Done."

rm -rf "$TEMP_DIR"
