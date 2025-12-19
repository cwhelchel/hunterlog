
import json
from db.db import DataBase
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


class HiddenSpotsApi:
    def __init__(self, db: DataBase, programs: dict[str, Program]):
        self.db = db
        self.programs = programs

    def hide_spot(self, spot_id):
        log.debug(f'hiding spot id: {spot_id}')
        try:
            spot = self.db.spots.get_spot(spot_id)
            actx = spot.activator
            ref = spot.reference
            self.db.hidden_spots.add_or_update(actx, ref)

            spot.is_hidden = True
            self.db.commit_session()
            return _response(True, '')
        except Exception as ex:
            log.error('hide_spot error', exc_info=ex)
            return _response(False, 'Error hiding spot')

    def unhide_spot(self, spot_id):
        log.debug(f'un-hiding spot id: {spot_id}')
        try:
            spot = self.db.spots.get_spot(spot_id)
            actx = spot.activator
            ref = spot.reference
            self.db.hidden_spots.update(actx, ref, False)

            spot.is_hidden = False
            self.db.commit_session()
            return _response(True, '')
        except Exception as ex:
            log.error('hide_spot error', exc_info=ex)
            return _response(False, 'Error un-hiding spot')
