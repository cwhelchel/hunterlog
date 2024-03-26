from ..alembic import versions


def do_upgrade():
    versions.upgrade()


def do_downgrade():
    versions.downgrade()


def get_version(verbose: bool = False):
    return versions.current(verbose)
