import sqlalchemy as sa
import marshmallow as ma
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

Base = declarative_base()
engine = sa.create_engine("sqlite:///spots.db")


class Location(Base):
    __tablename__ = "locations"
    # maps to JSON type for a location from https://api.pota.app/locations/
    # location is the next lowest level, above park
    locationId = sa.Column(sa.Integer, primary_key=True)
    descriptor = sa.Column(sa.String)
    name = sa.Column(sa.String)
    latitude = sa.Column(sa.Float)
    longitude = sa.Column(sa.Float)
    parks = sa.Column(sa.Integer)

    # could be FKs but nah maybe a lookup from RAW JSON
    entityId = sa.Column(sa.Integer)
    programId = sa.Column(sa.Integer)

    def __repr__(self):
        return "<location(id={self.locationId!r})>".format(self=self)


class LocationSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Location
        load_instance = True

        unknown = ma.EXCLUDE


Base.metadata.create_all(engine)
