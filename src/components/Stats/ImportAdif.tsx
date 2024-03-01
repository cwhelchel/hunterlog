import * as React from 'react'
import Button from '@mui/material/Button'


export const ImportAdif = () => {

    const handleClick = () => {
        if (window.pywebview !== undefined) {
            window.pywebview.api.import_adif();
        }
    };

    return (
        <Button onClick={handleClick}>
            Import ADIF
        </Button>
    );
};
