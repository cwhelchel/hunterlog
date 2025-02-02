import sqlalchemy as sa
from sqlalchemy.orm import scoped_session

from db.models.alerts import Alerts, AlertsSchema
from db.models.spots import Spot
from db.models.qsos import Qso

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

    def get_current_alerts(self) -> list[Alerts]:
        return self.session.query(Alerts) \
            .filter(Alerts.enabled.is_(True)) \
            .all()

    def check_spots(self) -> dict[str, Spot]:
        alerts = self.get_current_alerts()
        found = dict[str, Spot]()

        for a in alerts:
            s = self.session.query(Spot) \
                .filter(Spot.locationDesc.startswith(a.loc_search)) \
                .first()
            found[a.name] = s

        logging.debug(found)
        return found
