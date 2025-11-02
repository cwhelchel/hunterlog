from datetime import datetime
from datetime import timezone
from datetime import timedelta
from sqlalchemy.orm import scoped_session
import sqlalchemy as sa

from db.models.alerts import Alerts
from db.models.spots import Spot

import logging as L

logging = L.getLogger(__name__)


class AlertsQuery:
    '''Internal DB queries against the Alerts table are stored here.'''

    def __init__(self, session: scoped_session):
        self.session = session

    def insert_test_alert(self):
        alert = Alerts()
        alert.name = "TEST"
        alert.loc_search = "US-CA"
        self.session.add(alert)
        self.session.commit()

    def get_alerts(self) -> list[Alerts]:
        return self.session.query(Alerts) \
            .all()

    def get_current_alerts(self) -> list[Alerts]:
        return self.session.query(Alerts) \
            .filter(Alerts.enabled.is_(True)) \
            .all()

    def check_spots(self) -> dict[str, list[Spot]]:
        alerts = self.get_current_alerts()
        found = dict[str, Spot]()

        for a in alerts:
            terms: list[sa.ColumnElement[bool]] = []
            terms.append(Spot.locationDesc.startswith(a.loc_search))
            terms.append(Spot.is_qrt.is_(False))

            if a.new_only:
                terms.append(Spot.park_hunts == 0)
            if a.exclude_modes:
                modes: str = a.exclude_modes
                list_to_exclude = map(str.strip, modes.split(','))
                terms.append(Spot.mode.not_in(list_to_exclude))

            if (a.dismissed_until is not None):
                terms.append(Spot.spotTime > a.dismissed_until)

            # logging.debug(f"terms {terms}")
            s = self.session.query(Spot) \
                .filter(sa.and_(*terms)) \
                .all()
            found[f"{a.name}+{a.id}"] = s

            if (s is not None):
                a.last_triggered = datetime.now(timezone.utc)

        self.session.commit()
        # logging.debug(found)
        return found

    def delete_alert(self, id: int):
        self.session.query(Alerts) \
            .filter(Alerts.id == id).delete()

    def snooze_alert(self, id: int, minutes: int = 10):
        alert: Alerts = self.session.query(Alerts).get(id)

        if alert:
            alert.dismissed_until = datetime.now(
                timezone.utc) + timedelta(minutes=minutes)

    def _get_snooze_terms(self, alert: Alerts) -> sa.ColumnElement[bool]:
        if (alert.dismissed_until is not None):
            return Spot.spotTime > alert.dismissed_until
        return None
