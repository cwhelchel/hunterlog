import * as React from 'react';
import { Button, TextField, Grid } from '@mui/material';
import { useAppContext } from '../AppContext';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

import './QsoEntry.scss'
import QsoTimeEntry from './QsoTimeEntry';
import { Qso } from '../../@types/QsoTypes';
import { checkApiResponse } from '../../util';

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

    // when the app context changes (ie a user clicks on a different spot)
    // we need to update our TextFields
    React.useEffect(() => {
        updateQsoEntry();
    }, [contextData.qso]);

    const textFieldStyle = { style: { fontSize: 14 } };

    return (
        <div className="qso-container">
            <Grid container
                spacing={{ xs: 1, md: 2 }}
                m={1}
            >
                <Grid item xs={3}>
                    <TextField id="callsign" label="Callsign"
                        value={qso.call}
                        inputProps={textFieldStyle}
                        onChange={(e) => {
                            setQso({ ...qso, call: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={3}>
                    <TextField id="freq" label="Frequency"
                        value={qso.freq}
                        inputProps={textFieldStyle}
                        onChange={(e) => {
                            setQso({ ...qso, freq: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={2}>
                    <TextField id="mode" label="Mode"
                        value={qso.mode}
                        inputProps={textFieldStyle}
                        onChange={(e) => {
                            setQso({ ...qso, mode: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={2}>
                    <TextField id="rstSent" label="RST Sent"
                        value={qso.rst_sent}
                        inputProps={textFieldStyle}
                        onChange={(e) => {
                            setQso({ ...qso, rst_sent: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={2}>
                    <TextField id="rstRecv" label="RST Recv"
                        value={qso.rst_recv}
                        inputProps={textFieldStyle}
                        onChange={(e) => {
                            setQso({ ...qso, rst_recv: e.target.value });
                        }} />
                </Grid>


                <Grid item xs={2}>
                    <TextField id="park" label="Park"
                        value={qso.sig_info}
                        inputProps={textFieldStyle}
                        onChange={(e) => {
                            setQso({ ...qso, sig_info: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={2}>
                    <TextField id="grid" label="Grid"
                        value={qso.gridsquare}
                        inputProps={textFieldStyle}
                        onChange={(e) => {
                            setQso({ ...qso, gridsquare: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={3}>
                    <QsoTimeEntry qsoTime={qsoTime} setQsoTime={setQsoTime} />
                </Grid>
                <Grid item xs={5}>
                    <TextField id="comments" label="Comments"
                        value={qso.comment}
                        inputProps={textFieldStyle}
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

            <Button variant="outlined" onClick={(e) => handleLogQsoClick(e)}
                sx={{ 'm': 1, }} >
                Log QSO
            </Button>
            <Button variant="outlined" onClick={(e) => handleSpotAndLogClick(e)}
                sx={{ 'm': 1, }} >
                Spot + Log
            </Button>
            <Button variant="outlined" onClick={(e) => handleSpotOnlyClick(e)}
                sx={{ 'm': 1, }} >
                Spot Only
            </Button>
            <Button variant="outlined" onClick={(e) => handleClearClick(e)}
                sx={{ 'm': 1, }} >
                Clear
            </Button>
        </div>
    );
};
