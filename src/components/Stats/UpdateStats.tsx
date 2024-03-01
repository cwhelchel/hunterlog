import * as React from 'react'
import { Tooltip, Button } from '@mui/material';


export const UpdateStats = () => {

    const handleClick = () => {
        if (window.pywebview !== undefined) {
            window.pywebview.api.update_park_hunts();
        }
    };

    return (
        <Tooltip title="Update stats from hunter_parks.csv">
            <Button onClick={handleClick}>
                Update Stats
            </Button>
        </Tooltip>
    );
};
