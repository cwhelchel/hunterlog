import * as React from 'react';
import { Button, Box, InputLabel, Select, TextField } from '@mui/material';
import { useAppContext } from '../AppContext';

import './QsoEntry.scss'

export default function QsoEntry() {
    const [ticker, setTicker] = React.useState('')

    const { contextData, setData } = useAppContext();

    console.log(contextData?.text);

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
                    value={contextData?.qso?.call || ''} />
                <TextField id="mode" label="Mode"
                    value={contextData?.qso?.mode || ''} />
                <TextField id="freq" label="Frequency"
                    value={contextData?.qso?.freq || ''} />
                <TextField id="Grid" label="Grid"
                    value={contextData?.qso?.gridsquare || ''} />

                <Button variant="outlined">
                    Log QSO
                </Button>
            </Box>
        </div>
    );
};
