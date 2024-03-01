import sqlalchemy as sa
import marshmallow as ma
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from db.utc import utcnow

Base = declarative_base()
engine = sa.create_engine("sqlite:///spots.db")


class Park(Base):
    __tablename__ = "parks"
    id = sa.Column(sa.Integer, primary_key=True)
    reference = sa.Column(sa.String, nullable=False)
    name = sa.Column(sa.String)
    grid4 = sa.Column(sa.String(4))
    grid6 = sa.Column(sa.String(6))
    active = sa.Column(sa.Integer)
    latitude = sa.Column(sa.Float, nullable=True)
    longitude = sa.Column(sa.Float, nullable=True)
    parkComments = sa.Column(sa.String)
    accessibility = sa.Column(sa.String)
    sensitivity = sa.Column(sa.String)
    accessMethods = sa.Column(sa.String)
    activationMethods = sa.Column(sa.String)
    agencies = sa.Column(sa.String)
    agencyURLs = sa.Column(sa.String)
    parkURLs = sa.Column(sa.String)
    parktypeId = sa.Column(sa.Integer)
    parktypeDesc = sa.Column(sa.String)  # full name is name + parktypeDesc
    locationDesc = sa.Column(sa.String)
    locationName = sa.Column(sa.String)
    entityId = sa.Column(sa.Integer)
    entityName = sa.Column(sa.String)
    referencePrefix = sa.Column(sa.String)
    entityDeleted = sa.Column(sa.Integer)
    firstActivator = sa.Column(sa.String)
    firstActivationDate = sa.Column(sa.String)
    website = sa.Column(sa.String)

    # meta and calculated data
    hunts = sa.Column(sa.Integer, default=0)
    last = sa.Column(sa.TIMESTAMP,
                     server_default=utcnow(),
                     onupdate=sa.func.current_timestamp())

    def __repr__(self):
        return "<park({self.id!r}:{self.reference!r} {self.hunts!r} )>" \
            .format(self=self)


class ParkSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Park
        load_instance = True

        # there's a bunch we don't care about in the JSON from the API
        unknown = ma.EXCLUDE


Base.metadata.create_all(engine)
