import * as React from 'react';
import { Button, Tooltip } from '@mui/material';
import { checkApiResponse } from '../../util';
import { useAppContext } from '../AppContext';

interface IFreqButtonProps {
    frequency: string,
    mode: string
};


export default function FreqButton(props: IFreqButtonProps) {
    const { contextData, setData } = useAppContext();

    function onClick(e: string, m: string) {
        console.log("js qsy to...");
        console.log(`param ${e} ${m}`);
        let p = window.pywebview.api.qsy_to(e, m);
        p.then((resp: string) => {
            checkApiResponse(resp, contextData, setData);
        });
    };

    return (
        <Button sx={{ width: '100px' }} variant='contained'
            onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                onClick(props.frequency, props.mode);
            }
            }>
            {props.frequency}
        </Button>
    );
}