import csv
import os
from dataclasses import dataclass


@dataclass
class LocationStat:
    hunts: int
    activations: int


class PotaStats:
    '''
    This class exposes some POTA statistics calculated from the user's hunter
    and activator csv files.
    '''

    def __init__(self, hunt_file: str, act_file: str = '') -> None:
        self.activated_parks = []
        self.hunted_parks = []
        self.loc_stats: dict[str, LocationStat] = {}
        self.hunted_park_stats: dict[str, int] = {}
        self._get_activations_csv(act_file)
        self._get_hunts_csv(hunt_file)

    def has_hunted(self, ref: str) -> bool:
        '''Returns true if the user has hunted the given POTA reference'''
        return ref in self.hunted_parks

    def has_activated(self, ref: str) -> bool:
        '''Returns true if the user has activated the given POTA reference'''
        return ref in self.activated_parks

    def get_hunt_count(self, location: str) -> int:
        '''Returns number of hunted references in a given location'''
        if location in self.loc_stats:
            return self.loc_stats[location].hunts
        else:
            return 0

    def get_park_hunt_count(self, park: str) -> int:
        '''Returns number of hunter QSOs for a given park'''
        if park in self.hunted_park_stats:
            return self.hunted_park_stats[park]
        else:
            return 0

    def get_actx_count(self, location: str) -> int:
        '''Returns number of activated references in a given location'''
        if location in self.loc_stats:
            return self.loc_stats[location].activations
        else:
            return 0

    def get_all_hunts(self) -> list[str]:
        '''Returns a list of all the hunted parks'''
        return self.hunted_parks

    def _get_activations_csv(self, act_file: str):
        '''
        Read activations downloaded from EXPORT CSV on Users POTA My Stats page
        see https://pota.app/#/user/stats
        '''
        file_n = act_file  # "activator_parks.csv"

        if not os.path.exists(file_n):
            return

        with open(file_n, encoding='utf-8') as csv_file:
            csv_reader = csv.DictReader(csv_file, delimiter=',')
            skip_headers = True
            for row in csv_reader:
                if skip_headers:
                    skip_headers = False
                    continue
                else:
                    location = row["HASC"]
                    self._inc_activations(location)
                    self.activated_parks.append(row['Reference'])

    def _get_hunts_csv(self, hunt_file: str):
        '''
        Read hunted parks downloaded from EXPORT CSV button on the POTA User's
        My Stats page.

        - see https://pota.app/#/user/stats
        '''
        file_n = hunt_file  # "hunter_parks.csv"

        if not os.path.exists(file_n):
            return

        with open(file_n, encoding='utf-8') as csv_file:
            csv_reader = csv.DictReader(csv_file, delimiter=',')
            skip_headers = True
            for row in csv_reader:
                if skip_headers:
                    skip_headers = False
                    continue
                else:
                    park = row['Reference']
                    location = row["HASC"]
                    self._inc_hunts(location)
                    self.hunted_parks.append(park)
                    self.hunted_park_stats[park] = row['QSOs']

    def _inc_hunts(self, location: str):
        if location in self.loc_stats:
            self.loc_stats[location].hunts += 1
        else:
            self.loc_stats[location] = LocationStat(1, 0)

    def _inc_activations(self, location: str):
        if location in self.loc_stats:
            self.loc_stats[location].activations += 1
        else:
            self.loc_stats[location] = LocationStat(0, 1)
