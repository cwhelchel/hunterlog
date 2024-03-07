import datetime
from typing import Callable
import sqlalchemy as sa
from sqlalchemy.orm import scoped_session

from db.models.spots import Spot


class SpotQuery:
    def __init__(self,
                 session: scoped_session,
                 func: Callable[[], list[sa.ColumnElement[bool]]]):
        '''
        Ctor for SpotQuery
        :param scoped_session session: the db session object
        :param func: callback function returning terms list for filter
        '''
        self.session = session
        self._get_filters_cb = func

    def delete_all_spots(self):
        self.session.execute(sa.text('DELETE FROM spots;'))
        self.session.commit()

    def get_spots(self):
        '''
        Get all the spots after applying the current filters: band, region, and
        QRT filters
        '''
        if self._get_filters_cb is None:
            return None

        terms = self._get_filters_cb()
        x = self.session.query(Spot) \
            .filter(sa.and_(*terms)) \
            .all()
        return x

    def get_spot(self, id: int) -> Spot:
        return self.session.query(Spot).get(id)

    def insert_test_spot(self):
        # test data
        test = Spot()
        test.activator = "VP5/WD5JR"
        test.reference = "TC-0001"
        test.grid6 = "FL31vt"
        test.spotTime = datetime.datetime.utcnow()
        test.spotter = "HUNTER-LOG"
        test.mode = "CW"
        test.locationDesc = "TC-TC"
        test.latitude = "21.8022"
        test.longitude = "-72.17"
        test.name = "TEST"
        test.parkName = "TEST"
        test.comments = "A TEST SPOT QRT FROM HL"
        test.frequency = "14001.0"
        test.hunted_bands = ""
        test.is_qrt = False
        test.hunted = False
        self.session.add(test)
        self.session.commit()
