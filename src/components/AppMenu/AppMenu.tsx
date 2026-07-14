import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import { useAppContext } from '../AppContext';
import { ActivatorData } from '../../@types/ActivatorTypes';
import { Alert, Avatar, AlertColor, Snackbar } from '@mui/material';
import StatsDropdownMenu from './MenuItems/StatsDropdownMenu';
import AlertsArea from './AlertsArea';
import { checkApiResponse2, showErrorToast, showSuccessToast } from '../Utilities/util';
import HuntMapMenu from './MenuItems/Map/HuntMapMenu';
import ConfigDropdownMenu from './MenuItems/ConfigDropdownMenu';
import { useMessageQueue } from '../MessageContext';
import CatArea from './CatArea/CatArea';
import CondxArea from './CondxArea/CondxArea';
import RefreshButton from './RefreshButton';
import WsjtxArea from './WsjtxArea/WsjtxArea';
import RightArea from './RightArea';



export default function AppMenu() {

    const currentVal = window.localStorage.getItem('SHOW_BAND_CONDX') || '1';

    const { contextData } = useAppContext();
    const [callsign, setCallsign] = React.useState('');
    const [gravatar, setGravatar] = React.useState('');

    const [snackOpen, setSnackOpen] = React.useState(false);
    const [snackMsg, setSnackMsg] = React.useState('');
    const [alertHidden, setAlertHidden] = React.useState(true);
    const [alertMsg, setAlertMsg] = React.useState('');
    const [severity, setSeverity] = React.useState<AlertColor>('info');
    const [showBandCondx, setShowBandCondx] = React.useState(parseInt(currentVal) == 1 ? true : false);

    const { messages, removeMessage, addMessage } = useMessageQueue();

    // Logic to auto-remove messages after a duration (e.g., 3 seconds)
    React.useEffect(() => {
        if (messages.length > 0) {
            // console.log('messages queue updated', messages);

            if (messages[0].type == 1) {
                showSnackMsg(messages[0]);
            }
            else if (messages[0].type == 0) {
                showAlertMsg(messages[0]);
            }

            const timer = setTimeout(() => {
                removeMessage(messages[0].id); // Remove the oldest message
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [messages, removeMessage]);


    function showSnackMsg(msg: MessageType) {
        setSeverity(msg.color as AlertColor);
        setSnackMsg(msg.message);
        setSnackOpen(true);
    }

    function showAlertMsg(msg: MessageType) {
        setAlertMsg(msg.message);
        setSeverity(msg.color as AlertColor);
        setAlertHidden(false);
    }


    function getCfg() {
        // pywebview is ready so api can be called here:
        console.log('getting user config');

        const y = window.pywebview.api.get_user_config_val('my_call');

        y.then((cfgStr: string) => {
            const obj = checkApiResponse2(cfgStr, addMessage);

            if (!obj.success)
                return;

            const call = obj.val;
            if (call === undefined)
                return;
            setCallsign(call);

            const y = window.pywebview.api.get_activator_stats(call);
            y.then((actStr: string) => {
                const actObj: ActivatorData = JSON.parse(actStr) as ActivatorData;
                const url = getGravatarUrl(actObj.gravatar);
                setGravatar(url);
            });
        });
    };


    function showSuccessPopup(msg: string) {
        showSuccessToast(msg, addMessage);
    }

    function showFailurePopup(msg: string) {
        showErrorToast(msg, addMessage);
    }

    function initState() {
        if (!window.pywebview.state) {
            window.pywebview.state = {};
        }
        window.pywebview.state.showSuccessPopup = showSuccessPopup;
        window.pywebview.state.showFailurePopup = showFailurePopup;

        const val = window.localStorage.getItem('SHOW_BAND_CONDX') || '1';
        setShowBandCondx(parseInt(val) == 1 ? true : false);
    }

    React.useEffect(() => {
        console.log('hooking for user config');

        if (window.pywebview !== undefined && window.pywebview.api !== null) {
            getCfg();
            initState();
        }
        else {
            window.addEventListener('pywebviewready', getCfg);
            window.addEventListener('pywebviewready', initState);
        }
    }, []);

    React.useEffect(() => {
        if (contextData.showBandCondx)
            setShowBandCondx(true);
        else
            setShowBandCondx(false);
    }, [contextData.showBandCondx]);

    function getGravatarUrl(md5: string) {
        //console.log(md5);
        return `https://gravatar.com/avatar/${md5}?d=identicon`;
    }

    function handleAlertClose() {
        // this indicates user has cleared the message
        setAlertMsg('');
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
                    <ConfigDropdownMenu />
                    <StatsDropdownMenu />
                    <HuntMapMenu />
                    {/* <Button onClick={() => checkApiResponse2('{ "success": false, "message": "Test msg" }', addMessage)}>
                        Test
                    </Button> */}

                    {/* user configured alerts (new parks, callsigns, etc) */}
                    <AlertsArea />

                    {/* this Typography contains nothing but it fills space to push our alert to right */}
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        &nbsp;
                    </Typography>

                    {!alertHidden &&
                        <Alert variant="filled" severity={severity} onClose={() => { handleAlertClose() }} >{alertMsg}</Alert>
                    }

                    <RightArea />

                    <RefreshButton />
                </Toolbar>
            </AppBar>

            <Snackbar
                open={snackOpen}
                autoHideDuration={6000}
                onClose={handleSnackClose}
                action={action}>
                <Alert onClose={handleSnackClose} variant='filled' severity={severity} sx={{ width: '100%' }}>
                    {snackMsg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

