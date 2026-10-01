# -*- coding: utf-8 -*-

class GPSException(Exception):
    def __init__(self,*args):
        super(GPSException, self).__init__(*args)

# From K6WRU via stackexchange : see https://ham.stackexchange.com/questions/221/how-can-one-convert-from-lat-long-to-grid-square/244#244
# Convert latitude and longitude to Maidenhead grid locators.
#
# Arguments are in signed decimal latitude and longitude. For example,
# the location of my QTH Palo Alto, CA is: 37.429167, -122.138056 or
# in degrees, minutes, and seconds: 37° 24' 49" N 122° 6' 26" W
class LatLongToGridSquare(object):
    upper = 'ABCDEFGHIJKLMNOPQRSTUVWX'
    lower = 'abcdefghijklmnopqrstuvwx'

    @classmethod
    def to_grid(cls,dec_lat, dec_lon):

        if not (-180<=dec_lon<180):
            raise GPSException('longitude must be -180<=lon<180, given %f\n'%dec_lon)
        if not (-90<=dec_lat<90):
            raise GPSException('latitude must be -90<=lat<90, given %f\n'%dec_lat)

        adj_lat = dec_lat + 90.0
        adj_lon = dec_lon + 180.0

        grid_lat_sq = LatLongToGridSquare.upper[int(adj_lat/10)]
        grid_lon_sq = LatLongToGridSquare.upper[int(adj_lon/20)]

        grid_lat_field = str(int(adj_lat%10))
        grid_lon_field = str(int((adj_lon/2)%10))

        adj_lat_remainder = (adj_lat - int(adj_lat)) * 60
        adj_lon_remainder = ((adj_lon) - int(adj_lon/2)*2) * 60

        grid_lat_subsq = LatLongToGridSquare.lower[int(adj_lat_remainder/2.5)]
        grid_lon_subsq = LatLongToGridSquare.lower[int(adj_lon_remainder/5)]

        return grid_lon_sq + grid_lat_sq + grid_lon_field + grid_lat_field + grid_lon_subsq + grid_lat_subsq

    # GPS sentences are encoded
    @classmethod
    def convert_to_degrees(cls, gps_value, direction):
        if direction not in ['N','S','E','W']:
            raise GPSException("Invalid direction specifier for lat/long: {}".format(direction))

        dir_mult = 1
        if direction in ['S','W']:
            dir_mult = -1

        if len(gps_value) < 3:
            raise GPSException("Invalid Value for lat/long: {}".format(gps_value))

        dot_posn = gps_value.index('.')

        if dot_posn < 0:
            raise GPSException("Invalid Format for lat/long: {}".format(gps_value))

        degrees = gps_value[0:dot_posn-2]
        mins = gps_value[dot_posn-2:]

        f_degrees = dir_mult * (float(degrees) + (float(mins) / 60.0))
        return f_degrees

    @classmethod
    def GPGLL_to_grid(cls, GPSLLText):
       # example: $GPGLL,4740.99254,N,12212.31179,W,223311.00,A,A*70\r\n
       try:
           components = GPSLLText.split(",")
           if components[0]=='$GPGLL':
               del components[0]
           if components[5] != 'A':
               raise GPSException("Not a valid GPS fix")
           lat = LatLongToGridSquare.convert_to_degrees(components[0], components[1])
           long = LatLongToGridSquare.convert_to_degrees(components[2], components [3])
           grid = LatLongToGridSquare.to_grid(lat, long)
       except GPSException:
           grid = ""
       return grid

    @classmethod
    def GPGGA_to_grid(cls, GPSGAText):
       # example: $GPGGA, 161229.487, 3723.2475, N, 12158.3416, W, 1, 07, 1.0, 9.0, M, , , , 0000*18
       try:
           components = GPSGAText.split(",")
           if components[0]=='$GPGGA':
               del components[0]
           if components[5] == '0':
               raise GPSException("Not a valid GPS fix")
           lat = LatLongToGridSquare.convert_to_degrees(components[1], components[2])
           long = LatLongToGridSquare.convert_to_degrees(components[3], components [4])
           grid = LatLongToGridSquare.to_grid(lat, long)
       except GPSException:
           grid = ""
       return grid
