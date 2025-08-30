import sqlalchemy as sa
from sqlalchemy.orm import scoped_session

from db.models.location import Location, LocationSchema
from db.models.parks import Park

import logging as L

logging = L.getLogger(__name__)


class LocationQuery:
    '''Internal DB queries stored here.'''

    def __init__(self, session: scoped_session):
        self.session = session

    def load_location_data(self, data: dict):
        '''
        Load data location data from the the POTA api into the database.

        :param dict data: the dict of json data.
        '''
        logging.debug("load_location_data. entry")

        ls = LocationSchema()
        self.clear_locations()

        for program in data:
            prog_id = program['programId']
            for entity in program['entities']:
                entity_id = entity['entityId']
                for location in entity['locations']:
                    loc: Location = ls.load(location, session=self.session)
                    loc.entityId = entity_id
                    loc.programId = prog_id
                    self.session.add(loc)

        self.session.commit()

    def get_location(self, locationId: int) -> Location:
        return self.session.query(Location).get(locationId)

    def get_location_by_desc(self, descriptor: str) -> Location:
        '''
        Given the Location descriptor ("US-AK", "CA-MB"), return a location
        '''
        return self.session.query(Location) \
            .filter(Location.descriptor == descriptor) \
            .first()

    def get_location_hunts(self, descriptor: str) -> tuple[int, int]:
        '''
        For a location, returns the number of parks hunted and the total number
        of parks.

        :param str descriptor: location id (ex "US-AK", "CA-MB")
        :returns tuple[0] = hunt count; tuple[1] = total park number
        '''
        loc = self.get_location_by_desc(descriptor)
        if loc is None:
            return (0, 0)

        total = loc.parks
        hunts = self.session.query(Park.reference).distinct() \
            .where(Park.hunts > 0) \
            .where(Park.locationDesc == descriptor) \
            .count()

        # this query here was causing a large bottle neck when called for each
        # pota spot. use the above query which is quicker
        # hunts = self.session.query(Park.reference).distinct() \
        #     .join(Qso, Park.reference == Qso.sig_info) \
        #     .join(Location, sa.and_(Location.descriptor.contains(descriptor),
        #                             Park.locationDesc.contains(descriptor)))\
        #     .count()

        return (hunts, total)

    def clear_locations(self):
        self.session.execute(sa.text("DELETE FROM LOCATIONS;"))
        self.session.commit()

    def get_all_locations(self) -> list[str]:
        sql = sa.select(Location.descriptor).distinct()
        return self.session.execute(sql) \
            .scalars() \
            .all()
