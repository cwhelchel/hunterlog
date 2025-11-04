'''copied from https://stackoverflow.com/a/74875605'''
"""DB migrations"""
from pathlib import Path
import os
import sys

from alembic.config import Config
from alembic import command
from alembic import config


def get_app_global_path():
    '''Returns the correct location for a bundled pyinstaller executable file'''
    if getattr(sys, 'frozen', False) and getattr(sys, '_MEIPASS', False):
        return sys._MEIPASS
    elif __file__:
        # were running from source (npm run start) and this file is in 
        # src/alembic_src/versions we need to back up a little so the code
        # below works 
        return os.path.dirname(__file__) + "/../../"
    

# we dont want to worry about alembic.ini when running programmatically. so we
# just create our config the hard way. but with the correct frozen dir
alembic_cfg = Config()
src_path = Path(get_app_global_path(), "alembic_src")
alembic_cfg.set_main_option("script_location", str(src_path))
alembic_cfg.set_main_option("sqlalchemy.url", "sqlite:///spots.db")


def current(verbose=False):
    command.current(alembic_cfg, verbose=verbose)


def upgrade(revision="head"):
    command.upgrade(alembic_cfg, revision)


def downgrade(revision):
    command.downgrade(alembic_cfg, revision)


def ensure_versions():
    command.ensure_version(alembic_cfg)