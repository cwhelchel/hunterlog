import re
from typing import List
import logging as L
import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker


from db.alerts_query import AlertsQuery
from db.filters import Filters
from db.models.qsos import Qso
from db.models.activators import Activator, ActivatorSchema
from db.models.spot_comments import SpotComment, SpotCommentSchema
from db.models.spots import Spot, SpotSchema
from db.models.user_config import UserConfig, UserConfigSchema
from db.park_query import ParkQuery
from db.qso_query import QsoQuery
from db.loc_query import LocationQuery
from db.spot_query import SpotQuery
from sota import SotaApi
from wwff import WwffApi
from utils.callsigns import get_basecall
import upgrades

Base = declarative_base()

logging = L.getLogger(__name__)
# show sql
# L.getLogger('sqlalchemy.engine').setLevel(L.INFO)


VER_FROM_ALEMBIC = 'af395801ad41'
'''
This value indicates the version of the DB scheme the app is made for.

TODO: UPDATE THIS VERSION WHENEVER A ALEMBIC MIGRATION IS CREATED. This is
typically done by running `alembic revision` in the root of the project.
'''


class InitQuery:
    '''Internal DB queries stored here.'''

    def __init__(self, session: scoped_session):
        self.session = session

    def init_config(self):
        current = self.session.query(UserConfig).first()

        if current is None:
            cs = UserConfigSchema()
            logging.debug("creating default user config...")
            s = {'my_call': "N0CALL",
                 'my_grid6': 'FN31pr',
                 'default_pwr': 1500,
                 'flr_host': "127.0.0.1",
                 'flr_port': 12345,
                 'adif_host': "127.0.0.1",
                 'adif_port': 12345}
            default_config = cs.load(s, session=self.session)
            self.session.add(default_config)
            self.session.commit()

    def init_alembic_ver(self):

        v = VER_FROM_ALEMBIC

        table_exists = self._check_for_table()

        if not table_exists:
            self.session.execute(sa.text('CREATE TABLE alembic_version(version_num varchar(32) NOT NULL);'))  # noqa E501
            self.session.execute(sa.text(f"INSERT INTO alembic_version(version_num) VALUES ('{v}');"))  # noqa E501
            self.session.commit()
        else:
            # we need to read the vernum
            sql = 'SELECT version_num FROM alembic_version'
            v = self.session.execute(sa.text(sql))
            db_ver = v.fetchone()[0]

            # after this. logging wont work for this execution.
            if (db_ver != VER_FROM_ALEMBIC):
                upgrades.do_upgrade()

    def _check_for_table(self):
        sql = """SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version';"""  # noqa E501
        r = self.session.execute(sa.text(sql))
        return len(r.all()) > 0


