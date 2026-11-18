
import json
import os
import platform
import subprocess
import time
import webview
from db.db import DataBase
from db.models.parks import ParkSchema
from fs.data_file import DataFile
from programs.program import Program
import logging as L

from fs.glob import hl_data_dir, migrate_to_platformdirs, log_file
from utils.adif import AdifLog
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

    def export_park_data(self) -> str:
        '''
        Dumps the entire parks table into a file named 'park_export.json'.

        This can then be later used to import. This is useful to avoid having
        to download park info from the POTA endpoints.
        '''
        log.debug("export_park_data: dumping parks table...")
        parks = self.db.parks.get_parks()
        schema = ParkSchema()
        data = schema.dumps(parks, many=True)

        timestamp = time.strftime("%Y%m%d-%H%M%S")
        fn = f"park_export_{timestamp}.json"

        ft = ('JSON files (*.json)',)

        filename = webview.windows[0] \
            .create_file_dialog(
                webview.SAVE_DIALOG,
                save_filename=fn,
                file_types=ft)

        if not filename:
            # user cancelled
            return _response(True, "")

        path = filename
        log.info(f'exporting park table to {path}')

        with open(path, "w") as out:
            out.write(data)

        return _response(True, "Park data exported successfully")

    def import_park_data(self) -> str:
        '''
        Loads previously exported park data from a file into the parks table.

        The opposite of :meth:`export_park_data`
        '''
        log.debug("import_park_data: loading table...")

        ft = ('JSON files (*.json)',)

        filename = webview.windows[0] \
            .create_file_dialog(
                webview.OPEN_DIALOG,
            file_types=ft)

        if not filename:
            # user cancelled
            return _response(True, "")

        with open(filename[0], "r") as input:
            text = input.read()
            obj = json.loads(text)
            self.db.parks.import_park_data(obj)

        log.debug("import_park_data: import finished")
        return _response(True, "Park data imported successfully", persist=True)

    def export_qsos(self):
        '''
        Exports the QSOs logged with this logger app into a file.
        '''
        try:
            qs = self.db.qsos.get_qsos_from_app()
            my_call = self.db.config.get_value('my_call')
            my_grid6 = self.db.config.get_value('my_grid6')

            timestamp = time.strftime("%Y%m%d-%H%M%S")
            fn = f"{timestamp}_hl_export.adi"

            ft = ('ADIF files (*.adi;*.adif)',)

            filename = webview.windows[0] \
                .create_file_dialog(
                    webview.SAVE_DIALOG,
                    save_filename=fn,
                    file_types=ft)

            if not filename:
                # user cancelled
                return _response(True, "")

            my_log = AdifLog(filename=filename)
            for q in qs:
                if (q.freq == ''):
                    log.warning('exporting: no freq in qso, skipping')
                    continue

                my_log.log_qso(q, my_call, my_grid6)

            return _response(True, "QSOs exported successfully")
        except Exception as ex:
            log.exception("Error exporting QSOs to ADIF file")
            return _response(
                False, "Error exporting QSOs from DB", ext=str(ex))

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
