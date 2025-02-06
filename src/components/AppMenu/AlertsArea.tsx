import * as React from 'react';

import { useAppContext } from '../AppContext';
import { Alert, AlertTitle, Box, Button, CircularProgress, Icon, IconButton, Menu, MenuItem, MobileStepper, Tooltip, Typography } from '@mui/material';
import { SpotRow } from '../../@types/Spots';
import './AlertsArea.scss';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SnoozeIcon from '@mui/icons-material/Snooze';

interface AlertData {
    title: string,
    msg: string,
    alertId: number
}

export default function AlertsArea() {
    const { contextData, setData } = useAppContext();
    const [alertHidden, setAlertHidden] = React.useState(true);
    const [alertMultiHidden, setAlertMultiHidden] = React.useState(true);
    const [alertMsg, setAlertMsg] = React.useState('');
    const [alertTitle, setAlertTitle] = React.useState('');
    const [alerts, setAlerts] = React.useState<AlertData[]>([]);
    const [currentAlertId, setCurrentAlertId] = React.useState(-1);
    const [multiParkTitle, setMultiParkTitle] = React.useState('');


    function handleAlertClose() {
        const x = { ...contextData };
        x.errorMsg = '';
        setData(x);

        const step = activeStep;
        let y = [...alerts];
        console.log(`before splice ${y.length}`);
        y.splice(step, 1);
        console.log(`after splice ${y.length}`);

        if (y.length == 0)
            setAlertHidden(true);

        setActiveStep(0);
        // if ((step + 1) <= (y.length - 1)) {
        //     setActiveStep(step + 1);
        // } else {
        //     setActiveStep(step - 1);
        // }
        setAlerts(y);
    }

    function handleSnoozeClick(): void {
        // do nothing for now
    }

    // This function gets called from python
    //
    // json: a JSON object of all alert msgs keyed to the alert title+id
    // keys have this format: 'ALERTNAME+ALERTDBID' ex Texas+3
    function showSpotAlert(json: string) {
        let data = JSON.parse(json);
        console.log(data);
        let currAlerts = [...alerts];

        let k = Object.keys(data);

        k.forEach((key) => {
            const spots = data[key];
            console.log(key);
            console.log(spots);

            let alertName = key.split('+')[0];
            let alertId = key.split('+')[1];
            let alertInt = parseInt(alertId || '-1');

            spots.forEach((alertMsg: string) => {
                currAlerts.push({ title: alertName, msg: alertMsg, alertId: alertInt });
            });
        });

        setAlerts(currAlerts);
    }

    React.useEffect(() => {
        let x = [...alerts];

        // there's no data in alerts, we need to hide it
        if (x.length == 0) {
            console.log('hiding alerts');
            setAlertHidden(true);
            return;
        }

        setAlertHidden(false);
    }, [alerts]);

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null)
            initAlertFunc();
        else
            window.addEventListener('pywebviewready', initAlertFunc);

        function initAlertFunc() {
            if (!window.pywebview.state) {
                window.pywebview.state = {}
            }

            window.pywebview.state.showSpotAlert = showSpotAlert;
        }
    }, []);

    const [activeStep, setActiveStep] = React.useState(0);

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    return (
        <div>
            {/* {!alertHidden &&
                <Alert
                    severity="info"
                    sx={{ fontSize: '0.80rem' }}
                    onClose={() => { handleAlertClose() }} >
                    <AlertTitle sx={{ fontSize: '0.75rem' }}>Example</AlertTitle>
                    Example msg
                </Alert>
            } */}
            {(!alertHidden) &&
                <>
                    <div className='alert-box'>
                        <InfoOutlinedIcon sx={{
                            marginLeft: '0.5em',
                            padding: '2px',
                            color: 'rgb(184, 231, 251)'
                        }} />
                        <div className='alert-body'>
                            <div className='alert-title'>{alerts[activeStep].title}</div>
                            <div>{alerts[activeStep].msg}</div>
                        </div>
                        <IconButton size='small' color='info' onClick={handleSnoozeClick}>
                            <SnoozeIcon sx={{ fontSize: '0.80rem' }} />
                        </IconButton>
                        <IconButton size='small' color='info' onClick={handleAlertClose}>
                            <CloseIcon sx={{ fontSize: '0.80rem' }} />
                        </IconButton>
                    </div>
                    <MobileStepper
                        variant="dots"
                        color='info'
                        steps={alerts.length}
                        position="static"
                        activeStep={activeStep}
                        sx={{ maxWidth: 600, flexGrow: 1 }}
                        nextButton={
                            <Button size="small"
                                color='info'
                                onClick={handleNext}
                                disabled={activeStep === alerts.length - 1}>
                                <KeyboardArrowRight sx={{ fontSize: '0.80rem' }} />
                            </Button>
                        }
                        backButton={
                            <Button
                                color='info'
                                size="small"
                                onClick={handleBack}
                                disabled={activeStep === 0}>
                                <KeyboardArrowLeft sx={{ fontSize: '0.80rem' }} />
                            </Button>
                        } />
                </>
            }
        </div >

    );

    function displayAlert(data: AlertData | undefined) {
        let alertName = data?.title.split('+')[0];
        let alertId = data?.title.split('+')[1];
        let alertInt = parseInt(alertId || '-1');
        setCurrentAlertId(alertInt);
        let t = `Alert from ${alertName || ''}`;
        setAlertTitle(t);
        setAlertMsg(data?.msg || '');
        setAlertHidden(false);
    }

    function displayMultiAlert(title: string) {
        let alertName = title.split('+')[0];
        let alertId = title.split('+')[1];
        let alertInt = parseInt(alertId || '-1');
        //setCurrentAlertId(alertInt);
        let t = `Multiple Parks from ${alertName || ''}`;
        //setAlertTitle(t);
        //setAlertMsg(data?.msg || '');
        setAlertMultiHidden(false);
    }
}
