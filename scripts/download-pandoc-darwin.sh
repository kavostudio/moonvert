#!/bin/bash
# Download ARM64 Pandoc binary for macOS

set -e

VERSION="3.8.3"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMP_DIR="$(mktemp -d)"

echo "Downloading Pandoc binaries..."
echo ""

download_arch() {
  local ARCH=$1
  local PANDOC_ARCH=$2
  local OUTPUT_DIR="$PROJECT_ROOT/dist/pandoc/darwin-$ARCH"
  
  if [ -f "$OUTPUT_DIR/pandoc" ]; then
    echo "✓ Pandoc binary already exists for $ARCH"
    ls -lh "$OUTPUT_DIR/pandoc" | awk '{print "  Size: " $5}'
    return 0
  fi
  
  mkdir -p "$OUTPUT_DIR"
  cd "$TEMP_DIR"
  
  echo "Downloading $ARCH binary..."
  DOWNLOAD_URL="https://github.com/jgm/pandoc/releases/download/$VERSION/pandoc-$VERSION-$PANDOC_ARCH-macOS.zip"
  
  curl -L -f -o "pandoc-$ARCH.zip" "$DOWNLOAD_URL"
  
  if [ ! -f "pandoc-$ARCH.zip" ] || [ ! -s "pandoc-$ARCH.zip" ]; then
    echo "❌ Failed to download $ARCH binary"
    exit 1
  fi
  
  if ! unzip -t "pandoc-$ARCH.zip" > /dev/null 2>&1; then
    echo "❌ Downloaded file is not a valid zip archive"
    exit 1
  fi
  
  echo "Extracting $ARCH binary..."
  unzip -q "pandoc-$ARCH.zip"
  find . -type f -name "pandoc" -path "*/bin/pandoc" | head -n 1 | xargs -I {} cp {} "$OUTPUT_DIR/pandoc"
  
  chmod +x "$OUTPUT_DIR/pandoc"

  if command -v strip >/dev/null 2>&1; then
    echo "Stripping $ARCH binary..."
    strip -x -S "$OUTPUT_DIR/pandoc" || true
  fi
  
  echo "Testing $ARCH binary:"
  "$OUTPUT_DIR/pandoc" --version | head -n 1
  ls -lh "$OUTPUT_DIR/pandoc" | awk '{print "  Size: " $5}'
  echo ""
  
  rm -rf pandoc-*
}

cd "$TEMP_DIR"

download_arch "arm64" "arm64"

cd "$PROJECT_ROOT"
rm -rf "$TEMP_DIR"

echo "Both Pandoc binaries ready:"
echo "  ARM64: dist/pandoc/darwin-arm64/pandoc"
