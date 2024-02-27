import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

Base = declarative_base()
engine = sa.create_engine("sqlite:///spots.db")


class Activator(Base):
    __tablename__ = "activators"
    activator_id = sa.Column(sa.Integer, primary_key=True)
    callsign = sa.Column(sa.String)
    name = sa.Column(sa.String)
    qth = sa.Column(sa.String)
    gravatar = sa.Column(sa.String)
    activator = sa.Column(sa.JSON)
    attempts = sa.Column(sa.JSON)
    hunter = sa.Column(sa.JSON)
    endorsements = sa.Column(sa.Integer)
    awards = sa.Column(sa.Integer)
    updated = sa.Column(sa.TIMESTAMP, server_default=sa.func.now(),
                        onupdate=sa.func.current_timestamp())

    def __repr__(self):
        return "<activator(id={self.activator_id!r})>".format(self=self)


class ActivatorSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Activator
        load_instance = True


Base.metadata.create_all(engine)
