import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

Base = declarative_base()
engine = sa.create_engine("sqlite:///spots.db")


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

    # meta data regarding this "activation" (activator+park+utcday) as it
    # applies to this specific spot
    hunted = sa.Column(sa.Boolean, nullable=True)  # has this spot been hunted?
    hunted_bands = sa.Column(sa.String, nullable=True)  # list of bands hunted

    # stats for this spot ie. park and op hunts
    park_hunts = sa.Column(sa.Integer, nullable=True)
    op_hunts = sa.Column(sa.Integer, nullable=True)

    def __repr__(self):
        return "<spot(id={self.spotId!r})>".format(self=self)


class SpotSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Spot
        load_instance = True


Base.metadata.create_all(engine)
