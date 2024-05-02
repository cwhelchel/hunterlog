import * as React from 'react';
import { Button, TextField, Grid, Stack } from '@mui/material';
import { useAppContext } from '../AppContext';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

import './QsoEntry.scss'
import QsoTimeEntry from './QsoTimeEntry';
import { Qso } from '../../@types/QsoTypes';
import { checkApiResponse } from '../../util';
import { getParkInfo } from '../../pota';
import { Park } from '../../@types/Parks';
import { ParkInfo } from '../../@types/PotaTypes';

dayjs.extend(utc);


let defaultQso: Qso = {
    call: "",
    rst_sent: "",
    rst_recv: "",
    freq: "",
    freq_rx: "",
    mode: "",
    comment: "",
    qso_date: new Date(),
    time_on: "1970-01-01T00:00",
    tx_pwr: 0,
    rx_pwr: 0,
    gridsquare: "",
    sig: "",
    sig_info: "",
    distance: 0,
    bearing: 0,
    name: '',
    state: ''
}


export default function QsoEntry() {
    const [qso, setQso] = React.useState(defaultQso);
    const [qsoTime, setQsoTime] = React.useState<Dayjs>(dayjs('2022-04-17T15:30'));
    const { contextData, setData } = useAppContext();

    function logQso() {
        console.log(`logging qso at ${contextData.park?.name}`);

        let cmt = qso.comment ?? '';
        let name = `${contextData.park?.name} ${contextData.park?.parktypeDesc}`;

        // NOTE: compress this for multi location parks like PotaPlus?
        let loc = contextData.park?.locationDesc;

        qso.comment = `[POTA ${qso.sig_info} ${loc} ${qso.gridsquare} ${name}] ` + cmt;
        qso.time_on = (qsoTime) ? qsoTime.toISOString() : dayjs().toISOString();

        window.pywebview.api.log_qso(qso).then((x: string) => {
            checkApiResponse(x, contextData, setData);
        })
    }

    function spotActivator() {
        console.log(`spotting activator at ${contextData.park?.name}`);
        let park = qso.sig_info;
        window.pywebview.api.spot_activator(qso, park).then((r: string) => {
            checkApiResponse(r, contextData, setData);
        });
    }

    function handleLogQsoClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        logQso();
        handleClearClick(event);
    }

    function handleSpotAndLogClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        logQso();
        spotActivator();
        handleClearClick(event);
    };

    function handleSpotOnlyClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        spotActivator();
        handleClearClick(event);
    };

    function handleClearClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        console.log("clearing qso...");
        setQso(defaultQso);
        contextData.park = null;
        contextData.qso = null;
        setData(contextData);
    }

    function updateQsoEntry() {
        let x = contextData?.qso;
        if (x == null) {
            x = defaultQso;
        }
        x.time_on = dayjs().toISOString();
        setQsoTime(dayjs())
        setQso(x);
    }

    function getDistance() {
        // default to yes
        let units = window.localStorage.getItem("USE_FREEDOM_UNITS") || '1';
        let use_imperial = parseInt(units);

        if (use_imperial) {
            let mi = Math.trunc(qso.distance * 0.621371);
            return `${mi} mi`;
        }
        else
            return `${qso.distance} km`;
    }

    function onCallsignEntry(entry: string) {
        if (entry === null || entry === '')
            return;

        setQso({ ...qso, call: entry });

        const newCtxData = { ...contextData };

        if (newCtxData.qso === null) {
            newCtxData.qso = { ...defaultQso, call: entry };
        } else if (newCtxData.qso.call != entry) {
            newCtxData.qso = { ...newCtxData.qso, call: entry };
        }

        //console.log(newCtxData.qso?.call);

        setData(newCtxData);
    }

    function onParkEntry(park: string) {
        if (park === null || park === '')
            return;

        function localGetState(locDesc: string): string {
            let loc = locDesc.split(',')[0];

            let arr = loc.split('-');
            console.log(`${arr[0]} === ${arr[1]}`);

            if (arr[0] === 'US' || arr[0] == 'CA') {
                return arr[1];
            }
            return '';
        };
        function localFunc(): any {
            let p = getParkInfo(park);
            p.then((apiData: ParkInfo) => {
                let x: Park = {
                    id: apiData.parkId,
                    reference: apiData.reference,
                    name: apiData.name,
                    grid6: apiData.grid6,
                    active: apiData.active == 1,
                    latitude: apiData.latitude,
                    longitude: apiData.longitude,
                    parkComments: '',
                    parktypeId: 0,
                    parktypeDesc: apiData.parktypeDesc,
                    locationDesc: apiData.locationDesc,
                    firstActivator: apiData.firstActivator,
                    firstActivationDate: apiData.firstActivationDate,
                    website: ''
                };

                newCtxData.park = x;

                if (newCtxData.qso != null) {
                    newCtxData.qso.gridsquare = apiData.grid6;
                    newCtxData.qso.sig = 'POTA';
                    newCtxData.qso.sig_info = apiData.reference;
                    newCtxData.qso.state = localGetState(apiData.locationDesc);
                    setData(newCtxData);
                }

                let newQso = {...qso};
                newQso.gridsquare = apiData.grid6;
                newQso.sig = 'POTA';
                newQso.sig_info = apiData.reference;
                newQso.state = localGetState(apiData.locationDesc);
                
                setQso(newQso);
            });
        }

        const newCtxData = { ...contextData };
        if (newCtxData.park === null) {
            localFunc();
        }
        else if (newCtxData.park.reference != park) {
            localFunc();
        }
    };

    // when the app context changes (ie a user clicks on a different spot)
    // we need to update our TextFields
    React.useEffect(() => {
        updateQsoEntry();
    }, [contextData.qso]);

    const textFieldStyle: React.CSSProperties = { fontSize: 14, textTransform: "uppercase" };
    const commentStyle: React.CSSProperties = { fontSize: 14 };

    return (
        <div className="qso-container">
            <Grid container
                spacing={{ xs: 1, md: 1, lg: 2 }}
            >
                <Grid item xs={4} lg={3}>
                    <TextField id="callsign" label="Callsign"
                        value={qso.call}
                        inputProps={{ style: textFieldStyle }}
                        onBlur={(e) => { onCallsignEntry(e.target.value); }}
                        onChange={(e) => {
                            setQso({ ...qso, call: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={4} lg={3}>
                    <TextField id="freq" label="Frequency"
                        value={qso.freq}
                        inputProps={{ style: textFieldStyle }}
                        onChange={(e) => {
                            setQso({ ...qso, freq: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={4} lg={2}>
                    <TextField id="mode" label="Mode"
                        value={qso.mode}
                        inputProps={{ style: textFieldStyle }}
                        onChange={(e) => {
                            setQso({ ...qso, mode: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={4} lg={2}>
                    <TextField id="rstSent" label="RST Sent"
                        value={qso.rst_sent}
                        inputProps={{ style: textFieldStyle }}
                        onChange={(e) => {
                            setQso({ ...qso, rst_sent: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={4} lg={2}>
                    <TextField id="rstRecv" label="RST Recv"
                        value={qso.rst_recv}
                        inputProps={{ style: textFieldStyle }}
                        onChange={(e) => {
                            setQso({ ...qso, rst_recv: e.target.value });
                        }} />
                </Grid>


                <Grid item xs={4} lg={2}>
                    <TextField id="park" label="Park"
                        value={qso.sig_info}
                        inputProps={{ style: textFieldStyle }}
                        onBlur={(e) => {
                            onParkEntry(e.target.value);
                        }}
                        onChange={(e) => {
                            setQso({ ...qso, sig_info: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={4} lg={2}>
                    <TextField id="grid" label="Grid"
                        value={qso.gridsquare}
                        inputProps={{ style: textFieldStyle }}
                        onChange={(e) => {
                            setQso({ ...qso, gridsquare: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={6} lg={3}>
                    <QsoTimeEntry qsoTime={qsoTime} setQsoTime={setQsoTime} />
                </Grid>
                <Grid item xs={12} lg={5}>
                    <TextField id="comments" label="Comments"
                        value={qso.comment}
                        inputProps={{ style: commentStyle }}
                        onChange={(e) => {
                            setQso({ ...qso, comment: e.target.value });
                        }} />
                </Grid>
            </Grid>

            <div className='qsoMetaData'>
                <span>Distance: {getDistance()}</span>
                &nbsp;-&nbsp;
                <span>Bearing: {qso.bearing}&deg;</span>
            </div>

            <Stack
                direction={{ xs: 'row', sm: 'row', md: 'row' }}
                spacing={{ xs: 1, sm: 1, md: 2 }}>
                <Button variant="outlined" onClick={(e) => handleLogQsoClick(e)}>
                    Log QSO
                </Button>
                <Button variant='contained' onClick={(e) => handleSpotAndLogClick(e)}>
                    Spot + Log
                </Button>
                <Button variant="outlined" onClick={(e) => handleSpotOnlyClick(e)}>
                    Spot Only
                </Button>
                <Button variant="outlined" onClick={(e) => handleClearClick(e)}
                    color='secondary'>
                    Clear
                </Button>
            </Stack>
        </div >
    );
};
