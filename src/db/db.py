from datetime import datetime, timedelta
from typing import List
import logging as L
from enum import Enum
import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker

from db.models.qsos import Qso
from db.models.activators import Activator, ActivatorSchema
from db.models.spot_comments import SpotComment, SpotCommentSchema
from db.models.spots import Spot, SpotSchema
from db.models.user_config import UserConfig, UserConfigSchema
from db.models.parks import Park, ParkSchema

Base = declarative_base()

logging = L.getLogger("db")


class Bands(Enum):
    NOBAND = 0
    ONESIXTY = 1
    EIGHTY = 2
    SIXTY = 3
    FOURTY = 4
    THIRTY = 5
    TWENTY = 6
    SEVENTEEN = 7
    FIFTEEN = 8
    TWELVE = 9
    TEN = 10


bandLimits = {
    Bands.ONESIXTY: (1800.0, 2000.0),
    Bands.EIGHTY: (3500.0, 4000.0),
    Bands.SIXTY: (5330.0, 5410.0),
    Bands.FOURTY: (7000.0, 7300.0),
    Bands.THIRTY: (10100.0, 10150.0),
    Bands.TWENTY: (14000.0, 14350.0),
    Bands.SEVENTEEN: (18068.0, 18168.0),
    Bands.FIFTEEN: (21000.0, 21450.0),
    Bands.TWELVE: (24890.0, 24990.0),
    Bands.TEN: (28000.0, 29700.0),
}


