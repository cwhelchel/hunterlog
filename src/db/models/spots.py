from datetime import datetime
import logging as L
import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

Base = declarative_base()
engine = sa.create_engine("sqlite:///spots.db")

log = L.getLogger(__name__)


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
    loc_hunts = sa.Column(sa.Integer, nullable=True)
    loc_total = sa.Column(sa.Integer, nullable=True)

    # to be calculated by app
    is_qrt = sa.Column(sa.Boolean, nullable=True)

    # pulled from spot comments
    act_cmts = sa.Column(sa.String, nullable=True)
    cw_wpm = sa.Column(sa.Integer, nullable=True)

    spot_source = sa.Column(sa.String)

    def __repr__(self):
        return "<spot(id={self.spotId!r})>".format(self=self)

    def init_from_sota(self, json: any):
        self.spotId = json['id']
        self.activator = json['activatorCallsign']
        try:
            f = str(json['frequency']).replace(',', '.')  # locale fix

            # convert MHz to kHz if freq string is good
            self.frequency = 0.0 if f == '' else float(f) * 1000
        except Exception as ex:
            log.warning('error reading sota freq', exc_info=ex)
            self.frequency = 0.0
        self.mode = str(json['mode']).upper()
        self.reference = f"{json['associationCode']}/{json['summitCode']}"
        # parkName isnt really used use it for activator from sota
        self.parkName = json['activatorName']
        try:
            temp = datetime.strptime(json['timeStamp'], "%Y-%m-%dT%H:%M:%S.%f")
        except ValueError:
            temp = datetime.strptime(json['timeStamp'], "%Y-%m-%dT%H:%M:%S")
        self.spotTime = temp
        self.spotter = json['callsign']
        self.comments = json['comments']
        self.source = json['callsign']
        self.invalid = False
        self.name = json['summitDetails']
        self.locationDesc = json['associationCode']
        self.grid4 = ''
        self.grid6 = ''
        self.latitude = 0.0
        self.longitude = 0.0
        self.count = 0
        self.expire = 0
        self.spot_source = 'SOTA'
        self.hunted_bands = ""
        self.is_qrt = False
        self.act_cmts = ''


class SpotSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Spot
        load_instance = True


Base.metadata.create_all(engine)
