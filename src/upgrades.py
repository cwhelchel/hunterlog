from alembic_src import versions
import logging as L

# not having this in the file seemed to mess up logging to index.log
# in index.py. alembic issue?
logging = L.getLogger("upgrades")


def do_upgrade():
    logging.info('upgrading to head')
    versions.upgrade()


def get_version(verbose: bool = False):
    logging.info('getting current db version')
    return versions.current(verbose)
