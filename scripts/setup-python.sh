#!/bin/bash
set -e

echo "Setting up Python environment..."

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
pip install -r src/python/requirements.txt

echo ""
echo "Python environment ready!"
echo "Run: source .venv/bin/activate"
echo ""