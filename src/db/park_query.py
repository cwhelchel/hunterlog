import logging
from sqlalchemy.orm import scoped_session

from db.models.parks import Park, ParkSchema


class ParkQuery:
    def __init__(self, session):
        self.session = session

    def get_park(self, park: str) -> Park:
        return self.session.query(Park) \
            .filter(Park.reference == park) \
            .first()

    def update_park_data(self, park: scoped_session):
        '''
        Parks added from stats do not have anything besides hunt count and
        the reference. This method updates the rest of the data.

        :param any park: the json for a POTA park returned from POTA api
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
            p.firstActivationDate = park['firstActivationDate']
            p.website = park['website']

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
