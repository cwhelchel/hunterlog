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
    name = sa.Column(sa.String)
    state = sa.Column(sa.String)  # kinda useless for multi-state parks
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
    distance = sa.Column(sa.Float, nullable=True)
    sig = sa.Column(sa.String)
    sig_info = sa.Column(sa.String)
    # custom app-only data:
    from_app = sa.Column(sa.Boolean, nullable=True)  # true if logged from app
    cnfm_hunt = sa.Column(sa.Boolean, nullable=True)
    # 👆 true confirmed from hunter.csv

    def init_from_spot(self, spot: Spot, name: str):
        rst = self.get_default_rst(spot.mode)
        self.call = spot.activator
        self.name = name
        self.state = self.get_state(spot.locationDesc)
        self.rst_sent = rst
        self.rst_recv = rst
        self.freq = spot.frequency
        self.freq_rx = spot.frequency
        self.mode = spot.mode
        self.qso_date = spot.spotTime
        self.gridsquare = spot.grid6
        self.sig_info = spot.reference
        self.sig = 'POTA'  # todo support SOTA

    def get_default_rst(self, mode: str) -> str:
        if (mode in ["SSB", "PHONE"]):
            return "59"
        if (mode == "CW"):
            return "599"
        if (mode in ["FT8", "FT4", "DATA"]):
            return "+00"

        return ""

    def get_state(self, locationDesc: str) -> str:
        if not locationDesc:
            return ''
        x = locationDesc
        if ',' in locationDesc:
            # take the first one
            x = locationDesc.split(',')[0]

        pre, post = x.split('-')
        if pre in ["US", "CA"]:
            return post

        return ''

    def init_from_adif(self, adif: dict):
        '''
        Init the fields from dictionary of ADIF files. see adif-io in utils

        There's a lot we don't import, namely any MY_ fields or Operator data.
        It's assumed to be the configured user is the my part of this.
        '''
        f = float(adif['FREQ'] if 'FREQ' in adif.keys() else '-1.0')
        fs = str(f * 1000) if f >= 0 else ''
        qd = datetime.datetime(
            int(adif['QSO_DATE'][:4]),
            int(adif['QSO_DATE'][4:6]),
            int(adif['QSO_DATE'][6:]))

        qt = datetime.datetime(
            int(adif['QSO_DATE'][:4]),
            int(adif['QSO_DATE'][4:6]),
            int(adif['QSO_DATE'][6:]),
            int(adif['TIME_ON'][:2]),
            int(adif['TIME_ON'][2:4]),
            int(adif['TIME_ON'][4:]))

        self.call = adif['CALL']
        self.name = adif['NAME'] if 'NAME' in adif.keys() else ''
        self.state = adif['STATE'] if 'STATE' in adif.keys() else ''
        self.rst_sent = adif['RST_SENT']
        self.rst_recv = adif['RST_RCVD']
        self.freq = fs
        self.freq_rx = fs
        self.mode = adif['MODE']
        self.comment = adif['COMMENT'] if 'COMMENT' in adif.keys() else ''
        self.qso_date = qd
        self.time_on = qt
        self.gridsquare = adif['GRIDSQUARE'] if 'GRIDSQUARE' in adif.keys() else ''  # noqa: E501
        self.sig_info = adif['SIG_INFO']
        # if we're importing from adif we may have a SIG_INFO with no SIG if so
        # go ahead and fix it (the checks look for valid pota park format in)
        self.sig = adif['SIG'] if 'SIG' in adif.keys() else 'POTA'
        self.tx_pwr = adif['TX_PWR'] if 'TX_PWR' in adif.keys() else ''

        self.from_app = False
        self.cnfm_hunt = True
        # print(self)

    def __repr__(self):
        return "<qso({self.qso_id!r}:{self.call!r} on {self.qso_date!r})>" \
            .format(self=self)


class QsoSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Qso
        load_instance = True


Base.metadata.create_all(engine)
