import * as React from 'react'
import Button from '@mui/material/Button'


export const UpdateStats = () => {

    const handleClick = () => {
        if (window.pywebview !== undefined) {
            window.pywebview.api.update_park_hunts();
        }
    };

    return (
        <Button onClick={handleClick}>
            Update Stats
        </Button>
    );
};
