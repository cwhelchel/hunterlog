from abc import ABC, abstractmethod

from db.db import DataBase
from db.models.parks import Park
from db.models.qsos import Qso
from db.models.spots import Spot
from programs.apis.iapi import IApi
from utils.continent import Continents
from utils.distance import Distance
import logging as L

log = L.getLogger(__name__)


class Program(ABC):
    '''
    This base class encapsulates the logic that is needed between different
    OTA programs (POTA, SOTA, WWFF, etc).

    There are a few program agnostic methods here but most are abstract methods
    that any implementing class must provide.
    '''

    def __init__(self, db: DataBase):
        self.continents = Continents()
        self.db = db

    @property
    @abstractmethod
    def api(self) -> IApi:
        '''
        Get the IApi object for the program.

        :returns IApi: concrete IApi object
        '''
        raise NotImplementedError

    @abstractmethod
    def download_reference_data(self, ref_code: str) -> any:
        '''
        Downloads the reference data from the program's API. Should
        return a JSON dict-like object

        :param ref_code str: a singular reference identifier
        :returns bool: Parsed Python object or None
        '''
        raise NotImplementedError

    @abstractmethod
    def parse_ref_data(self, ref_data) -> Park:
        '''
        The program logic for converting the the API provided data for a
        reference into the Hunterlog specific Park row

        :param ref str: a singular reference identifier
        :param ota_ref str: possible comma separated list of references
        :returns bool: False if a ref row not in db
        '''
        raise NotImplementedError

    @abstractmethod
    def get_reference(self,
                      ref: str,
                      pull_from_api: bool = True) -> Park:
        '''
        Return the Park row which contains info about the given reference. Can
        return None

        :param: ref str: the string reference id from the program
        :param: pull_from_api bool: True to download info if not found in db

        :returns Park: model obj (pre-existing name from POTA program)
        '''
        raise NotImplementedError

    @abstractmethod
    def update_spots(self, spots):
        '''
        Updates all the spots in the database for the program.

        Read the given spots and update the db with any meta-data.

        :param: spots any: json the dict from the api
        '''
        raise NotImplementedError

    @abstractmethod
    def build_qso(self, spot: Spot) -> Qso:
        '''
        Convert the given spot object into the Qso object for the program

        :param spot: Spot object stored in db
        :returns Qso: built qso model object
        '''
        raise NotImplementedError

    @property
    @abstractmethod
    def seen_regions(self) -> list[str]:
        '''
        Get the regions seen by the program while parsing spots

        :returns list[str]: list of regions, preferably unique.
        '''
        raise NotImplementedError

    @abstractmethod
    def parse_hunt_data(self, data) -> dict[str, int]:
        '''
        Parse the reference hunt data given and return a dictionary where the
        key is the reference id and the value is the number of hunts.

        :param data: The data in arbitrary format. program dependent.
        :returns  dict[str, int]: dict of total hunts keyed by reference id
        '''
        raise NotImplementedError

    def inc_ref_hunt(self, ref: str, ota_ref: str) -> bool:
        '''
        The program logic for incrementing the hunts for a give ref or list
        of refs. Common between all programs.

        :param ref str: a singular reference identifier
        :param ota_ref str: possible comma separated list of references
        :returns bool: False if a ref row not in db
        '''

        if ota_ref is not None:
            multi = ota_ref.split(',')
            for r in multi:
                self._inc(r)
        else:
            # for programs like wwbota this could be csv list of refs
            multi = ref.split(',')
            log.debug(f"{ref} - > {multi}")
            for r in multi:
                self._inc(r)

    def update_spot_metadata(self, to_add: Spot):
        '''
        Updates common metadata about a given spot. This is common between all
        programs.

        :param to_add: spot object to update
        '''
        park = self.db.parks.get_park(to_add.reference)

        if park is not None:
            to_add.park_hunts = park.hunts
        else:
            to_add.park_hunts = 0

        count = self.db.qsos.get_op_qso_count(to_add.activator)
        to_add.op_hunts = count

        hunted = self.db.qsos.get_spot_hunted_flag(
            to_add.activator, to_add.frequency, to_add.reference)
        bands = self.db.qsos.get_spot_hunted_bands(
            to_add.activator, to_add.reference)

        to_add.hunted = hunted
        to_add.hunted_bands = bands

    def update_qso_dist_bearing(self, q: Qso):
        '''
        Updates distance and bearing to a given qso with a set gridsquare.
        This is common between all programs.

        :param q: qso object to update
        '''
        my_grid = self.db.config.get_value("my_grid6")

        if q.gridsquare:
            dist = Distance.distance(my_grid, q.gridsquare)
            bearing = Distance.bearing(my_grid, q.gridsquare)
            q.distance = dist
            q.bearing = bearing

    def update_half_loaded_ref(self, old: Park, new_ref: Park):
        '''
        Updates a half-loaded park row with new data. Half-loaded parks are
        most likely from stats imports
        '''
        # dont set id, hunts, or reference
        old.name = new_ref.name
        old.accessibility = new_ref.accessibility
        old.accessMethods = new_ref.accessMethods
        old.activationMethods = new_ref.activationMethods
        old.active = new_ref.active
        old.agencyURLs = new_ref.agencyURLs
        old.entityDeleted = new_ref.entityDeleted
        old.agencies = new_ref.agencies
        old.entityId = new_ref.entityId
        old.entityName = new_ref.entityName
        old.firstActivationDate = new_ref.firstActivationDate
        old.firstActivator = new_ref.firstActivator
        old.grid4 = new_ref.grid4
        old.grid6 = new_ref.grid6
        old.latitude = new_ref.latitude
        old.longitude = new_ref.longitude
        old.parkComments = new_ref.parkComments
        old.parkURLs = new_ref.parkURLs
        old.parktypeId = new_ref.parktypeId
        old.parktypeDesc = new_ref.parktypeDesc
        old.locationDesc = new_ref.locationDesc
        old.locationName = new_ref.locationName
        old.referencePrefix = new_ref.referencePrefix
        old.website = new_ref.website

    def _inc(self, ref: str):
        ok = self.db.parks.inc_ref_hunt(ref)
        if not ok:
            json = self.download_reference_data(ref)
            to_add = self.parse_ref_data(json)
            if to_add:
                self.db.session.add(to_add)
                self.db.session.commit()
            if not self.db.parks.inc_ref_hunt(ref):
                log.error('unable to update ref hunt')
