# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_all

block_cipher = None

collect_modules = [
    'geopandas',
    'pyproj',
    'fiona',
    'shapely',
    'pyogrio',
    'pandas',
    'numpy',
]

all_datas = []
all_binaries = []
all_hiddenimports = []

for module_name in collect_modules:
    datas, binaries, hiddenimports = collect_all(module_name)
    all_datas += datas
    all_binaries += binaries
    all_hiddenimports += hiddenimports

a = Analysis(
    ['src/python/convert_geo.py'],
    pathex=[],
    binaries=all_binaries,
    datas=all_datas,
    hiddenimports=all_hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Test frameworks and development tools
        'pytest',
        'unittest',
        'test',
        'tests',
        '_pytest',
        'py.test',
        
        # Documentation and type stubs
        'sphinx',
        'docutils',
        'pydoc_data',
        
        # Unused pandas/numpy features
        'pandas.tests',
        'numpy.tests',
        'IPython',
        'jupyter',
        'notebook',
        'matplotlib',
        'scipy',
        
        # Build tools
        'setuptools',
        'pip',
        'wheel',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='convert_geo',
    debug=False,
    bootloader_ignore_signals=False,
    strip=True,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
