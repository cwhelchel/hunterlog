
import datetime
import json
import os
from pathlib import Path
import sys
import webview
from db.db import DataBase
from programs.apis.stats import PotaStats
from programs.program import Program
import logging as L


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


class ImportApi:
    def __init__(self, db: DataBase, programs: dict[str, Program]):
        self.db = db
        self.programs = programs

    def call_update_progress(self, x: float):
        if len(webview.windows) > 0:
            js = """if (window.pywebview.state !== undefined &&  window.pywebview.state.updateImportProgress !== undefined)  {{  // # noqa
                            window.pywebview.state.updateImportProgress({obj}); // # noqa
                    }}
                """.format(obj=x)
        webview.windows[0].evaluate_js(js)

    def update_ref_hunts_from_prog_data(
            self,
            program: str,
            file_contents: str) -> str:
        '''
        Import hunts from a program csv files that contain QSO style data
        (i.e. one row per contact).

        This does not download park data.

        :param program str: The programs SIG ID
        :param file_contents str: the string contents of the file
        '''
        try:
            # the program has to know how to handle the files from the program
            # website.
            hunts = self.programs[program].parse_hunt_data(file_contents)

            total = len(hunts)
            x = 0.0

            for ref, hunt_count in hunts.items():
                j = {'reference': ref}
                self.db.parks.update_park_hunts(j, hunt_count)
                x += 1.0
                per = (x / total) * 100.0
                self.call_update_progress(per)

            self.db.commit_session()
        except Exception as ex:
            log.error(
                f'error importing hunt counts for program: {program}',
                exc_info=ex)
            return _response(False, 'Error importing hunts. See log.')

        return _response(True, 'Import successful')

    def update_park_hunts_from_csv(self, file_contents) -> str:
        '''
        Will use the current pota stats from hunter_parks.csv to update db with
        new park hunt numbers.
        '''
        def _get_app_global_path():
            '''stolen from alembic/versions/__init__.py'''
            if getattr(sys, 'frozen', False):
                return os.path.abspath(os.path.dirname(sys.executable))
            elif __file__:
                # were running from source (npm run start) and this file is in
                # so we need to back up a little so the code works
                return os.path.dirname(__file__) + "/../"

        try:
            root = _get_app_global_path()
            timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            new_fn = f'hunter_parks_{timestamp_str}.csv'
            imp_fn = Path(str(root), 'data/',  new_fn)

            with open(imp_fn, 'x', encoding='utf-8') as output:
                output.writelines(file_contents)

            log.info(f"updating park hunts from {imp_fn}")
            stats = PotaStats(imp_fn)
            hunts = stats.get_all_hunts()

            total = len(hunts)
            x = 0.0

            for park in hunts:
                count = stats.get_park_hunt_count(park)
                j = {'reference': park, 'hunts': count}
                self.db.parks.update_park_hunts(j, count)
                x += 1.0
                per = (x / total) * 100.0
                self.call_update_progress(per)

            self.db.commit_session()

            return _response(
                True, "Park Hunts imported", persist=True)

        except Exception as e:
            log.error('error importing pota reference hunts', exc_info=e)
            return _response(False, "Import Failed", persist=True)
