# -*- mode: python ; coding: utf-8 -*-


from PyInstaller.utils.win32.versioninfo import (
    VSVersionInfo, FixedFileInfo, StringFileInfo, StringTable,
    StringStruct, VarFileInfo, VarStruct
)

import sys
import os
import shutil
from pathlib import Path
import semver

print("--- Starting PyInstaller build ---")

# Add the directory containing the .spec file to sys.path so we can load
# src.version below [cmw]
sys.path.insert(0, os.path.dirname(os.path.abspath(SPEC)))

from src.version import __version__  # NOQA E402


def create_win_ver_info(hl_ver) -> VSVersionInfo:
    # Windows requires 4 integers; default the 4th (build) to 0
    win_ver_tuple = (hl_ver.major, hl_ver.minor, hl_ver.patch, 0)

    win_version_info = VSVersionInfo(
        ffi=FixedFileInfo(
            filevers=win_ver_tuple,
            prodvers=win_ver_tuple,
            mask=0x3f,
            flags=0x0,
            OS=0x4,
            fileType=0x1,
            subtype=0x0,
            date=(0, 0)
        ),
        kids=[
            StringFileInfo([
                StringTable(
                    '040904B0',
                    [
                        StringStruct('CompanyName', 'krinkl3.net'),
                        StringStruct('FileDescription', 'hunterlog'),
                        StringStruct('FileVersion', str(hl_ver)),
                        StringStruct('InternalName', 'hunterlog'),
                        StringStruct('LegalCopyright',
                                     'Copyright (c) cwhelchel'),
                        StringStruct('OriginalFilename', 'hunterlog.exe'),
                        StringStruct('ProductName', 'hunterlog'),
                        StringStruct('ProductVersion', str(hl_ver)),
                    ]
                )
            ]),
            VarFileInfo([VarStruct('Translation', [1033, 1200])])
        ]
    )

    return win_version_info


# parse HL version using semver. we use this later
hl_ver = semver.Version.parse(__version__)

block_cipher = None
added_files = [
    ('.\\gui', 'gui'),
    ('.\\src\\assets\\logo.png', 'src\\assets'),
    ('.\\alembic.ini', '.'),
    ('.\\src\\alembic_src\\env.py', 'alembic_src'),
    ('.\\src\\alembic_src\\versions\\*', 'alembic_src\\versions'),
]

ver_info = create_win_ver_info(hl_ver)

a = Analysis(['.\\src\\index.py'],
             pathex=['.\\dist'],
             binaries=[],
             datas=added_files,
             hiddenimports=['clr'],
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
          version=ver_info,
          debug=False,
          bootloader_ignore_signals=False,
          strip=False,
          upx=True,
          upx_exclude=[],
          icon='.\\src\\assets\\logo.ico',
          runtime_tmpdir=None,
          console=False,
          disable_windowed_traceback=False,
          target_arch=None,
          codesign_identity=None,
          entitlements_file=None)


shutil.copyfile('logging.conf', '{0}/logging.conf'.format(DISTPATH))
os.makedirs(os.path.dirname('{0}/data/'.format(DISTPATH)), exist_ok=True)

# copy everything in data/ to dist. make sure any
# downloaded files aren't included by accident. right now its only
# continent files
shutil.copytree('./data', '{0}/data/'.format(DISTPATH), dirs_exist_ok=True)


if hl_ver == semver.Version(0, 0, 12):
    # this version is the first to install a version of HL that uses
    # platformdirs to store all the HL data. We want to ask the users if they
    # want to migrate from the old manually installed locations.
    # create a flag file in dist to signal to HL to prompt about the migration
    flag_file = '{0}/data/.migrate'.format(DISTPATH)
    Path(flag_file).touch()
