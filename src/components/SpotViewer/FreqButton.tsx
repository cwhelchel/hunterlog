import * as React from 'react';
import { Button, Tooltip } from '@mui/material';

interface IFreqButtonProps {
    frequency: string,
    mode: string
};


export default function FreqButton(props: IFreqButtonProps) {
    function onClick(e: string, m: string) {
        console.log("js qsy to...");
        console.log(`param ${e} ${m}`);
        window.pywebview.api.qsy_to(e, m);
    };

    return (
        <Button sx={{ width: '100px' }} variant='contained' onClick={() => {
             onClick(props.frequency, props.mode) 
            }
        }>
            {props.frequency}
        </Button>
    );
}