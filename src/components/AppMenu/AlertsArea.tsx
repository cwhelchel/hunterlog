import * as React from 'react';

import { useAppContext } from '../AppContext';
import { Alert, AlertTitle, Box, Button, CircularProgress, Icon, IconButton, Menu, MenuItem, MobileStepper, Tooltip, Typography } from '@mui/material';
import { SpotRow } from '../../@types/Spots';
import './AlertsArea.scss';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SnoozeIcon from '@mui/icons-material/Snooze';
import { checkApiResponse } from '../../tsx/util';
import FreqButton from '../SpotViewer/FreqButton';

// Update the Button's color options to include an alert option
declare module '@mui/material/IconButton' {
    interface IconButtonPropsColorOverrides {
      alert: true;
    }
  }
  
interface AlertData {
    title: string,
    msg: string,
    alertId: number,
    spotId: number,
    freq: string,
    mode: string
}

export default function AlertsArea() {
    const { contextData, setData } = useAppContext();
    const [alertHidden, setAlertHidden] = React.useState(true);
    const [alerts, setAlerts] = React.useState<AlertData[]>([]);

    function handleAlertClose(event: any) {
        const step = activeStep;

        let y = [...alerts];
        y.splice(step, 1);

        if (y.length == 0)
            setAlertHidden(true);

        if (event.shiftKey) {
            y = [];
            setAlerts(y);
            setAlertHidden(true);
            return;
        }

        setActiveStep(0);
        // if ((step + 1) <= (y.length - 1)) {
        //     setActiveStep(step + 1);
        // } else {
        //     setActiveStep(step - 1);
        // }
        setAlerts(y);
    }

    function handleSnoozeClick(event: any): void {
        // do nothing for now
        if (window.pywebview.api !== null) {
            let curr = [...alerts];
            const id = curr[activeStep].alertId;
            console.log(`Snoozing ${id}`);
            let p = window.pywebview.api.snooze_alert(id);
            p.then((r: string) => {
                checkApiResponse(r, contextData, setData);
            });
            handleAlertClose(event);
        }
    }

    // This function gets called from python
    //
    // json: a JSON object of all alert msgs keyed to the alert title+id
    // keys have this format: 'ALERTNAME+ALERTDBID' ex Texas+3
    function showSpotAlert(json: any) {
        //let data = json;
        //console.log(json);
        //console.log(typeof json);
        let data = JSON.parse(json);
        let currAlerts = [...alerts];

        let k = Object.keys(data);
        console.log(k);

        k.forEach((key) => {
            const spots = data[key];

            let alertName = key.split('+')[0];
            let alertId = key.split('+')[1];
            let alertInt = parseInt(alertId || '-1');

            spots.forEach((alertMsg: any) => {
                //console.log('alertMsg: ' + alertMsg);
                let alertData = alertMsg;//JSON.parse(alertMsg);
                const text = `📢 New ref ${alertData.location}: ${alertData.activator} @ ${alertData.reference} 🔸 ${alertData.mode}(${alertData.freq})`;
                currAlerts.push({ title: alertName, msg: text, alertId: alertInt, freq: alertData.freq, mode: alertData.mode, spotId: alertData.spotId });
            });
        });

        setAlerts(currAlerts);
    }

    React.useEffect(() => {
        // if (contextData.themeMode == 'dark')
        //     setRefreshBtnColor('primary')
        // else if (contextData.themeMode == 'light')
        //     // using primary on light makes it green on green
        //     setRefreshBtnColor('secondary')
    }, [contextData.themeMode]);

    React.useEffect(() => {
        let x = [...alerts];

        // there's no data in alerts, we need to hide it
        if (x.length == 0) {
            // console.log('hiding alerts');
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

    const handleSpotClick = () => {
        const spotId = alerts[activeStep]?.spotId;
        // setting spotId in ctx is connected to HandleSpotRowClick
        const newCtxData = { ...contextData };
        console.log('ALERT: setting spot to ' + spotId);
        newCtxData.spotId = spotId;
        setData(newCtxData);
    }

    return (
        <div>
            {(!alertHidden) &&
                <div className='alert-area'>
                    <div className='alert-box'>
                        <InfoOutlinedIcon sx={{
                            marginLeft: '7px',
                            marginRight: '4px',
                            height: 'auto',
                            padding: '2px',
                            color: 'rgb(184, 231, 251)'
                        }} />
                        <div className='alert-content' onClick={handleSpotClick}>
                            <div className='alert-title'>Alert from: {alerts[activeStep]?.title}</div>
                            <FreqButton 
                                activator={'none'}
                                frequency={alerts[activeStep]?.freq}
                                mode={alerts[activeStep]?.mode} 
                                buttonVariant={'text'} 
                                displayText={alerts[activeStep]?.msg}
                                widthSx='100%'
                                buttonSize='small'
                                color='alert' />
                        </div>
                        <IconButton
                            sx={{ height: 'fit-content' }}
                            size='small'
                            color='alert'
                            onClick={handleSnoozeClick}
                            title='Snooze this alert for 10 minutes'>
                            <SnoozeIcon sx={{ fontSize: '0.80rem' }} />
                        </IconButton>
                        <IconButton
                            sx={{ height: 'fit-content' }}
                            size='small'
                            color='alert'
                            onClick={handleAlertClose}
                            title='Dismiss (Shift+click to dismiss all)'>
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
                </div>
            }
        </div >

    );
}
