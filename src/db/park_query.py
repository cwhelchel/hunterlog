import sqlalchemy as sa
from sqlalchemy.orm import scoped_session
import logging as L

from db.models.parks import Park, ParkSchema

logging = L.getLogger(__name__)


class ParkQuery:
    def __init__(self, session: scoped_session):
        self.session = session

    def get_park(self, park: str) -> Park:
        try:
            return self.session.query(Park) \
                .filter(Park.reference == park) \
                .first()
        except Exception as ex:
            logging.warning(
                "error in get_park. exception follows:",
                exc_info=ex)
            return None

    def get_parks(self) -> list[Park]:
        return self.session.query(Park).all()

    def insert_parks(self, parks: list[Park]):
        self.session.add_all(parks)
        self.session.commit()

    def delete_parks(self):
        self.session.execute(sa.text("DELETE FROM parks;"))
        self.session.commit()

    def import_park_data(self, json_obj: dict):
        schema = ParkSchema()
        data = schema.load(json_obj, session=self.session, many=True)
        self.insert_parks(data)

    def update_park_data(self, park: any, delay_commit: bool = False):
        '''
        Parks added from stats do not have anything besides hunt count and
        the reference. This method updates the rest of the data.

        :param any park: the json for a POTA park returned from POTA api
        :param bool delay_commit: true to not commit the session
        '''
        if park is None:
            return

        schema = ParkSchema()
        p = self.get_park(park['reference'])

        if p is None:
            logging.debug(f"inserting new {park['reference']}")
            to_add: Park = schema.load(park, session=self.session)
            # logging.debug(to_add)
            self.session.add(to_add)
            p = to_add
        else:
            logging.debug(f"updating data for for park {p.reference}")
            p.name = park['name']
            p.grid4 = park['grid4']
            p.grid6 = park['grid6']
            p.active = park['active']
            p.latitude = park['latitude']
            p.longitude = park['longitude']
            p.parkComments = park['parkComments']
            p.accessibility = park['accessibility']
            p.sensitivity = park['sensitivity']
            p.accessMethods = park['accessMethods']
            p.activationMethods = park['activationMethods']
            p.agencies = park['agencies']
            p.agencyURLs = park['agencyURLs']
            p.parkURLs = park['parkURLs']
            p.parktypeId = park['parktypeId']
            p.parktypeDesc = park['parktypeDesc']
            p.locationDesc = park['locationDesc']
            p.locationName = park['locationName']
            p.entityId = park['entityId']
            p.entityName = park['entityName']
            p.referencePrefix = park['referencePrefix']
            p.entityDeleted = park['entityDeleted']
            p.firstActivator = park['firstActivator']
            p.firstActivationDate = park['firstActivationDate']
            p.website = park['website']

        if not delay_commit:
            self.session.commit()

    def inc_ref_hunt(self, ref_id: str) -> bool:
        '''
        Increment the hunt count of a reference by one

        :param string ref_id: the code of the park, summit, etc
        :returns bool: true if a "park" was found and updated.
        '''
        p = self.get_park(ref_id)

        if p is None:
            return False

        p.hunts += 1
        self.session.commit()
        return True

    def update_park_hunts(self, park: any, hunts: int,
                          delay_commit: bool = True):
        '''
        Update the hunts field of a park in the db with the given hunt. Will
        create a park row if none exists

        :param any park: park json/dic
        :param int hunts: new hunts value
        :param bool delay_commit: if true will not call session.commit
        '''
        schema = ParkSchema()
        obj = self.get_park(park['reference'])

        if obj is None:
            # logging.debug(f"adding new park row for {park}")
            # to_add: Park = schema.load(park, session=self.session)
            to_add = Park()
            to_add.reference = park['reference']
            to_add.hunts = hunts
            # logging.debug(to_add)
            self.session.add(to_add)
            obj = to_add
        else:
            # logging.debug(f"increment hunts for park {obj.reference}")
            # if this was hunted in the app and the the stats are imported
            # this will overwrite and may clear previous hunts
            obj.hunts = hunts
            schema.load(park, session=self.session, instance=obj)

        if not delay_commit:
            self.session.commit()

    def get_hunted_parks(self, location: str) -> list[str]:
        '''
        Returns a list of the references of all hunted parks for a given
        location.
        '''
        sql = sa.select(Park.reference) \
            .where(Park.hunts > 0) \
            .where(Park.locationDesc.contains(location))
        result = self.session.execute(sql)
        return result.scalars().all()
