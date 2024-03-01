import * as React from 'react';
import { Button, TextField, Grid } from '@mui/material';
import { useAppContext } from '../AppContext';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

import './QsoEntry.scss'
import { Qso } from '../../@types/QsoTypes';
import QsoTimeEntry from './QsoTimeEntry';
import { Park } from '../../@types/Parks';

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
    distance: 0
}


export default function QsoEntry() {
    const [qso, setQso] = React.useState(defaultQso);
    const [qsoTime, setQsoTime] = React.useState<Dayjs>(dayjs('2022-04-17T15:30'));
    const [park, setPark] = React.useState<Park>();
    const { contextData, setData } = useAppContext();

    function handleLogQsoClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        console.log("logging qso...");

        window.pywebview.api.log_qso(qso.sig_info)

        qso.comment = `[POTA ${qso.sig_info} ${qso.state} ${qso.gridsquare} ${park?.name} ] ` + qso.comment;
        qso.time_on = (qsoTime) ? qsoTime.toISOString() : dayjs().toISOString();
        window.pywebview.api.log_qso(qso);
        setQso(defaultQso);
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

    // when the app context changes (ie a user clicks on a different spot)
    // we need to update our TextFields
    React.useEffect(() => {
        updateQsoEntry();

        if (window.pywebview === undefined)
            return;

        window.pywebview.api.get_park(qso.sig_info)
            .then((r: string) => {
                let p = JSON.parse(r) as Park;
                setPark(p);
            });
    }, [contextData.qso]);

    const textFieldStyle = { style: { fontSize: 14 } };

    return (
        <div className="qso-container">
            <Grid container
                spacing={{ xs: 1, md: 2 }}
                m={1}
            >
                <Grid item xs={2}>
                    <TextField id="callsign" label="Callsign"
                        value={qso.call}
                        inputProps={textFieldStyle}
                        onChange={(e) => {
                            setQso({ ...qso, call: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={2}>
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
                <Grid item xs={4}>
                    <QsoTimeEntry qsoTime={qsoTime} setQsoTime={setQsoTime} />
                </Grid>
                <Grid item xs={6}>
                    <TextField id="comments" label="Comments"
                        value={qso.comment}
                        inputProps={textFieldStyle}
                        onChange={(e) => {
                            setQso({ ...qso, comment: e.target.value });
                        }} />
                </Grid>
            </Grid>

            <div className='qsoMetaData'>
                <span>Distance: {qso.distance}</span>
            </div>

            <Button variant="outlined" onClick={(e) => handleLogQsoClick(e)}
                sx={{ 'm': 1, }} >
                Log QSO
            </Button>
        </div>
    );
};
