import os
import py2app
import shutil

from distutils.core import setup

def tree(src):
    return [(root, map(lambda f: os.path.join(root, f), files))
        for (root, dirs, files) in os.walk(os.path.normpath(src))]


if os.path.exists('build'):
    shutil.rmtree('build')

if os.path.exists('dist/index.app'):
    shutil.rmtree('dist/index.app')

ENTRY_POINT = ['src/index.py']

# pull all the files from data/ dir. really only need continents.json,
# sota_associations.json, wwbota_continents.json [cmw]
HL_DATA = [('', ['data'])]

DATA_FILES = tree('gui')
OPTIONS = {
    'argv_emulation': False,
    'strip': False,
    'iconfile': 'src/assets/logo.icns',
    'includes': ['charset_normalizer.md__mypyc'],
    'packages': ['WebKit', 'Foundation', 'webview', 'objc'],
    'plist': {
        'NSRequiresAquaSystemAppearance': False
    },
    'resources': DATA_FILES
}

setup(
    app=ENTRY_POINT,
    data_files=HL_DATA,
    name='Hunterlog',
    options={'py2app': OPTIONS},
    setup_requires=['py2app'],
)
