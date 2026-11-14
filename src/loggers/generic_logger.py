from datetime import datetime
from fs.data_file import DataFile
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
        self.app_ver = kwargs['app_ver']
        self.ap = AdifProvider(self.my_call, self.my_grid6)

        self.log_file = DataFile('hunter.adi')

        if not self.log_file.exists:
            self.log_file.create()

            v = self.ap.get_adif_field("programversion", self.app_ver)
            pid = self.ap.get_adif_field("programid", "hunterlog")

            self.log_file.append('HUNTER LOG backup log\n')
            self.log_file.append(f'Created {datetime.now()}\n')
            self.log_file.append(f'{pid}')
            self.log_file.append(f'{v}')
            self.log_file.append('<EOH>\n')

    def log_qso(self, qso) -> str:
        adif = self.ap.get_adif(qso)
        self.log_file.append(adif + "\n")
        return adif

    def get_extra_field_adif(self, qso):
        pass

    def stage_qso(self, qso):
        pass

    def clear_staged(self):
        pass
