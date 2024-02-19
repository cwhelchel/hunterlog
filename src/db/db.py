from typing import List
import logging
from enum import Enum
import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker
from db.models.activators import Activator, ActivatorSchema

from db.models.qsos import Qso, QsoSchema
from db.models.spot_comments import SpotComment, SpotCommentSchema
from db.models.spots import Spot, SpotSchema
from db.models.user_config import UserConfig, UserConfigSchema


Base = declarative_base()


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
        self.schema = SpotSchema()
        self.init_config()

    def init_config(self):
        current = self.session.query(UserConfig).first()

        if current is None:
            cs = UserConfigSchema()
            logging.debug("creating default user config...")
            s = {'my_call': "N9FZ", 'my_grid6': 'EM82dl', 'default_pwr': 20}
            default_config = cs.load(s, session=self.session)
            self.session.add(default_config)
            self.session.commit()

    def update_all_spots(self, spots_json):
        self.session.execute(sa.text('DELETE FROM spots;'))
        for s in spots_json:
            to_add = self.schema.load(s, session=self.session)
            self.session.add(to_add)
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
        return self.session.query(Spot).all()

    def get_spot(self, id: int) -> Spot:
        return self.session.query(Spot).get(id)

    def get_spot_comments(self) -> List[SpotComment]:
        return self.session.query(SpotComment).all()

    def get_by_mode(self, mode: str) -> List[Spot]:
        return self.session.query(Spot).filter(Spot.mode == mode).all()

    def get_by_band(self, band: Bands) -> List[Spot]:
        ll = bandLimits[band][0]
        ul = bandLimits[band][1]
        terms = [sa.cast(Spot.frequency, sa.Float) < ul,
                 sa.cast(Spot.frequency, sa.Float) > ll]
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

    def build_qso_from_spot(self, spot_id: int) -> Qso:
        s = self.get_spot(spot_id)
        if s is not None:
            q = Qso(s)
            # print(q)
            return q


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
