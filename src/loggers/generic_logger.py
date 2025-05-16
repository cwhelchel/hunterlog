from datetime import datetime
import os
from loggers.adif_provider import AdifProvider
from loggers.iadif_logger import IAdifLogger


class GenericFileLogger(IAdifLogger, AdifProvider):

    def init_logger(self, **kwargs):
        self.my_call = kwargs['my_call']
        self.my_grid6 = kwargs['my_grid6']
        self.log_filename = kwargs['log_filename']
        self.app_ver = kwargs['app_ver']

        if not os.path.exists(self.log_filename):
            with open(self.log_filename, "w", encoding='UTF-8') as f:
                v = self.get_adif_field("programversion", self.app_ver)
                pid = self.get_adif_field("programid", "hunterlog")

                f.write("HUNTER LOG backup log\n")
                f.write(f"Created {datetime.now()}\n")
                f.write(pid)
                f.write(v)
                f.write("<EOH>\n")

    def log_qso(self, qso) -> str:
        adif = self.get_adif(qso)

        with open(self.log_filename, "a", encoding='UTF-8') as file:
            file.write(adif + "\n")

        return adif
