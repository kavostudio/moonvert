#!/bin/bash
# Build minimal FFmpeg for Moonvert using Homebrew dependencies

set -e

FFMPEG_VERSION="8.0.1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/build/ffmpeg-build"
OUTPUT_DIR="$PROJECT_ROOT/dist/ffmpeg/darwin-arm64"

echo "Building Minimal FFmpeg $FFMPEG_VERSION"

# Install dependencies via Homebrew
echo "Installing dependencies..."
brew install nasm x264 libvpx lame opus libvorbis theora wavpack pkg-config

mkdir -p "$BUILD_DIR" "$OUTPUT_DIR"
cd "$BUILD_DIR"

# Set up Homebrew paths for pkg-config
export PKG_CONFIG_PATH="$(brew --prefix)/lib/pkgconfig:$PKG_CONFIG_PATH"
export LDFLAGS="-L$(brew --prefix)/lib"
export CFLAGS="-I$(brew --prefix)/include"

# Download FFmpeg
if [ ! -d "ffmpeg-$FFMPEG_VERSION" ]; then
    echo "Downloading FFmpeg..."
    curl -L -o ffmpeg.tar.xz "https://ffmpeg.org/releases/ffmpeg-$FFMPEG_VERSION.tar.xz"
    tar xJf ffmpeg.tar.xz
fi

cd "ffmpeg-$FFMPEG_VERSION"

echo "Configuring FFmpeg (minimal build)..."
./configure \
    --disable-debug \
    --disable-doc \
    --disable-ffplay \
    --disable-ffprobe \
    --disable-network \
    --disable-autodetect \
    --enable-gpl \
    --enable-videotoolbox \
    --enable-libx264 \
    --enable-libvpx \
    --enable-libtheora \
    --enable-libmp3lame \
    --enable-libopus \
    --enable-libvorbis

echo "Building (this takes a few minutes)..."
make -j$(sysctl -n hw.ncpu)

echo "Installing..."
cp ffmpeg "$OUTPUT_DIR/ffmpeg"
strip -x -S "$OUTPUT_DIR/ffmpeg"

echo ""
echo "Done!"
ls -lh "$OUTPUT_DIR/ffmpeg"
"$OUTPUT_DIR/ffmpeg" -version | head -1
