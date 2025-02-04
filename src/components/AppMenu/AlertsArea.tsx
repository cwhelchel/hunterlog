import * as React from 'react';

import { useAppContext } from '../AppContext';
import { Alert, AlertTitle, Button, CircularProgress, Menu, MenuItem } from '@mui/material';
import { SpotRow } from '../../@types/Spots';
import './AlertsArea.scss';

interface AlertData {
    title: string,
    msg: string,
    callsign: string
}

export default function AlertsArea() {
    const { contextData, setData } = useAppContext();
    const [alertHidden, setAlertHidden] = React.useState(true);
    const [alertMsg, setAlertMsg] = React.useState('');
    const [alertTitle, setAlertTitle] = React.useState('');
    const [alerts, setAlerts] = React.useState<AlertData[]>([]);
    const [currentAlertId, setCurrentAlertId] = React.useState(-1);

    function handleAlertClose() {
        const x = { ...contextData };
        x.errorMsg = '';
        setData(x);

        let y = [...alerts];
        let d = y.pop();
        console.log('popped from dismissal: ' + d?.msg);
        setAlerts(y);

        let lastAlert = currentAlertId;

        if (d !== undefined) {
            // this is more alerts to display...
            // let alertName = d?.title.split('+')[0];
            // let t = `Alert from ${alertName || ''}`;
            // setAlertTitle(t);
            // setAlertMsg(d?.msg || '');
            // setAlertHidden(false);
            displayAlert(d);
        } else {
            // this indicates user has cleared the message
            setAlertMsg('');
            setAlertHidden(true);
            setAlertTitle('');
        }

        // TODO: code to dismiss alert in backend
    }

    // This function gets called from python
    //
    // title: contains the name of the alert and the alert db id separated by
    // a plus sign: 'NAME+1'
    // spotId: the db id of the spot
    function showSpotAlert(title: string, spotId: number) {

        // cache this for next alert
        let x = [...alerts];

        let p = window.pywebview.api.get_spot(spotId);
        p.then((r: string) => {
            let spot = JSON.parse(r) as SpotRow;
            if (spot) {
                let msg = `📢 New one in ${spot.locationDesc}: ${spot.activator} at  ${spot.reference} 🔸 ${spot.mode} on ${spot.frequency}`
                //setAlertMsg(msg);
                x.push({ title: title, msg: msg, callsign: spot.activator });
                setAlerts(x);
                console.log('pushed an alert: ' + msg);
            }
        });
    }

    React.useEffect(() => {
        let x = [...alerts];

        // no data or the alert is already shown (leave it in queue)
        if (x.length == 0 || !alertHidden)
            return;

        let data = x.pop();
        console.log('popped for display: ' + data?.msg);

        displayAlert(data);

        setAlerts(x);
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

    return (
        <div>
            {!alertHidden &&
                <Alert
                    severity="info"
                    sx={{ fontSize: '0.80rem' }}
                    onClose={() => { handleAlertClose() }} >
                    <AlertTitle sx={{ fontSize: '0.75rem' }}>{alertTitle}</AlertTitle>
                    {alertMsg}
                </Alert>
            }
        </div>
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
}
