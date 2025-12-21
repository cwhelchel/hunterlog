from datetime import datetime
import os
from loggers.adif_provider import AdifProvider
from loggers.iadif_logger import IAdifLogger


class GenericFileLogger(IAdifLogger):
    '''
    This is the base class logger for all other loggers in HL. If hooked 
    properly, all adif that's logged also gets logged to a generic adif file.
    '''

    def init_logger(self, **kwargs):
        '''
        Initialize the generic file logger.

        :param **kwargs: see below

        Keyword Arguments:
          * my_call: my callsign
          * my_grid6: my gridsquare
          * log_filename: file to log adif to
          * app_ver: the version to put in adif header

        Child classes can access these kwarg values as member fields with same
        name.
        '''
        self.my_call = kwargs['my_call']
        self.my_grid6 = kwargs['my_grid6']
        self.log_filename = kwargs['log_filename']
        self.app_ver = kwargs['app_ver']
        self.ap = AdifProvider(self.my_call, self.my_grid6)

        if not os.path.exists(self.log_filename):
            with open(self.log_filename, "w", encoding='UTF-8') as f:
                v = self.ap.get_adif_field("programversion", self.app_ver)
                pid = self.ap.get_adif_field("programid", "hunterlog")

                f.write("HUNTER LOG backup log\n")
                f.write(f"Created {datetime.now()}\n")
                f.write(pid)
                f.write(v)
                f.write("<EOH>\n")

    def log_qso(self, qso) -> str:
        adif = self.ap.get_adif(qso)

        with open(self.log_filename, "a", encoding='UTF-8') as file:
            file.write(adif + "\n")

        return adif

    def get_extra_field_adif(self, qso):
        pass
