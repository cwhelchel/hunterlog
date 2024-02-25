import datetime
import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from db.models.spots import Spot
from db.utc import utcnow

Base = declarative_base()
engine = sa.create_engine("sqlite:///spots.db")


class Qso(Base):
    __tablename__ = "qsos"
    qso_id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    call = sa.Column(sa.String)
    rst_sent = sa.Column(sa.String)
    rst_recv = sa.Column(sa.String)
    freq = sa.Column(sa.String)
    freq_rx = sa.Column(sa.String)
    mode = sa.Column(sa.String(15))
    comment = sa.Column(sa.String)
    qso_date = sa.Column(sa.Date)
    time_on = sa.Column(sa.TIMESTAMP, server_default=utcnow())
    tx_pwr = sa.Column(sa.Integer)
    rx_pwr = sa.Column(sa.Integer)
    gridsquare = sa.Column(sa.String(6))
    sig = sa.Column(sa.String)
    sig_info = sa.Column(sa.String)
    # custom app-only data:
    from_app = sa.Column(sa.Boolean, nullable=True)  # true if logged from app
    cnfm_hunt = sa.Column(sa.Boolean, nullable=True)
    # 👆 true confirmed from hunter.csv

    def init_from_spot(self, spot: Spot):
        self.call = spot.activator
        self.rst_sent = "599"
        self.rst_recv = "599"
        self.freq = spot.frequency
        self.freq_rx = spot.frequency
        self.mode = spot.mode
        self.qso_date = spot.spotTime
        self.gridsquare = spot.grid6
        self.sig_info = spot.reference
        self.sig = 'POTA'  # todo support SOTA

    def __repr__(self):
        return "<qso({self.qso_id!r}:{self.call!r} on {self.qso_date!r})>" \
            .format(self=self)


class QsoSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Qso
        load_instance = True


Base.metadata.create_all(engine)
