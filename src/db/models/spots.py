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
    count = sa.Column(sa.Integer())  # re-spot count on pota.app
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
    continent = sa.Column(sa.String)

    # calculated metadata. set via user
    is_hidden = sa.Column(sa.Boolean, default=False)

    def __repr__(self):
        return "<spot(id={self.spotId!r},call={self.activator!r},src={self.spot_source})>".format(self=self)  # NOQA: E501

    def init_from_sota(self, json: any):
        self.spotId = json['id']
        self.activator = json['activatorCallsign']
        try:
            # new api freq is not string. float in MHz. but can be null
            # for qrt spots
            f = json['frequency']
            if f is not None:
                fx = round((f * 1000.0), 2)
                self.frequency = str(fx)
            else:
                self.frequency = "0.0"

            # convert MHz to kHz if freq string is good
            # self.frequency = 0.0 if f == '' else float(f) * 1000
        except Exception as ex:
            log.warning('error reading sota freq', exc_info=ex)
            self.frequency = 0.0
        self.mode = str(json['mode']).upper()

        # self.reference = f"{json['associationCode']}/{json['summitCode']}"
        # move to api-db2 host. dont need to build summit code
        self.reference = json['summitCode']

        # parkName isnt really used use it for activator from sota
        self.parkName = json['activatorName']
        try:
            # temp = datetime.fromisoformat(json['timeStamp'])
            # new for api-db2
            temp = datetime.strptime(json['timeStamp'], "%Y-%m-%dT%H:%M:%S.%f%z")  # noqa: E501
            temp = temp.replace(tzinfo=None)
        except ValueError:
            temp = datetime.strptime(json['timeStamp'], "%Y-%m-%dT%H:%M:%S%z")
            temp = temp.replace(tzinfo=None)
        self.spotTime = temp
        self.spotter = json['callsign']
        self.comments = json['comments']
        self.source = json['callsign']
        self.invalid = False
        self.name = json['summitName']
        self.locationDesc = json['summitCode'].split('/')[0]
        self.grid4 = ''
        self.grid6 = ''
        self.latitude = 0.0
        self.longitude = 0.0
        self.count = 0
        self.expire = 0
        self.spot_source = 'SOTA'
        self.hunted_bands = ""
        spot_type = json['type']
        self.is_qrt = False if spot_type != 'QRT' else True
        self.act_cmts = ''

    def init_from_wwff(self, json: any, id):
        self.spotId = id
        self.activator = json['ACTIVATOR'].upper()
        try:
            f = str(json['QRG']).replace(',', '.')  # locale fix

            # hunterlog.us re-hosted WWFF spots api sometimes has crazy crap
            # in freq: ':   7003.0'
            if f.startswith(":"):
                f = f[1:].strip()

            # TODO SHOULD BE IN kHz convert MHz to kHz if freq string is good
            self.frequency = 0.0 if f == '' else float(f)
        except Exception as ex:
            log.warning('error reading wwff freq', exc_info=ex)
            self.frequency = 0.0
        self.mode = str(json['MODE']).upper()

        # often WWFF have no mode. default to SSB
        if self.mode is None or self.mode == "":
            self.mode = "SSB"

        self.reference = json['REF']
        # parkName isnt really used use it for activator from sota
        self.parkName = json['ACTIVATOR']
        # TODO
        try:
            temp = datetime.strptime(json['DATE']+json['TIME'], "%Y%m%d%H%M")
        except ValueError as ex:
            log.warning('error reading wwff time+date', exc_info=ex)
            temp = datetime.strptime(json['DATE'], "%Y-%m-%dT%H:%M:%S")
        self.spotTime = temp
        self.spotter = json['SPOTTER'].upper()
        self.comments = json['TEXT']
        self.source = json['SOURCE'].upper()
        self.invalid = False
        self.name = json['NAME']
        # TODO
        self.locationDesc = json['REF'].split('-')[0]
        self.grid4 = ''
        self.grid6 = ''
        self.latitude = 0.0
        self.longitude = 0.0
        self.count = 0
        self.expire = 0
        self.spot_source = 'WWFF'
        self.hunted_bands = ""
        self.is_qrt = False
        self.act_cmts = ''

    def get_state_or_province(self) -> str:
        '''
        POTA spots only. Get state from locationDesc col

        For multi-state refs it uses the first one in the csv list
        '''
        if self.source != 'POTA':
            return ''

        x: str = self.locationDesc
        first = x.split(',')[0]
        if (first.startswith('US') or first.startswith('CA')):
            return first.split('-')[1]
        return ''


class SpotSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Spot
        load_instance = True


Base.metadata.create_all(engine)
