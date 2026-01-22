# Python Bridge Setup & Usage

## Development Setup

### 1. Install Python Dependencies

```bash
# Run the setup script
chmod +x scripts/setup-python.sh
./scripts/setup-python.sh
```

Or manually:

```bash
# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate  # macOS/Linux
# or
.venv\Scripts\activate  # Windows

# Install dependencies
pip install -r src/python/requirements.txt
```

### 2. Test Python Script

```bash
# Activate virtual environment
source .venv/bin/activate

# Test conversion
python3 src/python/convert_geo.py \
  input.gpkg \
  output.geojson \
  gpkg \
  geojson
```

### 3. Run Electron App (Development)

```bash
# App will use system Python (python3) automatically
pnpm dev
```

---

## Production Build

### Build PyInstaller Executable

```bash
# Activate virtual environment
source .venv/bin/activate

# Build for current platform
chmod +x scripts/build-python-darwin.sh
./scripts/build-python-darwin.sh
```

Output: `dist/python/darwin/convert_geo` (~150MB)

### Build Electron App with Bundled Python

```bash
pnpm build
```

The executable will be automatically included via electron-builder configuration.

---

## How It Works

### Development Mode

- Uses system `python3`
- Runs `src/python/convert_geo.py` directly
- Requires Python + dependencies installed

### Production Mode

- Uses bundled PyInstaller executable
- No Python installation needed on user's machine
- Standalone executable in app resources

---

## File Locations

### Development

```
Python: /usr/bin/python3 or /usr/local/bin/python3
Script: <project>/src/python/convert_geo.py
```

### Production

```
macOS:   MyApp.app/Contents/Resources/python/convert_geo
Windows: MyApp/resources/python/convert_geo.exe
Linux:   MyApp/resources/python/convert_geo
```

---

## Troubleshooting

### "Python not found" error

```bash
# Make sure Python 3 is installed
python3 --version

# Make sure dependencies are installed
source .venv/bin/activate
pip install -r src/python/requirements.txt
```

### PyInstaller build fails

```bash
# Clean and retry
rm -rf build dist
pip install --upgrade pyinstaller
./scripts/build-python-darwin.sh
```

### Conversion fails

```bash
# Test Python script directly
python3 src/python/convert_geo.py test.gpkg test.geojson gpkg geojson

# Check Python process output in Electron console
```

---

## Platform-Specific Builds

### macOS

```bash
./scripts/build-python-darwin.sh
# Output: dist/python/darwin/convert_geo
```

### Windows (on Windows machine)

```powershell
# Install Python 3
# Activate .venv
pyinstaller pyinstaller.spec
mkdir dist\python\win32
copy dist\convert_geo.exe dist\python\win32\
```

### Linux (on Linux machine)

```bash
./scripts/build-python-linux.sh
# Output: dist/python/linux/convert_geo
```

---

## Dependencies

### Python (Development)

- geopandas==0.14.3
- pyogrio==0.7.2
- shapely==2.0.3
- pandas==2.2.0

### Node.js

No additional dependencies needed!
