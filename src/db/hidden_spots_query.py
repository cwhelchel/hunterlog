from datetime import datetime, timedelta
from datetime import timezone
import sqlalchemy as sa
from sqlalchemy.orm import scoped_session
import logging as L

from db.models.hidden_spots import HiddenSpot

log = L.getLogger(__name__)


class HiddenSpotsQuery:
    def __init__(self, session: scoped_session):
        '''
        Ctor for HiddenSpotsQuery

        :param scoped_session session: the db session object
        '''
        self.session = session

    def delete_stale_hidden_spots(self):
        utc_now = self._get_utc_now()
        sql = f'DELETE FROM hidden_spots where expires_on < "{utc_now}";'
        # log.debug(sql)
        self.session.execute(sa.text(sql))
        self.session.commit()

    def get_all(self) -> list[HiddenSpot]:
        '''
        Gets all enabled and current hidden spot rows
        '''
        utc_now = self._get_utc_now()

        x = self.session.query(HiddenSpot) \
            .where(HiddenSpot.enabled.is_(True)) \
            .where(HiddenSpot.expires_on > utc_now) \
            .all()

        # log.debug(f"hidden spots {utc_now} {x}")

        return x

    def get_spot(self, id: int) -> HiddenSpot:
        return self.session.query(HiddenSpot).get(id)

    def get_spot_by_actx(self, activator: str, park: str) -> HiddenSpot:
        return self.session.query(HiddenSpot) \
            .filter(
                sa.and_(HiddenSpot.activator == activator,
                        HiddenSpot.reference == park)) \
            .first()

    def is_hidden(self, activator, reference: str, time: datetime) -> bool:
        row = self.get_spot_by_actx(activator, reference)
        # log.debug(f"hide spot row {row}")

        if row is None or row.enabled is False:
            return False

        # spot is still in current UTC day so it's hidden
        if (row.expires_on > time):
            return True

        return False

    def add(self, activator, reference: str):
        utc_now = self._get_utc_now()

        to_add = HiddenSpot()
        to_add.activator = activator
        to_add.reference = reference
        to_add.created_on = utc_now
        to_add.expires_on = self._get_next_utc_start()
        self.session.add(to_add)
        self.session.commit()

    def add_or_update(self, activator, reference: str):
        row = self.get_spot_by_actx(activator, reference)
        if row:
            row.enabled = True
            row.expires_on = self._get_next_utc_start()
            self.session.commit()
            return

        utc_now = self._get_utc_now()
        to_add = HiddenSpot()
        to_add.activator = activator
        to_add.reference = reference
        to_add.created_on = utc_now
        to_add.expires_on = self._get_next_utc_start()
        self.session.add(to_add)
        self.session.commit()

    def update(self, activator, reference: str, enabled: bool):
        row = self.get_spot_by_actx(activator, reference)
        if row:
            row.enabled = enabled
            self.session.commit()
            return

    def _add_test(self):
        self.add("N9FZ", "US-1234")

    def _get_utc_now(self) -> datetime:
        return datetime.now(tz=timezone.utc)

    def _get_next_utc_start(self) -> datetime:
        now = self._get_utc_now()
        next_utc = now + timedelta(days=1)

        start_next_utc = datetime.combine(
            next_utc,
            datetime.min.time(),
            tzinfo=timezone.utc)

        # log.debug(f"Start of the next UTC day: {start_next_utc}")
        return start_next_utc