class DataBase:
    def __init__(self):
        engine = sa.create_engine("sqlite:///spots.db", poolclass=sa.NullPool)
        self.session = scoped_session(sessionmaker(bind=engine))
        Base.metadata.create_all(engine)

        self.session.execute(sa.text('DELETE FROM spots;'))
        self.session.commit()
        self.init_config()
        self.band_filter = Bands.NOBAND
        self.region_filter = None

    def init_config(self):
        current = self.session.query(UserConfig).first()

        if current is None:
            cs = UserConfigSchema()
            logging.debug("creating default user config...")
            s = {'my_call': "N9FZ", 'my_grid6': 'EM82dl', 'default_pwr': 20,
                 'flr_host': "127.0.0.1", 'flr_port': 12345}
            default_config = cs.load(s, session=self.session)
            self.session.add(default_config)
            self.session.commit()

    def update_all_spots(self, spots_json):
        schema = SpotSchema()

        self.session.execute(sa.text('DELETE FROM spots;'))
        for s in spots_json:
            to_add: Spot = schema.load(s, session=self.session)
            self.session.add(to_add)

            # get meta data for this spot
            park = self.get_park(to_add.reference)
            if park is not None and park.hunts > 0:
                to_add.park_hunts = park.hunts
            else:
                to_add.park_hunts = 0

            count = self.get_op_qso_count(to_add.activator)
            to_add.op_hunts = count

            hunted = self.get_spot_hunted_flag(
                to_add.activator, to_add.frequency)
            to_add.hunted = hunted

        self.session.commit()

    def update_spot_comments(self, spot_comments_json):
        schema = SpotCommentSchema()
        for s in spot_comments_json:
            to_add = schema.load(s, session=self.session)
            self.session.add(to_add)
        self.session.commit()

    def update_activator_stat(self, activator_stat_json) -> int:
        schema = ActivatorSchema()
        x = self.get_activator(activator_stat_json['callsign'])
        if x is None:
            to_add = schema.load(activator_stat_json, session=self.session)
            self.session.add(to_add)
            x = to_add
        else:
            logging.debug(f"updating activator {x.activator_id}")
            schema.load(activator_stat_json, session=self.session, instance=x)

        self.session.commit()
        return x.activator_id

    def get_spots(self):
        terms = self._get_all_filters()
        x = self.session.query(Spot) \
            .filter(sa.and_(*terms)) \
            .all()
        return x
        # return self.session.query(Spot).all()

    def get_spot(self, id: int) -> Spot:
        return self.session.query(Spot).get(id)

    def get_spot_comments(self) -> List[SpotComment]:
        return self.session.query(SpotComment).all()

    def get_by_mode(self, mode: str) -> List[Spot]:
        return self.session.query(Spot).filter(Spot.mode == mode).all()

    def get_by_band(self, band: Bands) -> List[Spot]:
        terms = self._get_all_filters()
        x = self.session.query(Spot) \
            .filter(sa.and_(*terms)) \
            .all()
        return x

    def get_activator(self, callsign: str) -> Activator:
        return self.session.query(Activator) \
            .filter(Activator.callsign == callsign) \
            .first()

    def get_activator_by_id(self, id: int) -> Activator:
        return self.session.query(Activator).get(id)

    def get_user_config(self) -> UserConfig:
        return self.session.query(UserConfig).first()

    def update_user_config(self, json: any):
        schema = UserConfigSchema()
        config = self.get_user_config()
        schema.load(json, session=self.session, instance=config)
        self.session.commit()

    def build_qso_from_spot(self, spot_id: int) -> Qso:
        s = self.get_spot(spot_id)
        if s is not None:
            q = Qso()
            q.init_from_spot(s)
            return q

    def log_qso(self, qso: any):
        '''
        Logs the QSO passed in from UI.

        :param any qso: json from the frontend.
        '''

        # passing in the QSO object from init_from_spot
        # doesn't seem to ever work. recreat a QSO object
        # and add it directly
        logging.debug(f"inserting qso: {qso}")
        q = Qso()
        q.call = qso['call']
        q.rst_sent = qso['rst_sent']
        q.rst_recv = qso['rst_recv']
        q.freq = qso['freq']
        q.freq_rx = qso['freq_rx']
        q.mode = qso['mode']
        q.comment = qso['comment']
        q.qso_date = datetime.fromisoformat(qso['qso_date'])
        q.time_on = datetime.fromisoformat(qso['time_on'])
        q.tx_pwr = qso['tx_pwr']
        q.rx_pwr = qso['rx_pwr']
        q.gridsquare = qso['gridsquare']
        q.sig = qso['sig']
        q.sig_info = qso['sig_info']
        q.from_app = True
        q.cnfm_hunt = False
        self.session.add(q)
        self.session.commit()

    def inc_park_hunt(self, park: any):
        '''
        Increment the hunt count of a park by one. If park is not in db add it.

        :param any park: the json for a POTA park returned from POTA api
        '''
        schema = ParkSchema()
        p = self.get_park(park['reference'])

        if p is None:
            logging.debug(f"adding new park row for {park['reference']}")
            to_add: Park = schema.load(park, session=self.session)
            to_add.hunts = 1
            logging.debug(to_add)
            self.session.add(to_add)
            p = to_add
        else:
            logging.debug(f"increment hunts for park {p.reference}")
            p.hunts += 1
            schema.load(park, session=self.session, instance=p)

        self.session.commit()

    def get_park(self, park: str) -> Park:
        return self.session.query(Park) \
            .filter(Park.reference == park) \
            .first()

    def get_op_qso_count(self, call: str) -> int:
        return self.session.query(Qso) \
            .filter(Qso.call == call) \
            .count()

    def get_spot_hunted_flag(self, activator, freq: str) -> bool:
        now = datetime.utcnow()
        flag = self.session.query(Qso) \
            .filter(Qso.call == activator,
                    now - Qso.time_on < timedelta(days=1)) \
            .count()
        return flag

    def set_band_filter(self, band: Bands):
        logging.debug(f"db setting band filter to {band}")
        self.band_filter = band

    def set_region_filter(self, region: str):
        logging.debug(f"db setting region filter to {region}")
        self.region_filter = region

    def _get_all_filters(self) -> list[sa.ColumnElement[bool]]:
        return self._get_band_filters() + self._get_region_filters()

    def _get_band_filters(self) -> list[sa.ColumnElement[bool]]:
        band = Bands(self.band_filter)  # not sure why cast is needed
        if band == Bands.NOBAND:
            return []
        ll = bandLimits[band][0]
        ul = bandLimits[band][1]
        terms = [sa.cast(Spot.frequency, sa.Float) < ul,
                 sa.cast(Spot.frequency, sa.Float) > ll]
        return terms

    def _get_region_filters(self) -> list[sa.ColumnElement[bool]]:
        region = self.region_filter
        if (region is None):
            return []
        terms = [Spot.locationDesc.startswith(region)]
        return terms


if __name__ == "__main__":
    db = DataBase()
    db.update_all_spots()
    all_spots = db.get_spots()
    v = SpotSchema(many=True)
    print(v.dumps(all_spots))
    cw_spots = db.get_by_band(Bands.FOURTY)
    print(cw_spots)
    # db.update_spot_comments("KU8T", "K-2263")
    # comments = db.get_spot_comments()
    # print(*text, sep='\n')
