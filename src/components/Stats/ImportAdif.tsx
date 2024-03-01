import * as React from 'react'
import { Tooltip, Button } from '@mui/material';


export const ImportAdif = () => {

    const handleClick = () => {
        if (window.pywebview !== undefined) {
            window.pywebview.api.import_adif();
        }
    };

    return (
        <Tooltip title="Load in old QSOs to track Operator hunts">
            <Button onClick={handleClick}>
                Import ADIF
            </Button>
        </Tooltip>
    );
};
