import * as React from 'react';
import Button from '@mui/material/Button';
import { ConfigVer2 } from '../../../../../@types/Config';
import Stack from '@mui/material/Stack';
import { Box, Divider, Tab, Tabs } from '@mui/material';

import './ConfigModal.scss'
import { useConfigContext } from './ConfigContextProvider'
import GeneralSettingsTab from './GeneralSettingsTab';
import LoggerSettingsTab from './LoggerSettingsTab';
import RadioSettingsTab from './RadioSettingsTab';
import ScanningSettingsTab from './ScanningSettingsTab';
import { showErrorAlert } from '../../../../Utilities/util';
import { useMessageQueue } from '../../../../MessageContext';
import ProgramSettingsTab from './ProgramSettingsTab';
import HlModal2 from '../../../../Common/HlModal';
import WsjtxSettingsTab from './WsjtxSettingsTab';
import DisplaySettingsTab from './DisplaySettingsTab';


const def2: ConfigVer2[] = [];
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            style={{ width: '100%', padding: 5 }}
            hidden={value !== index}
            id={`cfg-tabpanel-${index}`}
            aria-labelledby={`cfg-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
        </div>
    );
}

function getVar(cfg2: ConfigVer2[], key: string): string {
    const cfg = cfg2.find(x => x.key == key);
    return cfg?.val ?? '';
}


function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export default function ConfigModal() {
    const [open, setOpen] = React.useState(false);
    const [config2, setConfig2] = React.useState<ConfigVer2[]>(def2);
    const [value, setValue] = React.useState(0);
    const { config, setConfig } = useConfigContext();
    const { addMessage } = useMessageQueue();

    const handleOpen = () => setOpen(true);

    const handleCancel = () => {
        // config2 is already loaded. just overwrite what was changed
        loadLocalCfg(config2);
        setOpen(false);
    }

    const handleSave = () => {
        if (window.pywebview !== undefined) {
            loadDbCfg();
            window.pywebview.api.set_user_config2(JSON.stringify(config2));
            setOpen(false);
        }
    };

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null)
            initConfig();
        else
            window.addEventListener('pywebviewready', initConfig);

        function initConfig() {
            const x = window.pywebview.api.get_user_config2();
            x.then((r: string) => {
                if (r == null) return;
                const cfg2 = JSON.parse(r) as ConfigVer2[];
                setConfig2(cfg2);
                loadLocalCfg(cfg2);
            });

        }
    }, []);

    function loadLocalCfg(cfg2: ConfigVer2[]) {
        config.my_call = getVar(cfg2, 'my_call');
        config.my_grid6 = getVar(cfg2, 'my_grid6');
        config.default_pwr = Number(getVar(cfg2, 'default_pwr'));
        config.flr_host = getVar(cfg2, 'flr_host');
        config.flr_port = Number(getVar(cfg2, 'flr_port'));
        config.adif_host = getVar(cfg2, 'adif_host');
        config.adif_port = Number(getVar(cfg2, 'adif_port'));
        config.cw_mode = getVar(cfg2, 'cw_mode');
        config.ftx_mode = getVar(cfg2, 'ftx_mode');
        config.qth_string = getVar(cfg2, 'qth_string');
        config.rig_if_type = getVar(cfg2, 'rig_if_type');
        config.logger_type = Number(getVar(cfg2, "logger_type"));
        config.include_rst = Number(getVar(cfg2, "include_rst")) != 0;
        config.hunted_use_basecall = Number(getVar(cfg2, "hunted_use_basecall")) != 0;
        config.enabled_progs = getVar(cfg2, 'enabled_programs');
        config.scan_wait_time = Number(getVar(cfg2, "scan_wait_time"));
        config.stage_qsos = Number(getVar(cfg2, "stage_qsos")) != 0;
        config.wavelog_url = getVar(cfg2, 'wl_url');
        config.wavelog_api_key = getVar(cfg2, 'wl_api_key');
        config.wavelog_station_id = getVar(cfg2, 'wl_station_id');
        config.qrz_api_key = getVar(cfg2, 'qrz_api_key');
        config.use_cw_offset = Number(getVar(cfg2, 'use_cw_offset')) != 0;
        config.cw_offset_min = Number(getVar(cfg2, 'cw_offset_min'));
        config.cw_offset_max = Number(getVar(cfg2, 'cw_offset_max'));
        config.scan_skip_modes = getVar(cfg2, 'scan_skip_modes');
        config.enable_wsjtx_int = Number(getVar(cfg2, 'enable_wsjtx_int')) != 0;
        config.wsjtx_highlight_calls = Number(getVar(cfg2, 'wsjtx_highlight_calls')) != 0;
        config.wsjtx_hunted_bg = getVar(cfg2, 'wsjtx_hunted_bg');
        config.wsjtx_hunted_fg = getVar(cfg2, 'wsjtx_hunted_fg');
        config.wsjtx_spot_bg = getVar(cfg2, 'wsjtx_spot_bg');
        config.wsjtx_spot_fg = getVar(cfg2, 'wsjtx_spot_fg');
        config.wsjtx_new_ref_fg = getVar(cfg2, 'wsjtx_new_ref_fg');
        config.wsjtx_new_ref_bg = getVar(cfg2, 'wsjtx_new_ref_bg');
        config.wsjtx_ip_addr = getVar(cfg2, 'wsjtx_ip_addr');
        config.wsjtx_udp_port = Number(getVar(cfg2, 'wsjtx_udp_port'));
        config.wsjtx_fwd_remote_logger = Number(getVar(cfg2, 'wsjtx_fwd_remote_logger')) != 0;
        config.max_spot_age = Number(getVar(cfg2, 'max_spot_age'));
        setConfig(config);
    }

    function loadDbCfg() {
        setVar(config2, "my_call", config.my_call);
        setVar(config2, "my_grid6", config.my_grid6);
        setVar(config2, "default_pwr", config.default_pwr.toString());
        setVar(config2, "flr_host", config.flr_host);
        setVar(config2, "flr_port", config.flr_port.toString());
        setVar(config2, "adif_host", config.adif_host);
        setVar(config2, "adif_port", config.adif_port.toString());
        setVar(config2, "logger_type", config.logger_type.toString());
        setVar(config2, "cw_mode", config.cw_mode);
        setVar(config2, "ftx_mode", config.ftx_mode);
        setVar(config2, "qth_string", config.qth_string);
        setVar(config2, "rig_if_type", config.rig_if_type);
        setVar(config2, "include_rst", config.include_rst.toString());
        setVar(config2, "hunted_use_basecall", config.hunted_use_basecall.toString());
        setVar(config2, "enabled_programs", config.enabled_progs);
        setVar(config2, "scan_wait_time", config.scan_wait_time.toString());
        setVar(config2, "stage_qsos", config.stage_qsos.toString());
        setVar(config2, "wl_url", config.wavelog_url);
        setVar(config2, "wl_api_key", config.wavelog_api_key);
        setVar(config2, "wl_station_id", config.wavelog_station_id);
        setVar(config2, "qrz_api_key", config.qrz_api_key);
        setVar(config2, "use_cw_offset", config.use_cw_offset.toString());
        setVar(config2, "cw_offset_min", config.cw_offset_min.toString());
        setVar(config2, "cw_offset_max", config.cw_offset_max.toString());
        setVar(config2, "scan_skip_modes", config.scan_skip_modes);
        setVar(config2, "enable_wsjtx_int", config.enable_wsjtx_int.toString());
        setVar(config2, "wsjtx_highlight_calls", config.wsjtx_highlight_calls.toString());
        setVar(config2, "wsjtx_hunted_bg", config.wsjtx_hunted_bg);
        setVar(config2, "wsjtx_hunted_fg", config.wsjtx_hunted_fg);
        setVar(config2, "wsjtx_spot_bg", config.wsjtx_spot_bg);
        setVar(config2, "wsjtx_spot_fg", config.wsjtx_spot_fg);
        setVar(config2, "wsjtx_new_ref_fg", config.wsjtx_new_ref_fg);
        setVar(config2, "wsjtx_new_ref_bg", config.wsjtx_new_ref_bg);
        setVar(config2, "wsjtx_ip_addr", config.wsjtx_ip_addr);
        setVar(config2, "wsjtx_udp_port", config.wsjtx_udp_port.toString());
        setVar(config2, "wsjtx_fwd_remote_logger", config.wsjtx_fwd_remote_logger.toString());
        setVar(config2, "max_spot_age", config.max_spot_age.toString());
        setConfig2(config2);
    }

    function setVar(cfg2: ConfigVer2[], key: string, val: string) {
        const cfg = cfg2.find(x => x.key == key);
        if (cfg === undefined) {
            console.log(`error: config key ${key} not found`);
            //setErrorMsg(`error: config key ${key} not found`, contextData, setData);
            showErrorAlert(`error: config key ${key} not found`, addMessage);
            return;
        }
        cfg.val = val;
    }

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <>
            <Button onClick={handleOpen} >
                Configuration
            </Button>
            <HlModal2
                isOpen={open}
                onClose={handleCancel}
                id='config'
                title='Configuration'
                contentStyle={{ width: 800, minHeight: 500 }}>
                <Tabs value={value}
                    onChange={handleTabChange}
                    aria-label="cfg-tags"
                >
                    <Tab label={'General'} {...a11yProps(0)} />
                    <Tab label={'Display'} {...a11yProps(1)} />
                    <Tab label={'CAT'} {...a11yProps(2)} />
                    <Tab label={'Logging'} {...a11yProps(3)} />
                    <Tab label={'Programs'} {...a11yProps(4)} />
                    <Tab label={'Scanning'} {...a11yProps(5)} />
                    <Tab label={'WSJT-X'} {...a11yProps(6)} />
                </Tabs>

                <CustomTabPanel value={value} index={0}>
                    <GeneralSettingsTab />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={1}>
                    <DisplaySettingsTab />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={2}>
                    <RadioSettingsTab />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={3}>
                    <LoggerSettingsTab />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={4}>
                    <ProgramSettingsTab />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={5}>
                    <ScanningSettingsTab />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={6}>
                    <WsjtxSettingsTab />
                </CustomTabPanel>

                <Divider aria-hidden="true" />

                <Stack
                    direction={'row'}
                    spacing={1}
                    sx={{ 'align-items': 'stretch', 'justify-content': 'space-evenly', 'margin-top': 'auto' }}
                    useFlexGap>
                    <Button fullWidth variant='contained' onClick={handleSave}>Save</Button>
                    <Button fullWidth variant='contained' onClick={handleCancel}>Cancel</Button>
                </Stack>
            </HlModal2>
        </>
    );
}

