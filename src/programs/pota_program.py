from db.models.parks import Park, ParkSchema
from db.models.qsos import Qso
from programs.apis import PotaApi
from programs.apis.iapi import IApi
from programs.program import Program
from db.db import DataBase
from db.models.spots import Spot, SpotSchema
import re
import logging as L
import time

from utils.metadata import Metadata

log = L.getLogger(__name__)


class PotaProgram(Program):

    def __init__(self, db: DataBase):
        super().__init__(db)
        self.regions = list[str]()

    @property
    def seen_regions(self) -> list[str]:
        return self.regions

    @property
    def api(self) -> IApi:
        self.pota_api = PotaApi() if self.pota_api is None else self.pota_api
        return self.pota_api

    def test_reference_str(self, ref: str) -> bool:
        if re.match(r"^[A-Z0-9]{2}-[0-9]{4,}", ref):
            return True
        return False

    def get_reference(self,
                      ref: str,
                      pull_from_api: bool = True) -> Park:
        def dl_park(db: DataBase, ref: str):
            api_res = PotaApi().get_park(ref)
            log.debug(f"park data from api: {api_res}")

            to_add = self.parse_ref_data(api_res)
            if to_add:
                db.session.add(to_add)
                db.session.commit()
            park = db.parks.get_park(ref)
            return park

        if ref is None:
            log.error("ref param was None")
            return

        log.debug(f"getting park {ref}")

        park = self.db.parks.get_park(ref)

        if park is None and pull_from_api:
            log.info(f"park not found in db {ref}")
            park = dl_park(self.db, ref)
        elif park.name is None:
            log.info(f"{ref} park found but half-loaded. pulling from api")
            api_res = PotaApi().get_park(ref)
            log.debug(f"park data from api: {api_res}")
            self.db.parks.update_park_data(api_res)
            park = self.db.parks.get_park(ref)

        return park

    def update_spots(self, spots, metadata: Metadata):
        if spots is None:
            log.warning('POTA spots object is Null')
            return
        start_time = time.perf_counter()

        schema = SpotSchema()

        s_list = schema.load(
            spots,
            session=self.db.session,
            transient=True,
            many=True)

        for s in s_list:
            s.spot_source = 'POTA'
            s.continent = self.continents.find_continent(
                s.reference[:2])

            self.db.session.add(s)

            # TODO: optimizations needed in this call
            # get meta data for this spot
            # self.update_spot_metadata(s)

            # metadata is generated done at end of spot download and before
            # this spot update. the spot ids should match to query this data
            meta = metadata.get_metadata(s.spotId)
            if meta:
                s.park_hunts = meta.park_hunts
                s.op_hunts = meta.op_hunt
                s.hunted = meta.hunted_flag
                s.hunted_bands = meta.hunted_bands
            else:
                log.warning(f"cache miss {s.spotId}")

            # sometimes locationDesc can be None. see GR-0071
            if s.locationDesc is not None \
                    and ',' not in s.locationDesc:
                x, y = self.db.locations.get_location_hunts(s.locationDesc)
                s.loc_hunts = x
                s.loc_total = y

                self.regions.append(s.locationDesc[0:2])

            s.is_qrt = False

            if s.comments is not None:
                if re.match(r'.*qrt.*', s.comments.lower()):
                    s.is_qrt = True

        end_time = time.perf_counter()
        elapsed_time = end_time - start_time

        log.debug(f"POTA Elapsed time: {elapsed_time:.6f} seconds")

    def build_qso(self, spot: Spot) -> Qso:
        if (spot is None):
            q = Qso()
            return q

        a = self.db.get_activator(spot.activator)
        name = a.name if a is not None else ""

        q = Qso()
        q.init_from_spot(spot, name)
        q.sig = 'POTA'
        q.state = self.get_state(spot.locationDesc)
        self.update_qso_dist_bearing(q)
        return q

    def parse_ref_data(self, park) -> Park:
        # the Park schema was created directly from the POTA api so we can
        # just use sqlalchemy-marshmallow to load it
        schema = ParkSchema()
        p: Park = schema.load(park, transient=True)
        return p

    def parse_spots_data(self, spot_data) -> list[Spot]:
        schema = SpotSchema()
        spot: list[Spot] = schema.load(spot_data, transient=True, many=True)
        return spot

    def download_reference_data(self, ref_code: str) -> any:
        return PotaApi().get_park(ref_code)

    def get_state(self, locationDesc: str) -> str:
        if not locationDesc or locationDesc == 'None':  # None for k-test
            return ''
        x = locationDesc
        if ',' in locationDesc:
            # take the first one
            x = locationDesc.split(',')[0]

        pre, post = x.split('-')
        if pre in ["US", "CA"]:
            return post

        return ''

    def parse_hunt_data(self, data) -> dict[str, int]:
        return {}
