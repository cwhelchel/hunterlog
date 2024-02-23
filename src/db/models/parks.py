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
    name = sa.Column(sa.String, nullable=False)
    grid6 = sa.Column(sa.String)
    hunts = sa.Column(sa.Integer, default=0)
    active = sa.Column(sa.Integer)
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
