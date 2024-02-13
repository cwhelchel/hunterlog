from typing import List
import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from pota import Api

Base = declarative_base()


class Spot(Base):
    __tablename__ = "spots"
    spotId = sa.Column(sa.Integer, primary_key=True)
    activator = sa.Column(sa.String)
    frequency = sa.Column(sa.String)
    mode = sa.Column(sa.String(15))
    reference = sa.Column(sa.String(15))
    parkName = sa.Column(sa.String, nullable=True)
    spotTime = sa.Column(sa.DateTime)
    spotter = sa.Column(sa.String())
    comments = sa.Column(sa.String())
    source = sa.Column(sa.String())
    invalid = sa.Column(sa.Boolean, nullable=True)
    name = sa.Column(sa.String())
    locationDesc = sa.Column(sa.String)
    grid4 = sa.Column(sa.String(4))
    grid6 = sa.Column(sa.String(6))
    latitude = sa.Column(sa.Float)
    longitude = sa.Column(sa.Float)
    count = sa.Column(sa.Integer())
    expire = sa.Column(sa.Integer())

    def __repr__(self):
        return "<spot(id={self.spotId!r})>".format(self=self)


class SpotSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Spot
        load_instance = True


class SpotComment(Base):
    __tablename__ = "comments"
    spotId = sa.Column(sa.Integer, primary_key=True)
    spotTime = sa.Column(sa.DateTime)
    spotter = sa.Column(sa.String)
    mode = sa.Column(sa.String(15))
    frequency = sa.Column(sa.String)
    band = sa.Column(sa.String(15))
    source = sa.Column(sa.String(10))
    comments = sa.Column(sa.String)

    activator = sa.Column(sa.String, nullable=True)
    park = sa.Column(sa.String, nullable=True)

    def __repr__(self):
        return "<comment({self.spotId!r}:{self.comments!r})>".format(self=self)


class SpotCommentSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = SpotComment
        load_instance = True


class DataBase:
    def __init__(self, api: Api):
        self.api = api
        engine = sa.create_engine("sqlite:///spots.db")
        self.session = scoped_session(sessionmaker(bind=engine))
        self.session.execute(sa.text('DELETE FROM spots;'))
        self.session.commit()
        Base.metadata.create_all(engine)
        self.schema = SpotSchema()

    def update_all_spots(self):
        json = self.api.get_spots()
        for s in json:
            to_add = self.schema.load(s, session=self.session)
            self.session.add(to_add)
        self.session.commit()

    def update_spot_comments(self, activator_call, park_ref):
        schema = SpotCommentSchema()
        json = self.api.get_spot_comments(activator_call, park_ref)
        for s in json:
            s['activator'] = activator_call
            s['park'] = park_ref
            to_add = schema.load(s, session=self.session)
            self.session.add(to_add)
        self.session.commit()

    def get_spots(self):
        return self.session.query(Spot).all()

    def get_spot(self, id: int) -> Spot:
        return self.session.query(Spot).get(id)

    def get_spot_comments(self) -> List[SpotComment]:
        return self.session.query(SpotComment).all()

    def get_by_mode(self, mode: str) -> List[Spot]:
        return self.session.query(Spot).filter(Spot.mode == mode).all()


if __name__ == "__main__":
    api = Api()
    db = DataBase(api)
    db.update_all_spots()
    all_spots = db.get_spots()
    v = SpotSchema(many=True)
    print(v.dumps(all_spots))
    # cw_spots = db.get_by_mode("CW")
    # print(cw_spots)
    # db.update_spot_comments("KU8T", "K-2263")
    # comments = db.get_spot_comments()
    # print(*text, sep='\n')
