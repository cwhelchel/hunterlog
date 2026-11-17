
import json
import os
import platform
import subprocess
import webview
from db.db import DataBase
from fs.data_file import DataFile
from programs.program import Program
import logging as L

from fs.glob import hl_data_dir, migrate_to_platformdirs, log_file
from utils.pywebview_util import call_js_raw


log = L.getLogger(__name__)


def _response(success: bool, message: str, **kwargs) -> str:
    '''
    Returns a dumped json string from the given inputs.

    :param bool success: indicates if response is pass or fail
    :param str message: default message to return
    :param any kwargs: any keyword arguments are included in the json
    '''
    return json.dumps({
        'success': success,
        'message': message,
        **kwargs
    })


class ExtrasApi:
    def __init__(self, db: DataBase, programs: dict[str, Program]):
        self.db = db
        self.programs = programs
        self._migration_flag = False

    def open_folder_select_dialog(self):
        filename = webview.windows[0] \
            .create_file_dialog(
            webview.FOLDER_DIALOG)
        if not filename:
            return _response(False, 'No directory selected')

        return _response(True, '', path=filename[0])

    def migrate_to_new_hunterlog(self, path):
        log.debug(f"migrating {path} data to platformdirs...")

        if (path is not None or path != ''):
            msg = "Migration will now proceed! Hunterlog will immediately close if it is successful. Otherwise the migration failed."  # NOQA E501
            call_js_raw(f'alert("{msg}");')
            files_migrated = migrate_to_platformdirs(path)

        if files_migrated:
            webview.windows[0].destroy()
            # this is probably not needed since we destroy the window
            return _response(True, "Migration successful")

        return _response(False, "Migration failed")

    def open_user_data_dir(self):
        log.debug('opening user data directory via subprocess module')

        try:
            path = hl_data_dir.parent

            if platform.system() == "Windows":
                os.startfile(path)
            elif platform.system() == "Darwin":  # macOS
                subprocess.Popen(["open", path])
            else:  # Linux
                subprocess.Popen(["xdg-open", path])
        except Exception as ex:
            log.error(
                'error opening file explorer for user data dir', exc_info=ex)
            return _response(False, 'Error opening file explorer')

        return _response(True, '')

    def open_user_log_file(self):
        log.debug('opening log file')

        try:
            path = log_file

            if platform.system() == "Windows":
                os.startfile(path)
            elif platform.system() == "Darwin":  # macOS
                subprocess.Popen(["open", path])
            else:  # Linux
                subprocess.Popen(["xdg-open", path])
        except Exception as ex:
            log.error(
                'error opening log file', exc_info=ex)
            return _response(False, 'Error opening log file')

        return _response(True, '')

    def check_migration_flag(self):
        return _response(True, '', migrate_flag=self._migration_flag)

    def _initialize_migration_flag(self):
        # check for migration flag
        migration_df = DataFile(".migrate")
        user_callsign = self.db.config.get_value('my_call')

        log.debug(f"checking migration file {migration_df} and call {user_callsign}")  # NOQA E501

        if (migration_df.exists):
            if user_callsign == "N0CALL":
                # set flag to show migration popup in front end.
                log.info("setting migration flag in API")
                self._migration_flag = True

            # delete the .migrate file so this never runs again.
            if not migration_df.delete():
                log.error('could not delete migration flag file')
            else:
                log.info('migration flag file deleted')
