import json
from typing import Any
from sqlalchemy.orm import scoped_session
from db.models.config_ver2 import ConfigVer2, ConfigVer2Schema
from db.models.user_config import UserConfig, UserConfigSchema

import logging as L

logging = L.getLogger(__name__)


class ConfigQuery:
    '''Internal DB queries against the Config_Ver2 table are stored here.'''

    # New config row defaults.
    #
    # NOTE: when adding new rows, add them to the bottom and they will be
    # auto-inserted if not found.
    DEFAULTS = [
        {
            'key': 'my_call',
            'val': 'N0CALL',
            'type': 'string',
            'description': '',
            'group': 'general',
            'enabled': 'True',
            'editable': 'True'
        },
        {
            'key': 'my_grid6',
            'val': 'FN31pr',
            'type': 'string',
            'description': '',
            'group': 'general',
            'enabled': 'True',
            'editable': 'True'
        },
        {
            'key': 'default_pwr',
            'val': '100',
            'type': 'int',
            'description': '',
            'group': 'general',
            'enabled': 'True',
            'editable': 'True'
        },
        {
            'key': 'flr_host',
            'val': '127.0.0.1',
            'type': 'string',
            'description': '',
            'group': 'CAT',
            'enabled': 'True',
            'editable': 'True'
        },
        {
            'key': 'flr_port',
            'val': '1234',
            'type': 'int',
            'description': '',
            'group': 'CAT',
            'enabled': 'True',
            'editable': 'True'
        },
        {
            'key': 'adif_host',
            'val': '127.0.0.1',
            'type': 'string',
            'description': '',
            'group': 'logger',
            'enabled': 'True',
            'editable': 'True'
        },
        {
            'key': 'adif_port',
            'val': '1234',
            'type': 'int',
            'description': '',
            'group': 'logger',
            'enabled': 'True',
            'editable': 'True'
        },
        {
            'key': 'logger_type',
            'val': '0',
            'type': 'int',
            'description': 'enum',
            'group': 'logger',
            'enabled': 'True',
            'editable': 'True'
        },
        {
            'key': 'size_x',
            'val': '800',
            'type': 'int',
            'description': '',
            'group': '',
            'enabled': 'True',
            'editable': 'False'
        },
        {
            'key': 'size_y',
            'val': '600',
            'type': 'int',
            'description': '',
            'group': '',
            'enabled': 'True',
            'editable': 'False'
        },
        {
            'key': 'is_max',
            'val': 'False',
            'type': 'bool',
            'description': '',
            'group': '',
            'enabled': 'True',
            'editable': 'False'
        },
        {
            'key': 'cw_mode',
            'val': 'CW',
            'type': 'string',
            'description': '',
            'group': 'CAT',
            'enabled': 'True',
            'editable': 'True'
        },
        {
            'key': 'ftx_mode',
            'val': 'USB',
            'type': 'string',
            'description': '',
            'group': 'CAT',
            'enabled': 'True',
            'editable': 'True'
        },
        {
            'key': 'qth_string',
            'val': '',
            'type': 'string',
            'description': '',
            'group': 'general',
            'enabled': 'True',
            'editable': 'True'
        },
        {
            'key': 'rig_if_type',
            'val': 'flrig',
            'type': 'string',
            'description': '',
            'group': 'CAT',
            'enabled': 'True',
            'editable': 'True'
        },
        {
            'key': 'pos_x',
            'val': '0',
            'type': 'int',
            'description': '',
            'group': '',
            'enabled': 'True',
            'editable': 'False'
        },
        {
            'key': 'pos_y',
            'val': '0',
            'type': 'int',
            'description': '',
            'group': '',
            'enabled': 'True',
            'editable': 'False'
        },
        {
            'key': 'include_rst',
            'val': '1',
            'type': 'bool',
            'description': 'Include RST portion in POTA spot comment',
            'group': 'general',
            'enabled': 'True',
            'editable': 'True'
        },
        {
            'key': 'enabled_programs',
            'val': json.dumps({"POTA": True, "SOTA": True, 'WWFF': True, 'WWBOTA': True}),  # NOQA
            'type': 'json',
            'description': 'List of programs that are enabled',
            'group': 'general',
            'enabled': 'True',
            'editable': 'True'
        }
    ]

    def __init__(self, session: scoped_session):
        self.session = session

    def get_config(self, k) -> ConfigVer2:
        return self.session.query(ConfigVer2) \
            .filter(ConfigVer2.key == k) \
            .first()

    def get_value(self, k: str) -> Any:
        x = self.get_config(k)

        if x is None:
            raise KeyError(f"key {k} not found in config_ver2 table")

        if x.type == "int":
            return int(x.val)
        elif x.type == "string":
            return str(x.val)
        elif x.type == "bool":
            return self._str_to_bool(x.val)
        elif x.type == 'json':
            yyy = json.loads(x.val)
            logging.debug(yyy)
            return yyy
        else:
            logging.warning(f"unknown type: {x.type} for key {k}")
            return str(x.val)

    def set_value(self, k: str, val: Any, commit: bool = False) -> Any:
        x = self.get_config(k)

        if x is None:
            raise KeyError(f"key {k} not found in config_ver2 table")

        if x.type == "int":
            x.val = int(val)
        elif x.type == "string":
            x.val = str(val)
        elif x.type == "bool":
            x.val = True if self._str_to_bool(val) else False
        elif x.type == 'json':
            # x.val = json.dumps(val)
            # we DONT want to dumps here. the exchange of data b/w frontend and
            # back end will already encodes the string once. if we do it again
            # here it just turns it into an encoded string and not an obj.
            # NOTE: any direct calls of set_value with a json type will have
            # to account for this
            x.val = str(val)
        else:
            logging.warning(f"unknown type: {x.type} for key {k}")
            x.val = val

        if commit:
            self.session.commit()

    def get_description(self, k: str) -> str:
        x = self.get_config(k)
        if x is None:
            raise KeyError(f"key {k} not found in config_ver2 table")
        return x.description

    def get_all(self) -> list[ConfigVer2]:
        return self.session.query(ConfigVer2).all()

    def get_all_json(self) -> str:
        x = self.get_all()
        return ConfigVer2Schema().dumps(x, many=True)

    def get_editable(self) -> list[ConfigVer2]:
        return self.session.query(ConfigVer2) \
            .filter(ConfigVer2.editable == True) \
            .all() \
            # noqa E712

    def get_editable_json(self) -> str:
        x = self.get_editable()
        return ConfigVer2Schema().dumps(x, many=True)

    def set_editable_json(self, obj: str):
        x = ConfigVer2Schema().load(
            json.loads(obj),
            session=self.session,
            transient=True,
            many=True)

        for y in x:
            row: ConfigVer2 = y
            if row.editable:
                logging.debug(f"setting {row.key} to {row.val}")
                self.set_value(row.key, row.val)

        self.session.commit()

    def init_config(self):
        current = self.session.query(UserConfig).first()

        if current is None:
            cs = UserConfigSchema()
            logging.debug("creating default user config...")
            s = {'my_call': "N0CALL",
                 'my_grid6': 'FN31pr',
                 'default_pwr': 1500,
                 'flr_host': "127.0.0.1",
                 'flr_port': 12345,
                 'adif_host': "127.0.0.1",
                 'adif_port': 12345}
            default_config = cs.load(s, session=self.session)
            self.session.add(default_config)
            self.session.commit()

    def init_config_v2(self):
        x = self.session.query(ConfigVer2).count()
        y = self.session.query(UserConfig).count()
        cs = ConfigVer2Schema()

        if x == 0 and y == 0:
            logging.debug("creating default user config ver2...")
            default_config = cs.load(
                self.DEFAULTS, session=self.session, many=True)
            self.session.add_all(default_config)
            self.session.commit()
        elif x == 0 and y > 0:
            # migrate users old config values to the new ver
            logging.info("migrating ver1 config to ver2...")
            current = self.session.query(UserConfig).first()

            self.DEFAULTS[0]['val'] = current.my_call
            self.DEFAULTS[1]['val'] = current.my_grid6
            self.DEFAULTS[2]['val'] = str(current.default_pwr)
            self.DEFAULTS[3]['val'] = current.flr_host
            self.DEFAULTS[4]['val'] = str(current.flr_port)
            self.DEFAULTS[5]['val'] = current.adif_host
            self.DEFAULTS[6]['val'] = str(current.adif_port)
            self.DEFAULTS[7]['val'] = str(current.logger_type)
            self.DEFAULTS[8]['val'] = str(current.size_x)
            self.DEFAULTS[9]['val'] = str(current.size_y)
            self.DEFAULTS[10]['val'] = str(current.is_max)
            self.DEFAULTS[11]['val'] = current.cw_mode
            self.DEFAULTS[12]['val'] = current.ftx_mode
            self.DEFAULTS[13]['val'] = current.qth_string or ''
            self.DEFAULTS[14]['val'] = current.rig_if_type
            self.DEFAULTS[15]['val'] = str(current.pos_x)
            self.DEFAULTS[16]['val'] = str(current.pos_y)

            default_config = cs.load(
                self.DEFAULTS, session=self.session, many=True)
            self.session.add_all(default_config)
            self.session.commit()
        else:
            logging.debug("checking cfg v2 rows against defaults...")

            current = self.get_all()
            current_keys = [str(cfg.key) for cfg in current]

            for def_val in self.DEFAULTS:
                if def_val['key'] not in current_keys:
                    logging.warning(f"missing key, adding default {def_val}")

                    add = cs.load(def_val, session=self.session)
                    self.session.add(add)

            self.session.commit()

    def _str_to_bool(self, s):
        """
        Converts a string to boolean based on common truthy/falsy values.
        """
        s_lower = str(s).lower()
        if s_lower in ('true', '1', 't', 'y', 'yes'):
            return True
        elif s_lower in ('false', '0', 'f', 'n', 'no'):
            return False
        else:
            raise ValueError(f"Invalid boolean string: '{s}'")
