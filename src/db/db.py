from typing import List
import logging
import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker
from db.models.activators import Activator, ActivatorSchema

from db.models.qsos import Qso, QsoSchema
from db.models.spot_comments import SpotComment, SpotCommentSchema
from db.models.spots import Spot, SpotSchema
from db.models.user_config import UserConfig, UserConfigSchema


Base = declarative_base()


# class Spot(Base):
#     __tablename__ = "spots"
#     spotId = sa.Column(sa.Integer, primary_key=True)
#     activator = sa.Column(sa.String)
#     frequency = sa.Column(sa.String)
#     mode = sa.Column(sa.String(15))
#     reference = sa.Column(sa.String(15))
#     parkName = sa.Column(sa.String, nullable=True)
#     spotTime = sa.Column(sa.DateTime)
#     spotter = sa.Column(sa.String())
#     comments = sa.Column(sa.String())
#     source = sa.Column(sa.String())
#     invalid = sa.Column(sa.Boolean, nullable=True)
#     name = sa.Column(sa.String())
#     locationDesc = sa.Column(sa.String)
#     grid4 = sa.Column(sa.String(4))
#     grid6 = sa.Column(sa.String(6))
#     latitude = sa.Column(sa.Float)
#     longitude = sa.Column(sa.Float)
#     count = sa.Column(sa.Integer())
#     expire = sa.Column(sa.Integer())

#     def __repr__(self):
#         return "<spot(id={self.spotId!r})>".format(self=self)


# class SpotSchema(SQLAlchemyAutoSchema):
#     class Meta:
#         model = Spot
#         load_instance = True


# class SpotComment(Base):
#     __tablename__ = "comments"
#     spotId = sa.Column(sa.Integer, primary_key=True)
#     spotTime = sa.Column(sa.DateTime)
#     spotter = sa.Column(sa.String)
#     mode = sa.Column(sa.String(15))
#     frequency = sa.Column(sa.String)
#     band = sa.Column(sa.String(15))
#     source = sa.Column(sa.String(10))
#     comments = sa.Column(sa.String)

#     activator = sa.Column(sa.String, nullable=True)
#     park = sa.Column(sa.String, nullable=True)

#     def __repr__(self):
#         return "<comment({self.spotId!r}:{self.comments!r})>".format(self=self)


# class SpotCommentSchema(SQLAlchemyAutoSchema):
#     class Meta:
#         model = SpotComment
#         load_instance = True


# class Qso(Base):
#     __tablename__ = "qsos"
#     id = sa.Column(sa.Integer, primary_key=True)
#     call = sa.Column(sa.String)
#     rst_sent = sa.Column(sa.String)
#     rst_recv = sa.Column(sa.String)
#     freq = sa.Column(sa.String)
#     freq_rx = sa.Column(sa.String)
#     mode = sa.Column(sa.String(15))
#     comment = sa.Column(sa.String)
#     qso_date = sa.Column(sa.Date)
#     time_on = sa.Column(sa.Time)
#     tx_pwr = sa.Column(sa.Integer)
#     rx_pwr = sa.Column(sa.Integer)
#     gridsquare = sa.Column(sa.String(6))
#     sig = sa.Column(sa.String)
#     sig_info = sa.Column(sa.String)

#     def __init__(self, spot: Spot):
#         self.call = spot.activator
#         self.rst_sent = "599"
#         self.rst_recv = "599"
#         self.freq = spot.frequency
#         self.freq_rx = spot.frequency
#         self.mode = spot.mode
#         self.qso_date = spot.spotTime
#         self.gridsquare = spot.grid6
#         pass

#     def __repr__(self):
#         return "<qso({self.id!r}:{self.call!r} on {self.qso_date!r})>" \
#             .format(self=self)


# class QsoSchema(SQLAlchemyAutoSchema):
#     class Meta:
#         model = Qso
#         load_instance = True


# class UserConfig(Base):
#     __tablename__ = "config"
#     id = sa.Column(sa.Integer, primary_key=True)
#     my_call = sa.Column(sa.String)
#     my_grid6 = sa.Column(sa.String(6))
#     defualt_pwr = sa.Column(sa.Integer)

#     def __repr__(self):
#         return "<config({self.my_call!r}:{self.my_grid6!r} on {self.defualt_pwr!r})>" \
#             .format(self=self)


# class UserConfigSchema(SQLAlchemyAutoSchema):
#     class Meta:
#         model = UserConfig
#         load_instance = True


class DataBase:
    def __init__(self):
        engine = sa.create_engine("sqlite:///spots.db")
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

    def update_activator_stat(self, activator_stat_json):
        schema = ActivatorSchema()
        x = self.get_activator(activator_stat_json['callsign'])
        if x is None:
            to_add = schema.load(activator_stat_json, session=self.session)
            self.session.add(to_add)
        else:
            print(f"updating activator {x.activator_id}")
            schema.load(activator_stat_json, session=self.session, instance=x)

        self.session.commit()

    def get_spots(self):
        return self.session.query(Spot).all()

    def get_spot(self, id: int) -> Spot:
        return self.session.query(Spot).get(id)

    def get_spot_comments(self) -> List[SpotComment]:
        return self.session.query(SpotComment).all()

    def get_by_mode(self, mode: str) -> List[Spot]:
        return self.session.query(Spot).filter(Spot.mode == mode).all()

    def get_activator(self, callsign: str) -> Activator:
        return self.session.query(Activator) \
            .filter(Activator.callsign == callsign) \
            .first()

    def build_qso_from_spot(self, spot_id: int) -> Qso:
        s = self.get_spot(spot_id)
        q = Qso(s)
        print(q)
        return q


if __name__ == "__main__":
    db = DataBase()
    db.update_all_spots()
    all_spots = db.get_spots()
    v = SpotSchema(many=True)
    print(v.dumps(all_spots))
    # cw_spots = db.get_by_mode("CW")
    # print(cw_spots)
    # db.update_spot_comments("KU8T", "K-2263")
    # comments = db.get_spot_comments()
    # print(*text, sep='\n')
