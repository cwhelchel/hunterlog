# -*- mode: python ; coding: utf-8 -*-

block_cipher = None
added_files = [
    ('./gui/*', 'gui'),
    ('./alembic.ini', '.'),
    ('./src/alembic_src/env.py', 'alembic_src'),
    ('./src/alembic_src/versions/*', 'alembic_src/versions'),
]


hidden_imports = ['clr']
bins = []

import platform


if platform.system() == 'Linux':
    codename = platform.freedesktop_os_release().get('UBUNTU_CODENAME')

    # ubuntu 24.04 LTS (also linux mint 22.2)
    if codename == 'noble':
        # hidden_imports = ['clr', 'pkg_resources._vendor.jaraco.functools', 'pkg_resources._vendor.jaraco.context', 'pkg_resources._vendor.jaraco.text']
        bins = [
            ("/usr/lib/x86_64-linux-gnu/gio/modules/libgiognutls.so", "gio_modules"),
            ("/usr/lib/x86_64-linux-gnu/gio/modules/libgiolibproxy.so", "gio_modules"),
            ("/usr/lib/x86_64-linux-gnu/gio/modules/libgiognomeproxy.so", "gio_modules")
        ]


a = Analysis(['./src/index.py'],
             pathex=['./dist'],
             binaries=bins,
             datas=added_files,
             hiddenimports=hidden_imports,
             hookspath=[],
             hooksconfig={},
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher,
             noarchive=False)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)

exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          [],
          name='hunterlog',
          debug=False,
          bootloader_ignore_signals=False,
          strip=True,
          upx=True,
          upx_exclude=[],
          #icon='./src/assets/logo.ico',
          runtime_tmpdir=None,
          console=False,
          disable_windowed_traceback=False,
          target_arch=None,
          codesign_identity=None,
          entitlements_file=None )


import shutil
import os

shutil.copyfile('logging.conf', '{0}/logging.conf'.format(DISTPATH))
os.makedirs(os.path.dirname('{0}/data/'.format(DISTPATH)), exist_ok=True)

# copy everything in data/ to dist. make sure any
# downloaded files aren't included by accident. right now its only 
# continent files
shutil.copytree('./data', '{0}/data/'.format(DISTPATH), dirs_exist_ok=True)

