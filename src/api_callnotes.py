
import json
from db.db import DataBase
from db.models.callsign_notes import CallsignNoteSchema
from programs.program import Program
import logging as L

from utils.callsign_notes import CallsignNotes


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


class CallNotesApi:
    def __init__(self, db: DataBase, programs: dict[str, Program]):
        self.db = db
        self.programs = programs
        self.init_notes()

    def init_notes(self):
        # this downloads files and sets last_download on the rows
        self._callnotes = CallsignNotes(self.db.callsign_notes.get_enabled())
        self.db.commit_session()

    def get_all(self):
        '''
        Gets all the callsign notes
        '''
        log.debug('getting all callsign notes')
        all = self.db.callsign_notes.get_all()
        schema = CallsignNoteSchema(many=True)
        return _response(True, '', call_notes=schema.dumps(all))

    def set_notes(self, notes: str):
        '''
        Sets the list of user configured callsign notes.

        :param notes str: json. array of call note rows
        '''
        log.debug('set_rows ' + notes)
        try:
            new_notes = json.loads(notes)
            log.debug(new_notes)
            self.db.callsign_notes.set_all(new_notes)

            # refresh notes obj
            self.init_notes()
        except Exception as ex:
            log.error('error setting callsign notes', exc_info=ex)
            return _response(False, 'Error setting callsign notes.')

        return _response(True, '')

    def delete_note(self, note_id: int):
        '''
        Delete the given callsign note.
        '''
        log.debug(f'delete_note {note_id}')
        try:
            self.db.callsign_notes.delete(note_id)
        except Exception as ex:
            log.error('error deleting callsign note', exc_info=ex)
            return _response(False, 'Error deleting callsign note')

        return _response(True, '')

    def get_call_note(self, callsign: str):
        x = self._callnotes.get_notes(callsign)
        return _response(True, '', notes=x)
