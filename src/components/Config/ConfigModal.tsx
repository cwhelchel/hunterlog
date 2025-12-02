import * as React from 'react';
import clsx from 'clsx';
import { styled, css } from '@mui/system';
import { Modal as BaseModal } from '@mui/base/Modal';
import Button from '@mui/material/Button';
import { ConfigVer2 } from '../../@types/Config';
import Stack from '@mui/material/Stack';
import { Box, Divider, Tab, Tabs } from '@mui/material';

import './ConfigModal.scss'
import { useConfigContext } from './ConfigContextProvider'
import GeneralSettingsTab from './GeneralSettingsTab';
import LoggerSettingsTab from './LoggerSettingsTab';
import RadioSettingsTab from './RadioSettingsTab';
import ScanningSettingsTab from './ScanningSettingsTab';
import { setErrorMsg } from '../../util';
import { useAppContext } from '../AppContext';


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
            let x = window.pywebview.api.get_user_config2();
            x.then((r: string) => {
                if (r == null) return;
                var cfg2 = JSON.parse(r) as ConfigVer2[];
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
        config.scan_wait_time = Number(getVar(cfg2, "scan_wait_time"));
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
        setVar(config2, "scan_wait_time", config.scan_wait_time.toString());
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
            <Button onClick={handleOpen} style={{
                color: "#bdbdbd"
            }}>
                Configuration
            </Button>
            <Modal
                aria-labelledby="unstyled-modal-title"
                aria-describedby="unstyled-modal-description"
                open={open}
                onClose={handleCancel}
                slots={{ backdrop: StyledBackdrop }}
            >
                <ModalContent sx={{ width: 800, minHeight: 500 }}>
                    <h2 id="unstyled-modal-title" className="modal-title">
                        Configuration
                    </h2>

                    <Tabs value={value}
                        onChange={handleTabChange}
                        aria-label="cfg-tags"
                    >
                        <Tab label={'General'} {...a11yProps(0)} />
                        <Tab label={'CAT'} {...a11yProps(1)} />
                        <Tab label={'Logging'} {...a11yProps(2)} />
                        <Tab label={'Scanning'} {...a11yProps(3)} />
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
                </ModalContent>
            </Modal>
        </>
    );
}

const Backdrop = React.forwardRef<
    HTMLDivElement,
    { open?: boolean; className: string }
>((props, ref) => {
    const { open, className, ...other } = props;
    return (
        <div
            className={clsx({ 'base-Backdrop-open': open }, className)}
            ref={ref}
            {...other}
        />
    );
});

const blue = {
    200: '#99CCFF',
    300: '#66B2FF',
    400: '#3399FF',
    500: '#007FFF',
    600: '#0072E5',
    700: '#0066CC',
};

const grey = {
    50: '#F3F6F9',
    100: '#E5EAF2',
    200: '#DAE2ED',
    300: '#C7D0DD',
    400: '#B0B8C4',
    500: '#9DA8B7',
    600: '#6B7A90',
    700: '#434D5B',
    800: '#303740',
    900: '#1C2025',
};

const Modal = styled(BaseModal)`
  position: fixed;
  z-index: 1300;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledBackdrop = styled(Backdrop)`
  z-index: -1;
  position: fixed;
  inset: 0;
  background-color: rgb(0 0 0 / 0.5);
  -webkit-tap-highlight-color: transparent;
`;

const ModalContent = styled('div')(
    ({ theme }) => css`
    /*font-family: 'IBM Plex Sans', sans-serif;*/
    font-weight: 500;
    text-align: start;
    align-items: stretch;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: hidden;
    background-color: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
    border-radius: 8px;
    border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
    box-shadow: 0 4px 12px
      ${theme.palette.mode === 'dark' ? 'rgb(0 0 0 / 0.5)' : 'rgb(0 0 0 / 0.2)'};
    padding: 24px;
    color: ${theme.palette.mode === 'dark' ? grey[50] : grey[900]};

    & .modal-title {
      margin: 0;
      line-height: 1.5rem;
      margin-bottom: 8px;
    }

    & .modal-description {
      margin: 0;
      line-height: 1.5rem;
      font-weight: 400;
      color: ${theme.palette.mode === 'dark' ? grey[400] : grey[800]};
      margin-bottom: 4px;
    }

    & .modal-config-text {
        margin: 0;
        line-height: 1.1rem;
        font-weight: 300;
        font-size: smaller;
        color: ${theme.palette.mode === 'dark' ? grey[400] : grey[800]};
        margin-bottom: 6px;
      }
  `,
);

const TriggerButton = styled('button')(
    ({ theme }) => css`
    font-family: 'IBM Plex Sans', sans-serif;
    font-weight: 600;
    font-size: 0.875rem;
    line-height: 1.5;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 150ms ease;
    cursor: pointer;
    background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
    border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
    color: ${theme.palette.mode === 'dark' ? grey[200] : grey[900]};
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);

    &:hover {
      background: ${theme.palette.mode === 'dark' ? grey[800] : grey[50]};
      border-color: ${theme.palette.mode === 'dark' ? grey[600] : grey[300]};
    }

    &:active {
      background: ${theme.palette.mode === 'dark' ? grey[700] : grey[100]};
    }

    &:focus-visible {
      box-shadow: 0 0 0 4px ${theme.palette.mode === 'dark' ? blue[300] : blue[200]};
      outline: none;
    }
  `,
);
