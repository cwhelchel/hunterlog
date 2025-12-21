from datetime import datetime
from db.models.parks import Park
from db.models.qsos import Qso
from programs.apis.iapi import IApi
from programs.program import Program
from db.models.spots import Spot
import sqlalchemy as sa
import logging as L
import time

from programs.apis import WwbotaApi

log = L.getLogger(__name__)


class WwbotaProgram(Program):

    @property
    def seen_regions(self) -> list[str]:
        return self.regions

    @property
    def api(self) -> IApi:
        self.bunk_api = WwbotaApi() if self.bunk_api is None else self.bunk_api
        return self.bunk_api

    def get_reference(self,
                      ref: str,
                      pull_from_api: bool = True) -> Park:
        if ref is None:
            log.error("get_reference: wwbota ref was None")
            return

        log.debug(f"get_reference: getting {ref}")
        row = self.db.parks.get_park(ref)

        if row is None and pull_from_api:
            log.info(f"ref not found in db {ref}. Pulling from api...")

            self._add_ref_to_db(ref)
            row = self.db.parks.get_park(ref)

        return row

    def update_spots(self, spots):
        self.regions = list[str]()

        start_time = time.perf_counter()

        if spots is None:
            log.warning('spots object is Null')
            return

        # spotid's need to be pota has a UUID in the spot data from api and
        # we use it. but other programs dont and we have to generated ids for
        # the db. WWBOTA starts at 1000
        id: int = 1000
        for bunker in spots:
            to_add = Spot()
            refs = self._init_spot(to_add, bunker, id)
            id = id + 1

            # locationDesc is the WWBOTA 'scheme' 9ABOTA, CABOTA, etc
            # locationDesc could be null
            if to_add.locationDesc:
                loc = to_add.locationDesc.split('|')[0]
                to_add.continent = self.continents.find_continent_wwbota(
                    loc
                )
                self.regions.append(loc)

            statement = sa.select(Spot) \
                .filter_by(activator=bunker['call']) \
                .filter_by(spot_source='WWBOTA') \
                .order_by(Spot.spotTime.desc())

            row = self.db.session.execute(statement).first()

            # if query returns something, dont add the old spot
            if row:
                if row[0].spotTime < to_add.spotTime:
                    # this check is probably not needed, this'll prob die
                    log.debug("removing and replacing old spot")
                    self.db.session.expunge(row[0])
                    self.db.session.add(to_add)
                else:
                    # treat old spots as comments
                    act = to_add.activator
                    ref = to_add.reference
                    cmts = [
                        {
                            'spotId': to_add.spotId,
                            'spotTime': to_add.spotTime.isoformat(),
                            'spotter': bunker['call'],
                            'comments': bunker['comment'],
                            'frequency': str(to_add.frequency),
                            'source': 'WWBOTA',
                            'mode': to_add.mode
                        }
                    ]
                    self.db.insert_spot_comments(act, ref, cmts)
            else:
                self.db.session.add(to_add)

            if len(refs) > 1:
                # setup a n-fer style spot comment so we can use pre-existing
                # n-fer stuff in front end
                act = to_add.activator
                ref = to_add.reference

                test = [x['reference'] for x in refs]
                cmts = [
                    {
                        'spotId': to_add.spotId,
                        'spotTime': to_add.spotTime.isoformat(),
                        'spotter': bunker['call'],
                        'comments': "{Also: " + ",".join(test) + "}",
                        'frequency': str(to_add.frequency),
                        'source': 'WWBOTA',
                        'mode': to_add.mode
                    }
                ]

                self.db.insert_spot_comments(act, ref, cmts)

            self.update_spot_metadata(to_add)

        end_time = time.perf_counter()
        elapsed_time = end_time - start_time
        log.debug(f"WWBOTA Elapsed time: {elapsed_time:.6f} seconds")

    def build_qso(self, spot: Spot) -> Qso:
        name = spot.name
        if spot.grid4 == '':
            api = WwbotaApi()
            bunker = api.get_bunker(spot.reference)
            if bunker is None:
                return
            spot.grid4 = bunker['locator'][:4]
            spot.grid6 = bunker['locator']
            spot.latitude = bunker['lat']
            spot.longitude = bunker['long']
            self.db.session.commit()

        q = Qso()
        q.init_from_spot(spot, name)
        q.sig = 'WWBOTA'
        self.update_qso_dist_bearing(q)
        return q

    def download_reference_data(self, ref_code: str) -> any:
        return WwbotaApi().get_bunker(ref_code)

    def parse_ref_data(self, api_data) -> Park:
        s = Park()
        s.reference = api_data['reference']
        s.name = api_data['name']
        s.grid4 = api_data['locator'][:4]
        s.grid6 = api_data['locator']
        s.active = 1
        s.latitude = api_data['lat']
        s.longitude = api_data['long']
        s.parkComments = ''
        s.accessibility = ''
        s.sensitivity = ''
        s.accessMethods = ''
        s.activationMethods = ''
        s.agencies = ''
        s.agencyURLs = ''
        s.parkURLs = ''
        s.parktypeId = 0
        s.parktypeDesc = 'WWBOTA REF'
        s.locationDesc = api_data['scheme']
        s.locationName = api_data['type']
        s.entityId = api_data['dxcc']
        s.entityName = api_data['dxcc']
        s.referencePrefix = 'B/'
        s.entityDeleted = 0
        s.firstActivator = ''
        s.firstActivationDate = ''
        s.website = ''
        return s

    def _add_ref_to_db(self, ref):
        api_res = WwbotaApi().get_bunker(ref)
        log.debug(f"ref data from api {api_res}")
        to_add = self.parse_ref_data(api_res)
        if to_add:
            self.db.session.add(to_add)
            self.db.session.commit()

    def _init_spot(self, s: Spot, json: any, id: int) -> list[any]:
        result = []

        s.spotId = id
        s.activator = json['call']
        s.mode = str(json['mode']).upper()
        try:
            f = str(json['freq']).replace(',', '.')  # locale fix
            # convert MHz to kHz if freq string is good
            s.frequency = 0.0 if f == '' else float(f) * 1000
        except Exception as ex:
            log.warning('error reading freq', exc_info=ex)
            s.frequency = 0.0

        # pull out first ref. wwbota has better formed multi-ref data.
        # so figure out what to do rest of the list of refs
        first = json["references"][0]

        # spot.reference too small to put in list of ref codes
        s.reference = first['reference']
        s.parkName = first['name']
        try:
            t = json['time'].replace('Z', '')
            temp = datetime.fromisoformat(t)
        except ValueError:
            raise
        s.spotTime = temp
        s.spotter = json['spotter']
        s.comments = json['comment']
        s.source = 'WWBOTA'

        s.locationDesc = first['scheme']

        is_multi_bunker = False
        x = len(json["references"])
        if x > 1:
            is_multi_bunker = True
            for other_ref in json["references"]:
                result.append(other_ref)
                s.locationDesc += '|' + other_ref['reference']

        s.name = first['name']
        if is_multi_bunker:
            s.name += f" (+{x-1} more)"
        s.grid4 = first['locator'][:4] if first['locator'] else ''
        s.grid6 = first['locator'] if first['locator'] else ''
        s.latitude = first['lat']
        s.longitude = first['long']
        s.count = 0
        s.expire = 0
        s.spot_source = 'WWBOTA'
        s.hunted_bands = ""
        s.is_qrt = True if json['type'] == 'QRT' else False
        s.act_cmts = ''
        s.invalid = False

        # send the list of references back to caller
        return result

    def parse_hunt_data(self, data) -> dict[str, int]:
        return {}
