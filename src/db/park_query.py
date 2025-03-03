import logging
import sqlalchemy as sa
from sqlalchemy.orm import scoped_session

from db.models.parks import Park, ParkSchema


class ParkQuery:
    def __init__(self, session: scoped_session):
        self.session = session

    def get_park(self, park: str) -> Park:
        return self.session.query(Park) \
            .filter(Park.reference == park) \
            .first()

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

    def update_summit_data(self, summit: any, delay_commit: bool = False):
        '''
        Update or insert a "park" with info from SOTA api for a summit

        :param any summit: the json for a SOTA summit returned from SOTA api
        :param bool delay_commit: true to not commit the session
        '''
        if summit is None:
            return

        p = self.get_park(summit['summitCode'])

        if p is None:
            logging.debug(f"inserting new {summit['summitCode']}")
            to_add = Park()
            to_add.reference = summit['summitCode']
            to_add.name = summit['name']
            to_add.grid4 = summit['locator'][:4]
            to_add.grid6 = summit['locator']
            to_add.active = 1 if bool(summit['valid']) else 0
            to_add.latitude = summit['latitude']
            to_add.longitude = summit['longitude']
            to_add.parkComments = summit['notes']
            to_add.accessibility = ''
            to_add.sensitivity = ''
            to_add.accessMethods = f"{summit['points']}"
            to_add.activationMethods = f"{summit['altM']} m - {summit['altFt']} ft"  # noqa E501
            to_add.agencies = ''
            to_add.agencyURLs = ''
            to_add.parkURLs = ''
            to_add.parktypeId = 0
            to_add.parktypeDesc = 'SOTA SUMMIT'
            to_add.locationDesc = summit['regionCode']
            to_add.locationName = summit['regionName']
            to_add.entityId = 0
            to_add.entityName = summit['associationName']
            to_add.referencePrefix = summit['regionCode']
            to_add.entityDeleted = 0
            to_add.firstActivator = ''
            to_add.firstActivationDate = ''
            to_add.website = f"https://www.sotadata.org.uk/en/summit/{summit['summitCode']}"  # noqa E501

            self.session.add(to_add)

        if not delay_commit:
            self.session.commit()

    def inc_park_hunt(self, park: any):
        '''
        Increment the hunt count of a park by one. If park is not in db add it.

        :param any park: the json for a POTA park returned from POTA api
        '''
        schema = ParkSchema()
        if park is None:
            # user logged something w/o a park
            return
        p = self.get_park(park['reference'])

        if p is None:
            logging.debug(f"adding new park row for {park['reference']}")
            to_add: Park = schema.load(park, session=self.session)
            to_add.hunts = 1
            # logging.debug(to_add)
            self.session.add(to_add)
            p = to_add
        else:
            logging.debug(f"increment hunts for park {p.reference}")
            p.hunts += 1
            schema.load(park, session=self.session, instance=p)

        self.session.commit()

    def inc_summit_hunt(self, summit_ref: str) -> bool:
        '''
        Increment the hunt count of a summit "park" by one.

        :param string summit_ref: the summit code of the "park"
        :returns true if a summit "park" was found and updated.
        '''
        p = self.get_park(summit_ref)

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
