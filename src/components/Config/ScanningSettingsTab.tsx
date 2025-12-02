import * as React from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { useConfigContext } from './ConfigContextProvider';

export default function ScanningSettingsTab() {
    const { config, setConfig } = useConfigContext();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(event.target.value);
        if (!isNaN(val) && val > 0) {
            setConfig({ ...config, scan_wait_time: val });
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Scanning Configuration</Typography>
            <TextField
                label="Scan Wait Time (seconds)"
                type="number"
                value={config.scan_wait_time || 5}
                onChange={handleChange}
                helperText="Time to wait on each station before moving to the next."
                inputProps={{ min: 1 }}
            />
        </Box>
    );
}
