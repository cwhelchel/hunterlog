import * as React from 'react';
import { Button, Box, TextField } from '@mui/material';
import { useAppContext } from '../AppContext';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

import './QsoEntry.scss'
import { Qso } from '../../@types/QsoTypes';
import QsoTimeEntry from './QsoTimeEntry';

dayjs.extend(utc);


let defaultQso: Qso = {
    id: 0,
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
    sig_info: ""
}


export default function QsoEntry() {
    const [qso, setQso] = React.useState(defaultQso);
    const [isPlaying, setIsPlaying] = React.useState(true);
    const [qsoTime, setQsoTime] = React.useState<Dayjs>(dayjs('2022-04-17T15:30'));
    const { contextData, setData } = useAppContext();

    function handleLogQsoClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        console.log("logging qso...");

        qso.time_on = (qsoTime) ? qsoTime.toISOString() : dayjs().toISOString();
        window.pywebview.api.log_qso(qso);
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
    }, [contextData.qso]);

    return (
        <div className="qso-container">
            <Box
                component="form"
                sx={{
                    '& > :not(style)': { m: 1 },
                }}
                noValidate
                autoComplete="off"
            >
                <TextField id="callsign" label="Callsign"
                    value={qso.call}
                    onChange={(e) => {
                        setQso({ ...qso, call: e.target.value });
                    }} />
                <TextField id="mode" label="Mode"
                    value={qso.mode}
                    onChange={(e) => {
                        setQso({ ...qso, mode: e.target.value });
                    }} />
                <TextField id="freq" label="Frequency"
                    value={qso.freq}
                    onChange={(e) => {
                        setQso({ ...qso, freq: e.target.value });
                    }} />
                <TextField id="grid" label="Grid"
                    value={qso.gridsquare}
                    onChange={(e) => {
                        setQso({ ...qso, gridsquare: e.target.value });
                    }} />

                <QsoTimeEntry qsoTime={qsoTime} setQsoTime={setQsoTime} />
            </Box>

            <Button variant="outlined" onClick={(e) => handleLogQsoClick(e)}>
                Log QSO
            </Button>
        </div>
    );
};
