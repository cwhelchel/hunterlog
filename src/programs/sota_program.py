from db.models.parks import Park
from db.models.qsos import Qso
from programs.program import Program
from db.models.spots import Spot
import sqlalchemy as sa
import logging as L
import time

from sota.sota import SotaApi

log = L.getLogger(__name__)


class SotaProgram(Program):

    @property
    def seen_regions(self) -> list[str]:
        return self.regions

    def get_reference(self,
                      ref: str,
                      pull_from_api: bool = True) -> Park:
        if ref is None:
            log.error("get_reference: summit ref was None")
            return

        log.debug(f"get_reference: getting summit {ref}")
        summit = self.db.parks.get_park(ref)

        if summit is None and pull_from_api:
            log.info(f"summit not found in db {ref}")
            api_res = SotaApi().get_summit(ref)
            log.debug(f"summit data from api {api_res}")
            to_add = self.parse_ref_data(api_res)
            if to_add:
                self.db.session.add(to_add)
                self.db.session.commit()
            summit = self.db.parks.get_park(ref)

        return summit

    def update_spots(self, spots):
        self.regions = list[str]()
        start_time = time.perf_counter()

        if spots is None:
            log.warning('sota spots object is Null')
            return

        for sota in spots:
            # the sota spots are returned in a descending spot time order.
            # where the first spot is the newest.
            sota_to_add = Spot()
            sota_to_add.init_from_sota(sota)

            sota_to_add.continent = self.continents.find_continent_sota(
                sota_to_add.reference.split('/')[0]
            )

            # this is sota association code
            self.regions.append(sota_to_add.locationDesc)

            statement = sa.select(Spot) \
                .filter_by(activator=sota['activatorCallsign']) \
                .filter_by(spot_source='SOTA') \
                .order_by(Spot.spotTime.desc())
            row = self.db.session.execute(statement).first()

            # if query returns something, dont add the old spot
            if row:
                if row[0].spotTime < sota_to_add.spotTime:
                    # this check is probably not needed, this'll prob die
                    log.debug("removing and replacing old sota spot")
                    self.db.session.expunge(row[0])
                    self.db.session.add(sota_to_add)
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

                    # log.debug(f"adding wwff spot cmts {cmts}")

                    self.db.insert_spot_comments(act, ref, cmts)
            else:
                self.db.session.add(sota_to_add)

            self.update_spot_metadata(sota_to_add)

        end_time = time.perf_counter()
        elapsed_time = end_time - start_time
        log.debug(f"SOTA Elapsed time: {elapsed_time:.6f} seconds")

    def build_qso(self, spot: Spot) -> Qso:
        name = spot.name
        if spot.grid4 == '':
            sota_api = SotaApi()
            summit = sota_api.get_summit(spot.reference)
            spot.grid4 = summit['locator'][:4]
            spot.grid6 = summit['locator']
            spot.latitude = summit['latitude']
            spot.longitude = summit['longitude']
            self.db.session.commit()

        q = Qso()
        q.init_from_spot(spot, name)
        q.sig = 'SOTA'
        self.update_qso_dist_bearing(q)
        return q

    def inc_ref_hunt(self, ref: str, pota_ref: str):
        summit_code = ref
        ok = self.db.parks.inc_ref_hunt(summit_code)
        if not ok:
            summit = SotaApi().get_summit(summit_code)
            to_add = self.parse_ref_data(summit)
            if to_add:
                self.db.session.add(to_add)
                self.db.session.commit()
            if not self.db.parks.inc_ref_hunt(summit_code):
                log.error('unable to update ref hunt')

    def parse_ref_data(self, summit) -> Park:
        s = Park()
        s.reference = summit['summitCode']
        s.name = summit['name']
        s.grid4 = summit['locator'][:4]
        s.grid6 = summit['locator']
        s.active = 1 if bool(summit['valid']) else 0
        s.latitude = summit['latitude']
        s.longitude = summit['longitude']
        s.parkComments = summit['notes']
        s.accessibility = ''
        s.sensitivity = ''
        s.accessMethods = f"{summit['points']}"
        s.activationMethods = f"{summit['altM']} m - {summit['altFt']} ft"  # noqa E501
        s.agencies = ''
        s.agencyURLs = ''
        s.parkURLs = ''
        s.parktypeId = 0
        s.parktypeDesc = 'SOTA SUMMIT'
        s.locationDesc = summit['regionCode']
        s.locationName = summit['regionName']
        s.entityId = 0
        s.entityName = summit['associationName']
        s.referencePrefix = summit['regionCode']
        s.entityDeleted = 0
        s.firstActivator = ''
        s.firstActivationDate = ''
        s.website = f"https://www.sotadata.org.uk/en/summit/{summit['summitCode']}"  # noqa E501
        return s