class DataBase:
    def __init__(self):
        engine = sa.create_engine("sqlite:///spots.db", poolclass=sa.NullPool)
        self.session = scoped_session(sessionmaker(bind=engine))
        Base.metadata.create_all(engine)

        self._filters = Filters()
        self._iq = InitQuery(self.session)
        self._lq = LocationQuery(self.session)
        self._qq = QsoQuery(self.session)
        self._pq = ParkQuery(self.session)
        self._sq = SpotQuery(self.session, self.filters)
        self._aq = AlertsQuery(self.session)

        # do this FIRST. will upgrade the db to latest schema
        self._iq.init_alembic_ver()

        self._sq.delete_all_spots()
        self._iq.init_config()

        self.seen_regions = []

    def commit_session(self):
        '''
        Calls session.commit to save any pending changes to db.

        May be required when for methods that use `delay_commit` param
        '''
        self.session.commit()

    '''
    These properties provide methods that were refactored from this class. If
    a method remains, we can assume its to integrated with other parts to be
    easily refactored.
    '''

    @property
    def qsos(self) -> QsoQuery:
        return self._qq

    @property
    def parks(self) -> ParkQuery:
        return self._pq

    @property
    def spots(self) -> SpotQuery:
        return self._sq

    @property
    def locations(self) -> LocationQuery:
        return self._lq

    @property
    def filters(self) -> Filters:
        return self._filters

    @property
    def alerts(self) -> AlertsQuery:
        return self._aq

    def get_spot_metadata(self, to_add: Spot):
        park = self.parks.get_park(to_add.reference)

        if park is not None:
            to_add.park_hunts = park.hunts
        else:
            to_add.park_hunts = 0

        count = self.qsos.get_op_qso_count(to_add.activator)
        to_add.op_hunts = count

        hunted = self.qsos.get_spot_hunted_flag(
            to_add.activator, to_add.frequency, to_add.reference)
        bands = self.qsos.get_spot_hunted_bands(
            to_add.activator, to_add.reference)

        to_add.hunted = hunted
        to_add.hunted_bands = bands

    def update_all_spots(self, spots_json, sota_spots, wwff_spots):
        '''
        Updates all the spots in the database.

        First will delete all previous spots, read the ones passed in
        and perform the logic to update meta info about the spots

        :param dict spots_json: the dict from the pota api
        :param dict sota_spots: the dict from the sota api
        :param dict wwff_spots: the dict from the wwff api. wwff['RCD']
        '''

        logging.info("updating all spots...")

        schema = SpotSchema()
        self.session.execute(sa.text('DELETE FROM spots;'))
        self.session.execute(sa.text('DELETE FROM comments;'))

        # self._sq.insert_test_spot()  # testing code
        # self._aq.insert_test_alert()  # testing alerts

        regions = list[str]()

        test = schema.load(spots_json, session=self.session,
                           transient=True, many=True)

        logging.debug(f"loaded json spots: {test}")

        # for s in spots_json:
        for to_add in test:
            # to_add: Spot = schema.load(s, session=self.session, many=True)
            to_add.spot_source = 'POTA'
            self.session.add(to_add)

            # get meta data for this spot
            self.get_spot_metadata(to_add)

            # sometimes locationDesc can be None. see GR-0071
            if to_add.locationDesc is not None \
                    and ',' not in to_add.locationDesc:
                x, y = self._lq.get_location_hunts(to_add.locationDesc)
                to_add.loc_hunts = x
                to_add.loc_total = y
                regions.append(to_add.locationDesc[0:2])

            to_add.is_qrt = False

            if to_add.comments is not None:
                if re.match(r'.*qrt.*', to_add.comments.lower()):
                    to_add.is_qrt = True

        self._update_sota_spots(sota_spots, regions)

        self._update_wwff_spots(wwff_spots, regions)

        self.session.commit()

        logging.info("spots updated!")

        # set regions list to be used by filter front end
        regions = list(set(regions))
        regions.sort()
        self.seen_regions = regions

    def update_spot(self, spot_id: int, call: str, ref: str):
        logging.info(f"doing single spot update {spot_id}")
        to_mod: Spot = self.spots.get_spot(spot_id)

        if to_mod is None:
            logging.warning("update_spot: didn't find a spot for this id")
            spot_id = self.spots.get_spot_by_actx(call, ref).spotId
            to_mod = self.spots.get_spot(spot_id)
            if to_mod is None:
                self.session.commit()
                return

        self.get_spot_metadata(to_mod)
        self.session.commit()

    def update_activator_stat(self, activator_stat_json) -> int:
        schema = ActivatorSchema()
        x = self.get_activator(activator_stat_json['callsign'])
        if x is None:
            to_add = schema.load(activator_stat_json, session=self.session)
            self.session.add(to_add)
            x = to_add
        else:
            # logging.debug(f"updating activator {x.activator_id}")
            schema.load(activator_stat_json, session=self.session, instance=x)

        self.session.commit()
        return x.activator_id

    def get_spot_comments(self, activator, park: str) -> List[SpotComment]:
        return self.session.query(SpotComment) \
            .filter(SpotComment.activator == activator,
                    SpotComment.park == park) \
            .order_by(SpotComment.spotTime.desc()) \
            .all()

    def get_activator(self, callsign: str) -> Activator:
        basecall = get_basecall(callsign)
        logging.debug(f"get_activator() basecall {basecall}")
        return self.session.query(Activator) \
            .filter(Activator.callsign == basecall) \
            .first()

    def get_activator_name(self, callsign: str) -> str:
        act = self.get_activator(callsign)

        if act is None:
            return ""

        return act.name

    def get_activator_by_id(self, id: int) -> Activator:
        return self.session.query(Activator).get(id)

    def get_user_config(self) -> UserConfig:
        return self.session.query(UserConfig).first()

    def get_version(self) -> str:
        sql = 'SELECT version_num FROM alembic_version'
        v = self.session.execute(sa.text(sql))
        return v.fetchone()[0]

    def insert_spot_comments(self,
                             activator: str,
                             park: str,
                             comments: any):

        # TESTING. leave out for now. maybe add back. seems we can leave
        # comments in place and it doesn't matter if it tries to add more...
        # sql = sa.text(f"DELETE FROM comments WHERE activator='{activator}' AND park='{park}' ;")  # noqa E501
        # self.session.execute(sql)
        # self.session.commit()

        if comments is None:
            return

        for x in comments:
            x["activator"] = activator
            x["park"] = park

        # logging.debug(f"inserting {comments}")
        ss = SpotCommentSchema(many=True)
        to_add = ss.load(comments, session=self.session)
        self.session.add_all(to_add)
        self.session.commit()

        # grab more info from spot comments
        self._sq._update_comment_metadata(activator, park)

    def update_user_config(self, json: any):
        schema = UserConfigSchema()
        config = self.get_user_config()
        schema.load(json, session=self.session, instance=config)
        self.session.commit()

    def build_qso_from_spot(self, spot_id: int) -> Qso:
        '''
        Builds a new `Qso` with data in the spot table.

        Also uses data from Activators table.

        :param int spot_id: the spot PK.
        :returns an untracked `Qso` object with initialized data.
        '''
        s = self.spots.get_spot(spot_id)

        if (s is None):
            q = Qso()
            return q

        if (s.spot_source == 'POTA'):
            a = self.get_activator(s.activator)
            name = a.name if a is not None else ""
        elif s.spot_source == 'SOTA':
            name = s.name
            if s.grid4 == '':
                sota_api = SotaApi()
                summit = sota_api.get_summit(s.reference)
                s.grid4 = summit['locator'][:4]
                s.grid6 = summit['locator']
                s.latitude = summit['latitude']
                s.longitude = summit['longitude']
                self.session.commit()
        elif s.spot_source == 'WWFF':
            # TODO
            name = s.name
            if s.grid4 == '':
                wwff_api = WwffApi()
                wwff = wwff_api.get_wwff_info(s.reference)
                s.grid4 = wwff['locator'][:4]
                s.grid6 = wwff['locator']
                s.latitude = wwff['latitude']
                s.longitude = wwff['longitude']
                self.session.commit()

        q = Qso()
        q.init_from_spot(s, name)
        return q

    def check_alerts(self) -> dict[str, list[Spot]]:
        logging.debug("checking alerts...")
        to_alert = self.alerts.check_spots()
        return to_alert

    def _update_sota_spots(self, sota_spots, regions: list[str]):
        if sota_spots is None:
            logging.warning('sota spots object is Null')
            return

        for sota in sota_spots:
            # the sota spots are returned in a descending spot time order.
            # where the first spot is the newest.
            sota_to_add = Spot()
            sota_to_add.init_from_sota(sota)

            # this is sota association code
            regions.append(sota_to_add.locationDesc)

            statement = sa.select(Spot) \
                .filter_by(activator=sota['activatorCallsign']) \
                .filter_by(spot_source='SOTA') \
                .order_by(Spot.spotTime.desc())
            row = self.session.execute(statement).first()

            # if query returns something, dont add the old spot
            if row:
                if row[0].spotTime < sota_to_add.spotTime:
                    # this check is probably not needed, this'll prob die
                    logging.debug("removing and replacing old sota spot")
                    self.session.expunge(row[0])
                    self.session.add(sota_to_add)
                else:
                    # treat old spots as comments
                    act = sota_to_add.activator
                    ref = sota_to_add.reference
                    cmts = [
                        {
                            'spotId': sota_to_add.spotId,
                            'spotTime': sota_to_add.spotTime.isoformat(),
                            'spotter': sota['callsign'],
                            'comments': sota['comments'],
                            'frequency': str(sota_to_add.frequency),
                            'source': 'RBN' if sota['callsign'] == 'RBNHOLE' else 'SOTA',  # noqa
                            'mode': sota_to_add.mode
                        }
                    ]

                    # logging.debug(f"adding wwff spot cmts {cmts}")

                    self.insert_spot_comments(act, ref, cmts)
            else:
                self.session.add(sota_to_add)

            self.get_spot_metadata(sota_to_add)

    def _update_wwff_spots(self, wwff_spots, regions: list[str]):
        if wwff_spots is None:
            logging.warning('wwff spots object is Null')
            return

        id = 0
        for wwff in wwff_spots['RCD']:
            id = id + 1
            # the wwff spots are returned in a descending spot time order.
            # where the first spot is the newest.
            wwff_to_add = Spot()
            wwff_to_add.init_from_wwff(wwff, id)

            # this is wwff association code
            regions.append(wwff_to_add.locationDesc)

            statement = sa.select(Spot) \
                .filter_by(activator=wwff_to_add.activator) \
                .filter_by(spot_source='WWFF') \
                .order_by(Spot.spotTime.desc())
            row = self.session.execute(statement).first()

            # if query returns something, dont add the old spot
            if row:
                if row[0].spotTime < wwff_to_add.spotTime:
                    # this check is probably not needed, this'll prob die
                    logging.debug("removing and replacing old wwff spot")
                    self.session.delete(row[0])
                    self.session.add(wwff_to_add)
                else:
                    # treat old spots as comments
                    act = wwff_to_add.activator
                    ref = wwff_to_add.reference
                    cmts = [
                        {
                            'spotId': id,
                            'spotTime': wwff_to_add.spotTime.isoformat(),
                            'spotter': wwff['SPOTTER'],
                            'comments': wwff['TEXT'],
                            'frequency': str(wwff_to_add.frequency),
                            'source': wwff_to_add.source,
                            'mode': wwff_to_add.mode
                        }
                    ]
                    # logging.debug(f"adding wwff spot cmts {cmts}")
                    self.insert_spot_comments(act, ref, cmts)
            else:
                self.session.add(wwff_to_add)

            self.get_spot_metadata(wwff_to_add)
