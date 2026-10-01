from sqlalchemy.orm import scoped_session

from db.models.callsign_notes import CallsignNote, CallsignNoteSchema

import logging as L


logging = L.getLogger(__name__)


class CallNotesQuery:
    '''Internal DB queries against the Alerts table are stored here.'''

    def __init__(self, session: scoped_session):
        self.session = session

    def get_all(self) -> list[CallsignNote]:
        return self.session.query(CallsignNote) \
            .order_by(CallsignNote.order) \
            .all()

    def get_enabled(self) -> list[CallsignNote]:
        return self.session.query(CallsignNote) \
            .filter(CallsignNote.enabled.is_(True)) \
            .order_by(CallsignNote.order) \
            .all()

    def set_all(self, new_notes: list[CallsignNote]):
        schema = CallsignNoteSchema(many=True)
        to_load = schema.load(
            new_notes,
            session=self.session,
            many=True,
            partial=True)
        self.session.add_all(to_load)
        self.session.commit()

    def delete(self, id: int):
        self.session.query(CallsignNote) \
            .filter(CallsignNote.id == id) \
            .delete()
        self.session.commit()
