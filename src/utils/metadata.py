
from dataclasses import dataclass
import logging
import time
from typing import Optional

from db.db import DataBase
from programs.program import Program


log = logging.getLogger(__name__)


@dataclass
class MetaDatum:
    park_hunts: int
    op_hunt: int
    hunted_flag: bool
    hunted_bands: str
    activator: str
    reference: str


class Metadata:
    # keyed off integer spot ID from api. used in spot table
    _data: dict[int, MetaDatum]

    def __init__(self, db: DataBase):
        self._data = {}
        self._db = db

    def add_spots(self, program_key: str, program: Program, spots: any):
        # parse json spot and update stored metadata to speed up update cycles

        start_time = time.perf_counter()

        spots_parsed = program.parse_spots_data(spots)

        for s in spots_parsed:
            # log.debug(f"parsed spot for metadata {s}")

            hunt_count = self._db.parks.get_park_hunts(s.reference)
            op_count = self._db.qsos.get_op_qso_count(s.activator)
            hunted = self._db.qsos.get_spot_hunted_flag(
                s.activator, s.frequency, s.reference)

            bands = self._db.qsos.get_spot_hunted_bands(
                s.activator, s.reference)

            meta = MetaDatum(hunt_count, op_count, hunted, bands, s.activator, s.reference)  # noqa: E501
            self._data[s.spotId] = meta

        log.debug(f"{self._data}")
        end_time = time.perf_counter()
        elapsed_time = end_time - start_time

        log.debug(f"Metadata {program_key} elapsed time: {elapsed_time:.6f} seconds")  # noqa: E501

    def get_metadata(self, spot_id: int) -> Optional[MetaDatum]:
        res = self._data.get(spot_id)
        return res

    def clear_metadata(self):
        self._data = {}

    def update_metadata(self,
                        spot_id: int,
                        call: str,
                        freq: str,
                        reference: str):
        meta = self._data.get(spot_id)

        if meta is None:
            log.debug(f"no metadata spot_id {spot_id}, query data...")
            meta = next((x for x in self._data.values() if (x.activator == call and x.reference == reference)), None)  # noqa: E501

        if meta is None:
            log.warning(
                f"no metadata to update for: {spot_id} {call} {reference}")
            return

        meta.park_hunts = self._db.parks.get_park_hunts(reference)
        meta.op_hunt = self._db.qsos.get_op_qso_count(call)
        meta.hunted_flag = self._db.qsos.get_spot_hunted_flag(
            call, freq, reference)
        meta.hunted_bands = self._db.qsos.get_spot_hunted_bands(
            call, reference)
