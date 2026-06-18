import { Widgets } from '@mui/icons-material';
import { FormControlLabel, Stack, Switch, SxProps, TextField, Theme, Typography } from '@mui/material';
import * as React from 'react';

interface StoredTextInput {
    storageKey: string;
    initialVal: string;
    label: string;
    extraDescription?: string;
    onChange?: (newVal: string) => void;
    sx?: SxProps<Theme>;
}

export default function StoredTextInput(props: StoredTextInput) {

    const [value, setValue] = React.useState(props.initialVal);

    React.useEffect(() => {
        let valStr = window.localStorage.getItem(props.storageKey);
        //console.log('getItem', valStr);

        if (valStr === null) {
            window.localStorage.setItem(props.storageKey, props.initialVal);
            valStr = props.initialVal;
        }
        setValue(valStr || '');
    }, [])

    return (
        <Stack
            justifyContent={'start'}
            sx={[
                // You cannot spread `sx` directly because `SxProps` (typeof sx) can be an array.
                ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
            ]}>
            <FormControlLabel

                control={
                    <TextField
                        value={value}
                        sx={{ marginLeft: '5px', width: '100%' }}
                        onChange={(e) => setLocalItem(props.storageKey, e.target.value, setValue, props.onChange)}
                        onBlur={(e) => setLocalItem(props.storageKey, e.target.value, setValue, props.onChange)} />
                }
                label={props.label}
                labelPlacement='start'
                sx={{ height: '100%', width: '100%' }} />

            {props.extraDescription &&
                <Typography
                    textAlign={'center'}
                    sx={{ width: '100%' }}
                    variant='caption'
                    dangerouslySetInnerHTML={{ __html: props.extraDescription }}>
                </Typography>
            }
        </Stack>
    )
}

function setLocalItem(key: string, val: string, setter: (value: React.SetStateAction<string>) => void, callback?: (newVal: string) => void) {
    // console.log('setLocalItem', key, val);
    const newVal = val;
    setter(newVal);
    window.localStorage.setItem(key, newVal || '0');

    if (callback) {
        console.log('callback ' + val);
        callback(newVal);
    }
};