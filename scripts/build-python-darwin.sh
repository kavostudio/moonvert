#!/bin/bash
set -e

echo "Building PyInstaller executable for macOS..."

if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "Python found: $(python3 --version)"

if [ -d ".venv" ]; then
    echo "Removing existing virtual environment..."
    rm -rf .venv
fi

echo "Creating virtual environment..."
python3 -m venv .venv

echo "Activating virtual environment..."
source .venv/bin/activate

echo "Upgrading pip..."
pip install --upgrade pip --quiet

echo "Installing dependencies..."
pip install -r src/python/requirements.txt --quiet

echo "Installing PyInstaller..."
pip install pyinstaller --quiet

echo "Cleaning previous builds..."
rm -rf build dist/python/

echo "Building executable..."
pyinstaller pyinstaller.spec

mkdir -p dist/python/darwin

echo "Copying executable..."
cp dist/convert_geo dist/python/darwin/convert_geo
chmod +x dist/python/darwin/convert_geo

echo ""
echo "Build complete!"
echo "Executable: dist/python/darwin/convert_geo"
echo "Size: $(du -h dist/python/darwin/convert_geo | cut -f1)"
echo ""