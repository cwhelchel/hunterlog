import sqlalchemy as sa
from sqlalchemy.orm import scoped_session

from db.models.location import Location, LocationSchema
from db.models.qsos import Qso


class LocationQuery:
    '''Internal DB queries stored here.'''

    def __init__(self, session: scoped_session):
        self.session = session

    def load_location_data(self, data: dict):
        '''
        Load data location data from the the POTA api into the database.

        :param dict data: the dict of json data.
        '''
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
        total = loc.parks
        hunts = self.session.query(Qso) \
            .filter(Qso.sig_info == descriptor).count()
        return (hunts, total)

    def clear_locations(self):
        self.session.execute(sa.text("DELETE FROM LOCATIONS;"))
        self.session.commit()
