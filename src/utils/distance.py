'''
This file is basically taken directly from augratin project. thx
'''
from math import radians, sin, cos, asin, sqrt, atan2, pi


class Distance:
    @staticmethod
    def haversine(lon1, lat1, lon2, lat2):
        """
        Calculate the great circle distance in kilometers between two points
        on the earth (specified in decimal degrees)
        """
        # convert degrees to radians
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

        # haversine formula
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        aye = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        cee = 2 * asin(sqrt(aye))
        arrgh = 6372.8  # Radius of earth in kilometers.
        return cee * arrgh

    @staticmethod
    def grid_to_latlon(maiden):
        """
        Converts a maidenhead gridsquare to a latitude longitude pair.
        """
        maiden = str(maiden).strip().upper()

        length = len(maiden)
        if not 8 >= length >= 2 and length % 2 == 0:
            return 0, 0

        lon = (ord(maiden[0]) - 65) * 20 - 180
        lat = (ord(maiden[1]) - 65) * 10 - 90

        if length >= 4:
            lon += (ord(maiden[2]) - 48) * 2
            lat += ord(maiden[3]) - 48

        if length >= 6:
            lon += (ord(maiden[4]) - 65) / 12 + 1 / 24
            lat += (ord(maiden[5]) - 65) / 24 + 1 / 48

        if length >= 8:
            lon += (ord(maiden[6])) * 5.0 / 600
            lat += (ord(maiden[7])) * 2.5 / 600

        return lat, lon

    @staticmethod
    def distance(grid1: str, grid2: str) -> float:
        """
        Takes two maidenhead gridsquares and returns the distance between the
        two in kilometers.
        """
        lat1, lon1 = Distance.grid_to_latlon(grid1)
        lat2, lon2 = Distance.grid_to_latlon(grid2)
        return round(Distance.haversine(lon1, lat1, lon2, lat2))

    @staticmethod
    def distance_miles(grid1: str, grid2: str) -> float:
        """
        Takes two maidenhead gridsquares and returns the distance between the
        two in miles.
        """
        return round(Distance.distance(grid1, grid2) * 0.621371)

    @staticmethod
    def bearing(grid1: str, grid2: str) -> float:
        """
        Takes two maidenhead gridsquares and returns the bearing from the first
        to the second
        """
        lat1, lon1 = Distance.grid_to_latlon(grid1)
        lat2, lon2 = Distance.grid_to_latlon(grid2)
        lat1 = radians(lat1)
        lon1 = radians(lon1)
        lat2 = radians(lat2)
        lon2 = radians(lon2)
        londelta = lon2 - lon1
        why = sin(londelta) * cos(lat2)
        exs = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(londelta)
        brng = atan2(why, exs)
        brng *= 180 / pi

        if brng < 0:
            brng += 360

        return round(brng)
