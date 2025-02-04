import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';

import { useAppContext } from '../AppContext';
import ConfigModal from '../Config/ConfigModal';
import { UserConfig } from '../../@types/Config';
import { ActivatorData } from '../../@types/ActivatorTypes';
import { Alert, Avatar, Tooltip, AlertColor, Snackbar } from '@mui/material';
import StatsMenu from './StatsMenu';
import AlertsArea from './AlertsArea';

export default function AppMenu() {

    const { contextData, setData } = useAppContext();
    const [callsign, setCallsign] = React.useState('');
    const [gravatar, setGravatar] = React.useState('');
    const [snackOpen, setSnackOpen] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState('');
    const [errorSeverity, seterrorSeverity] = React.useState<AlertColor>('info');
    const [alertHidden, setAlertHidden] = React.useState(true);
    const [refreshBtnColor, setRefreshBtnColor] = React.useState("primary");


    function getCfg() {
        // pywebview is ready so api can be called here:
        let x = window.pywebview.api.get_user_config();
        console.log('getting user config');
        x.then((cfgStr: string) => {
            console.log('got user confg: ' + cfgStr);

            let obj: UserConfig = JSON.parse(cfgStr) as UserConfig;
            setCallsign(obj.my_call);
            let y = window.pywebview.api.get_activator_stats(obj.my_call);
            y.then((actStr: string) => {
                let actObj: ActivatorData = JSON.parse(actStr) as ActivatorData;
                let url = getGravatarUrl(actObj.gravatar);
                setGravatar(url);
            });
        })
    };

    React.useEffect(() => {
        console.log('hooking for user config');

        if (window.pywebview !== undefined && window.pywebview.api !== null) {
            getCfg();
        }
        else {
            window.addEventListener('pywebviewready', getCfg);
        }
    }, []);


    function fn() {
        console.log("errorMsg Changed: " + contextData.errorMsg);

        if (contextData.errorMsg !== '') {
            if (["error", "warning", "info"].includes(contextData.errorSeverity)) {
                setAlertHidden(false);
                seterrorSeverity(contextData.errorSeverity as AlertColor);
                setErrorMsg(contextData.errorMsg);
            } else if (["success"].includes(contextData.errorSeverity)) {
                setSnackOpen(true);
            }
        }
        else if (errorMsg === '') {
            // dont hide if there's still a message
            setAlertHidden(true);
            seterrorSeverity('info');
        }
    };

    React.useEffect(() => {
        fn();
    }, [contextData.errorMsg]);


    React.useEffect(() => {
        if (contextData.themeMode == 'dark')
            setRefreshBtnColor('primary')
        else if (contextData.themeMode == 'light')
            // using primary on light makes it green on green
            setRefreshBtnColor('secondary')
    }, [contextData.themeMode]);

    function getGravatarUrl(md5: string) {
        //console.log(md5);
        return `https://gravatar.com/avatar/${md5}?d=identicon`;
    }

    function handleAlertClose() {
        const x = { ...contextData };
        x.errorMsg = '';
        setData(x);
        // this indicates user has cleared the message
        setErrorMsg('');
        setAlertHidden(true);
    }


    const handleSnackClose = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setSnackOpen(false);
        // clearout the msg to recieve new ones
        handleAlertClose();
    };

    const action = (
        <React.Fragment>
            <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleSnackClose}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </React.Fragment>
    );

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Avatar src={gravatar} >
                    </Avatar>
                    <Typography variant="h6" color="inherit"
                        component="div" ml={1} mr={1}>
                        {callsign}
                    </Typography>
                    <ConfigModal />
                    <StatsMenu />

                    <AlertsArea />

                    {/* this Typography contains nothing but it fills space to push our alert to right */}
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        &nbsp;
                    </Typography>

                    {!alertHidden &&
                        <Alert variant="filled" severity={errorSeverity} onClose={() => { handleAlertClose() }} >{errorMsg}</Alert>
                    }
                    <Tooltip title="Refresh">
                        <IconButton onClick={() => {
                            location.reload();
                        }}>
                            <RefreshIcon color={refreshBtnColor} />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>



            <Snackbar
                open={snackOpen}
                autoHideDuration={6000}
                onClose={handleSnackClose}
                message={contextData.errorMsg}
                action={action}
            />
        </Box>
    );
}