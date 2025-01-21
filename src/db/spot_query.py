import datetime
import sqlalchemy as sa
from sqlalchemy.orm import scoped_session
import re
import logging as L

from db.filters import Filters
from db.models.spot_comments import SpotComment
from db.models.spots import Spot

logging = L.getLogger(__name__)


class SpotQuery:
    def __init__(self,
                 session: scoped_session,
                 filters: Filters):
        '''
        Ctor for SpotQuery
        :param scoped_session session: the db session object
        :param filters: the Filters object. provides db filtering terms for
                        returning the list of spots
        '''
        self.session = session
        self._flts = filters

    def delete_all_spots(self):
        self.session.execute(sa.text('DELETE FROM spots;'))
        self.session.commit()

    def get_spots(self):
        '''
        Get all the spots after applying the current filters: band, region, and
        QRT filters
        '''
        and_flts = []
        or_flts = []
        and_flts = self._flts.get_and_filters()
        or_flts = self._flts.get_or_filters()

        # logging.debug(f"get_spots filter {and_flts} {or_flts}")

        x = self.session.query(Spot) \
            .filter(sa.and_(*and_flts)) \
            .filter(sa.or_(*or_flts)) \
            .all()
        return x

    def get_spot(self, id: int) -> Spot:
        return self.session.query(Spot).get(id)

    def get_spot_by_actx(self, activator: str, park: str) -> Spot:
        return self.session.query(Spot) \
            .filter(
                sa.and_(Spot.activator == activator,
                        Spot.reference == park)) \
            .first()

    def insert_test_spot(self):
        # test data
        test = Spot()
        test.activator = "N9FZ"
        test.reference = "K-TEST"
        test.grid6 = "FL31vt"
        test.spotTime = datetime.datetime.utcnow()
        test.spotter = "HUNTER-LOG"
        test.mode = "CW"
        test.locationDesc = "TC-TC"
        test.latitude = "21.8022"
        test.longitude = "-72.17"
        test.name = "TEST"
        test.parkName = "TEST"
        test.comments = "A TEST SPOT FROM HL"
        test.frequency = "7200"
        test.hunted_bands = ""
        test.is_qrt = False
        test.hunted = False
        self.session.add(test)
        self.session.commit()

        test_cmt = SpotComment()
        test_cmt.activator = 'N9FZ'
        test_cmt.spotId = test.spotId
        test_cmt.spotter = 'W1AW'
        test_cmt.frequency = '7200'
        test_cmt.mode = 'CW'
        test_cmt.park = 'K-TEST'
        test_cmt.comments = "{this is a test} {With: N0CALL,W1AW}"
        test_cmt.source = "test"
        test_cmt.band = "40m"
        test_cmt.spotTime = datetime.datetime.now()
        self.session.add(test_cmt)
        self.session.commit()

    def _update_comment_metadata(self, activator: str, park: str):
        logging.debug(f"_update_comment_metadata: {activator} at {park}")
        wpm = r'^RBN \d+ dB (\d+) WPM.*'
        spot = self.get_spot_by_actx(activator, park)
        if spot is None:
            return

        act_comments = []
        comments = self.session.query(SpotComment) \
            .filter(
                sa.and_(SpotComment.activator == activator,
                        SpotComment.park == park))\
            .all()

        for c in comments:
            if c.source == "RBN" and c.mode == "CW":
                m = re.match(wpm, c.comments)
                if m and spot.cw_wpm is None:
                    # logging.debug(f"got wpm {m.group(1)}")
                    spot.cw_wpm = m.group(1)
            if c.spotter == activator:
                # logging.debug(f"appending activator cmt {c.comments}")
                act_comments.append(c.comments)

        spot.act_cmts = "|".join(act_comments)
        self.session.commit()
