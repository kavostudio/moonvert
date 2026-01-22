#!/bin/bash
# Setup Python environment for development

set -e

echo "🐍 Setting up Python environment for geo conversion..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source .venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r src/python/requirements.txt

echo ""
echo "✅ Python environment ready!"
echo ""
echo "📝 To use the Python environment:"
echo "   source .venv/bin/activate"
echo ""
echo "🧪 To test the conversion script:"
echo "   python3 src/python/convert_geo.py <input> <output> <source_format> <target_format>"
echo ""
