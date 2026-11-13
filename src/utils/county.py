import json
import logging as L

from fs.data_file import DataFile

log = L.getLogger(__name__)


class County:
    def __init__(self):
        self.file = DataFile('hl_county_file.json')
        if not self.file.exists:
            raise FileNotFoundError(f"County file not found: {self.file.full_path}")  # NOQA

        self.init_file()

    def __str__(self):
        return f"<{self.file.name}>"

    def init_file(self):
        lines = self.file.read()
        items = json.loads(lines)

        self.pota_list = {item["POTA-ID"]: {"county": item["COUNTIES"], "state": item["LOCATION"]} for item in items}  # NOQA
        self.wwff_list = {item["WWFF-ID"]: {"county": item["COUNTIES"], "state": item["LOCATION"]} for item in items}  # NOQA

        log.debug(f"county file loaded: {len(items)} entries")

    def find_county(self, ref: str) -> dict:
        if ref.startswith("US-"):
            return self.pota_list.get(ref)
        elif ref.startswith("KFF-"):
            return self.wwff_list.get(ref)
        else:
            # log.warning(f"unknown reference format: {ref}")
            return None

    def get_county_str(self, ref: str) -> str:
        county_info = self.find_county(ref)
        if county_info:
            state = county_info["state"]
            county = county_info["county"]
            return f"{state[3:]}, {county}"
        return ""
