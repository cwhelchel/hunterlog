import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

Base = declarative_base()
engine = sa.create_engine("sqlite:///spots.db")


class Alerts(Base):
    __tablename__ = "alerts"
    id = sa.Column(sa.Integer, primary_key=True)
    enabled = sa.Column(sa.Boolean, server_default='1')
    new_only = sa.Column(sa.Boolean, server_default='1')
    name = sa.Column(sa.String, nullable=True)
    loc_search = sa.Column(sa.String, nullable=True)
    exclude_modes = sa.Column(sa.String, nullable=True)
    last_triggered = sa.Column(sa.TIMESTAMP, nullable=True)
    dismissed_until = sa.Column(sa.TIMESTAMP, nullable=True)
    dismissed_callsigns = sa.Column(sa.String, nullable=True)

    def __repr__(self):
        return "<alert(id={self.id!r},name={self.name})>".format(self=self)


class AlertsSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Alerts
        load_instance = True


Base.metadata.create_all(engine)
