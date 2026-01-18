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
import { setErrorMsg } from '../../../../Utilities/util';
import { useAppContext } from '../../../../AppContext';
import ProgramSettingsTab from './ProgramSettingsTab';
import HlModal2 from '../../../../Common/HlModal';


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
    const { contextData, setData } = useAppContext();

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
        config.enabled_progs = getVar(cfg2, 'enabled_programs');
        config.scan_wait_time = Number(getVar(cfg2, "scan_wait_time"));
        config.stage_qsos = Number(getVar(cfg2, "stage_qsos")) != 0;
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
        setVar(config2, "enabled_programs", config.enabled_progs);
        setVar(config2, "scan_wait_time", config.scan_wait_time.toString());
        setVar(config2, "stage_qsos", config.stage_qsos.toString());
        setConfig2(config2);
    }

    function setVar(cfg2: ConfigVer2[], key: string, val: string) {
        const cfg = cfg2.find(x => x.key == key);
        if (cfg === undefined) {
            console.log(`error: config key ${key} not found`);
            setErrorMsg(`error: config key ${key} not found`, contextData, setData);
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
                    <Tab label={'CAT'} {...a11yProps(1)} />
                    <Tab label={'Logging'} {...a11yProps(2)} />
                    <Tab label={'Programs'} {...a11yProps(3)} />
                    <Tab label={'Scanning'} {...a11yProps(4)} />
                </Tabs>

                <CustomTabPanel value={value} index={0}>
                    <GeneralSettingsTab />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={1}>
                    <RadioSettingsTab />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={2}>
                    <LoggerSettingsTab />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={3}>
                    <ProgramSettingsTab />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={4}>
                    <ScanningSettingsTab />
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

