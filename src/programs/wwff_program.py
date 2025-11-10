from db.models.parks import Park
from db.models.qsos import Qso
from programs.program import Program
from db.models.spots import Spot
import sqlalchemy as sa
import logging as L
import time

from programs.apis import WwffApi

log = L.getLogger(__name__)


class WwffProgram(Program):

    @property
    def seen_regions(self) -> list[str]:
        return self.regions

    def get_reference(self,
                      ref: str,
                      pull_from_api: bool = True) -> Park:
        if ref is None:
            log.error("get_reference: WWFF ref param was None")
            return

        log.debug(f"get_reference: getting wwff {ref}")

        wwff = self.db.parks.get_park(ref)

        if wwff is None and pull_from_api:
            log.info(f"wwff not found in db {ref}")
            api_res = WwffApi().get_wwff_info(ref)
            log.debug(f"wwff data from api {api_res}")
            to_add = self.parse_ref_data(api_res)
            if to_add:
                self.db.session.add(to_add)
                self.db.session.commit()
            wwff = self.db.parks.get_park(ref)

        return wwff

    def update_spots(self, spots):
        self.regions = list[str]()
        start_time = time.perf_counter()

        if spots is None:
            log.warning('wwff spots object is Null')
            return

        id = 0
        for wwff in spots['RCD']:
            id = id + 1
            # the wwff spots are returned in a descending spot time order.
            # where the first spot is the newest.
            wwff_to_add = Spot()
            wwff_to_add.init_from_wwff(wwff, id)

            # this is wwff association code
            self.regions.append(wwff_to_add.locationDesc)

            statement = sa.select(Spot) \
                .filter_by(activator=wwff_to_add.activator) \
                .filter_by(spot_source='WWFF') \
                .order_by(Spot.spotTime.desc())
            row = self.db.session.execute(statement).first()

            # if query returns something, dont add the old spot
            if row:
                if row[0].spotTime < wwff_to_add.spotTime:
                    # this check is probably not needed, this'll prob die
                    log.debug("removing and replacing old wwff spot")
                    self.db.session.delete(row[0])
                    self.db.session.add(wwff_to_add)
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
                    self.db.insert_spot_comments(act, ref, cmts)
            else:
                self.db.session.add(wwff_to_add)

            self.update_spot_metadata(wwff_to_add)

        end_time = time.perf_counter()
        elapsed_time = end_time - start_time
        log.debug(f"WWFF Elapsed time: {elapsed_time:.6f} seconds")

    def build_qso(self, spot: Spot) -> Qso:
        # TODO
        name = spot.name
        if spot.grid4 == '':
            wwff_api = WwffApi()
            wwff = wwff_api.get_wwff_info(spot.reference)
            spot.grid4 = wwff['locator'][:4]
            spot.grid6 = wwff['locator']
            spot.latitude = wwff['latitude']
            spot.longitude = wwff['longitude']
            self.db.session.commit()

        q = Qso()
        q.init_from_spot(spot, name)
        q.sig = 'WWFF'
        self.update_qso_dist_bearing(q)
        return q

    def inc_ref_hunt(self, ref: str, ota_ref: str):
        wwff_code = ref
        ok = self.db.parks.inc_ref_hunt(wwff_code)
        if not ok:
            api_res = WwffApi().get_wwff_info(wwff_code)
            to_add = self.parse_ref_data(api_res)
            if to_add:
                self.db.session.add(to_add)
                self.db.session.commit()
            self.db.parks.inc_ref_hunt(wwff_code)

    def parse_ref_data(self, wwff) -> Park:
        r = Park()
        r.reference = wwff['ref']
        r.name = wwff['name']
        r.grid4 = wwff['locator'][:4]
        r.grid6 = wwff['locator']
        # TODO to_add.active = 1 if bool(wwff['valid']) else 0
        r.active = 1
        r.latitude = wwff['latitude']
        r.longitude = wwff['longitude']
        r.parkComments = wwff['comment']
        r.accessibility = ''
        r.sensitivity = ''
        r.accessMethods = ''
        r.activationMethods = ''
        r.agencies = ''
        r.agencyURLs = ''
        r.parkURLs = ''
        r.parktypeId = 0
        r.parktypeDesc = 'WWFF LOCATION'
        r.locationDesc = wwff['dxcc']
        r.locationName = wwff['name']
        r.entityId = 0
        r.entityName = ''
        r.referencePrefix = wwff['ref'].split('-')[0]
        r.entityDeleted = 0
        r.firstActivator = ''
        r.firstActivationDate = ''
        r.website = wwff['wikipedia']
        return r
