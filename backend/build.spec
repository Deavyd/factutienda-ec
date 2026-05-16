# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['run_server.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('app', 'app'),
        ('alembic', 'alembic'),
        ('alembic.ini', '.'),
        ('version.txt', '.'),
        ('data/xsd', 'data/xsd'),
    ],
    hiddenimports=[
        'sqlalchemy.dialects.sqlite',
        'signxml',
        'lxml',
        'zeep',
        'reportlab',
        'passlib',
        'jose',
        'cryptography',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['psycopg2', 'asyncpg'],
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
    name='factutienda-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
)
