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
import { Alert, Avatar, Tooltip, AlertColor, Snackbar, Button } from '@mui/material';
import StatsMenu from './StatsMenu';

export default function AppMenu() {

    const { contextData, setData } = useAppContext();
    const [callsign, setCallsign] = React.useState('');
    const [gravatar, setGravatar] = React.useState('');
    const [snackOpen, setSnackOpen] = React.useState(false);
    const [errorSeverity, seterrorSeverity] = React.useState<AlertColor>('info');
    const [alertHidden, setAlertHidden] = React.useState(true);

    React.useEffect(() => {
        window.addEventListener('pywebviewready', function () {
            // pywebview is ready so api can be called here:
            let x = window.pywebview.api.get_user_config();
            x.then((cfgStr: string) => {
                let obj: UserConfig = JSON.parse(cfgStr) as UserConfig;
                setCallsign(obj.my_call);
                let y = window.pywebview.api.get_activator_stats(obj.my_call);
                y.then((actStr: string) => {
                    let actObj: ActivatorData = JSON.parse(actStr) as ActivatorData;
                    let url = getGravatarUrl(actObj.gravatar);
                    setGravatar(url);
                });
            })
        })
    }, []);


    function fn() {
        console.log("errorMsg Changed: " + contextData.errorMsg);

        if (contextData.errorMsg !== '') {
            if (["error", "warning", "info"].includes(contextData.errorSeverity)) {
                setAlertHidden(false);
                seterrorSeverity(contextData.errorSeverity as AlertColor);
            } else if (["success"].includes(contextData.errorSeverity)) {
                setSnackOpen(true);
            }
        }
        else {
            setAlertHidden(true);
            seterrorSeverity('info');
        }
    };

    React.useEffect(() => {
        fn();
    }, [contextData.errorMsg]);

    function getGravatarUrl(md5: string) {
        //console.log(md5);
        return `https://gravatar.com/avatar/${md5}?d=identicon`;
    }

    function handleAlertClose() {
        const x = { ...contextData };
        x.errorMsg = '';
        setData(x);
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


                    {/* this Typography contains nothing but it fills space to push our alert to right */}
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        &nbsp;
                    </Typography>
                    {!alertHidden &&
                        <Alert variant="filled" severity={errorSeverity} onClose={() => { handleAlertClose() }} >{contextData.errorMsg}</Alert>
                    }
                    <Tooltip title="Refresh">
                        <IconButton onClick={() => {
                            location.reload();
                        }}>
                            <RefreshIcon color='secondary' />
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