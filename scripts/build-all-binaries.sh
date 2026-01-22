#!/bin/bash
# Build all external binaries for production

set -e

PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')

case "$PLATFORM" in
  darwin*)
    PLATFORM="darwin"
    ;;
  *)
    echo "❌ Unsupported platform: $PLATFORM"
    exit 1
    ;;
esac

echo " Building all binaries for platform: $PLATFORM"
echo ""

if [ "$PLATFORM" = "darwin" ]; then
  echo "Downloading Pandoc binary..."
  bash scripts/download-pandoc-darwin.sh
  echo ""
fi

if [ "$PLATFORM" = "darwin" ]; then
  echo "Downloading FFmpeg binaries..."
  bash scripts/download-ffmpeg-darwin.sh
  echo ""
fi

if [ "$PLATFORM" = "darwin" ]; then
  echo "Building Python executable..."
  bash scripts/build-python-darwin.sh
  echo ""
fi

echo "✅ Verifying builds..."
echo ""

if [ -f "dist/pandoc/$PLATFORM-arm64/pandoc" ]; then
  echo "✓ Pandoc executable found"
  echo "  ARM64:"
  ls -lh dist/pandoc/$PLATFORM-arm64/pandoc | awk '{print "    Size: " $5}'
else
  echo "Pandoc executables not found"
fi

if [ -f "dist/ffmpeg/$PLATFORM-arm64/ffmpeg" ] && [ -f "dist/ffmpeg/$PLATFORM-arm64/ffprobe" ]; then
  echo "✓ FFmpeg binaries found"
  echo "  ARM64:"
  ls -lh dist/ffmpeg/$PLATFORM-arm64/ffmpeg | awk '{print "    ffmpeg: " $5}'
  ls -lh dist/ffmpeg/$PLATFORM-arm64/ffprobe | awk '{print "    ffprobe: " $5}'
else
  echo "FFmpeg binaries not found"
fi

if [ -f "dist/python/$PLATFORM/convert_geo" ] || [ -f "dist/python/$PLATFORM/convert_geo.exe" ]; then
  echo "✓ Python executable found"
  ls -lh dist/python/$PLATFORM/convert_geo* | awk '{print "  Size: " $5}'
else
  echo "Python executable not found"
fi

echo ""
echo "Binary build complete!"
echo ""
echo "Output directory: dist/"
echo "   ├── pandoc/$PLATFORM/"
echo "   ├── ffmpeg/$PLATFORM/"
echo "   └── python/$PLATFORM/"
echo ""
