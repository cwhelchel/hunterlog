from db.models.parks import Park
from db.models.qsos import Qso
from programs.program import Program
from db.models.spots import Spot
import logging as L

log = L.getLogger(__name__)


class NoProgram(Program):
    '''
    This is used when entering in a QSO in hunterlog that isnt tied to any OTA
    program
    '''

    @property
    def seen_regions(self) -> list[str]:
        return []

    def get_reference(self,
                      ref: str,
                      pull_from_api: bool = True) -> Park:
        return None

    def update_spots(self, spots):
        return

    def build_qso(self, spot: Spot) -> Qso:
        return Qso()

    def parse_ref_data(self, park) -> Park:
        return None

    def get_state(self, locationDesc: str) -> str:
        return ''

    def download_reference_data(self, ref_code: str) -> any:
        return None
