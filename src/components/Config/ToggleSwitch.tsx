import { FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import * as React from 'react';

interface ToggleSwitchProps {
    initialState: boolean;
    storageKey: string;
    label: string;
    longTrueText?: string;
    longFalseText?: string;
    onChange?: (newVal: boolean) => void;
}

export default function ToggleSwitch(props: ToggleSwitchProps) {

    const [value, setValue] = React.useState(props.initialState);

    React.useEffect(() => {
        const valStr = window.localStorage.getItem(props.storageKey) || '0';
        const val = parseInt(valStr);
        setValue(val == 1 ? true : false);
    }, [])

    return (
        <Stack alignItems={'center'}>
            <FormControlLabel
                control={
                    <Switch
                        checked={value}
                        onChange={() => toggleItem(props.storageKey, value, setValue, props.onChange)} />
                }
                label={props.label}
                sx={{height: '100%'}} />
            {props.longTrueText && props.longFalseText &&
                <Typography textAlign='center' variant='caption'>
                    {value ? props.longTrueText : props.longFalseText}
                </Typography>
            }
        </Stack>
    )
}

function toggleItem(key: string, val: boolean, setter: (value: React.SetStateAction<boolean>) => void, callback?: (newVal: boolean) => void) {
    //console.log(key, val, setter);
    const newVal = !val;
    setter(newVal);
    window.localStorage.setItem(key, newVal ? '1' : '0');

    if (callback) {
        console.log('callback ' + val);
        callback(newVal);
    }
};