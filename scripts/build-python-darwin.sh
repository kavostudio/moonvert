#!/bin/bash
# Build PyInstaller executable for macOS

set -e

echo "🏗️  Building PyInstaller executable for macOS..."

if [ -z "$VIRTUAL_ENV" ]; then
    echo "Activating python virtual environment..."
    source .venv/bin/activate
fi

if ! pip show pyinstaller &> /dev/null; then
    echo "Installing PyInstaller..."
    pip install pyinstaller
fi

echo "Cleaning previous builds..."
rm -rf build dist/python/

echo "Building executable..."
pyinstaller pyinstaller.spec

mkdir -p dist/python/darwin

echo "Copying executable..."
cp dist/convert_geo dist/python/darwin/convert_geo
chmod +x dist/python/darwin/convert_geo

echo ""
echo "✅ Build complete!"
echo "Executable: dist/python/darwin/convert_geo"
echo "Size: $(du -h dist/python/darwin/convert_geo | cut -f1)"
echo ""
echo "To test:"
echo "   ./dist/python/darwin/convert_geo <input> <output> <source_format> <target_format>"
echo ""
