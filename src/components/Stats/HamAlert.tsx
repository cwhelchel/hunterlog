import * as React from 'react'
import { Stack } from '@mui/system';
import { Tooltip, Button, Divider, Typography, Autocomplete, TextField, Snackbar, SnackbarCloseReason } from '@mui/material';
import { checkApiResponse } from '../Utilities/util';
import { useAppContext } from '../AppContext';
import HlModal2 from '../Common/HlModal';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
declare interface IHamAlertButtonProps {
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const HamAlertButton = (props: IHamAlertButtonProps) => {
    const [open, setOpen] = React.useState(false);
    const [toastOpen, setToastOpen] = React.useState(false);
    const [loc, setLoc] = React.useState('');
    const [locs, setLocs] = React.useState(['']);
    const [unhunted, setUnhunted] = React.useState('');
    const { contextData, setData } = useAppContext();

    const handleClose = () => setOpen(false);

    const handleMenuButtonClick = () => {
        if (window.pywebview !== undefined) {
            setOpen(true);

            const x = window.pywebview.api.get_pota_locations();
            x.then((r: string) => {
                const resp = checkApiResponse(r, contextData, setData);
                if (resp.success) {
                    //console.log(resp.locations.join(','));
                    setLocs(resp.locations);
                }
            });
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handleLocationChange(event: any, newValue: string | null): void {
        const newLoc = newValue ?? '';
        setLoc(newLoc);

        if (newLoc === '')
            return;

        const x = window.pywebview.api.get_hamalert_text(newLoc);
        x.then((r: string) => {
            const resp = checkApiResponse(r, contextData, setData);
            if (resp.success) {
                //setUnhunted(resp.hunted_refs.join(','));
                const text = resp.unhunted_refs.join(',');
                setUnhunted(text);
                copyText(text);
            }
        });
    }

    const handleToastClose = (
        event: React.SyntheticEvent | Event,
        reason?: SnackbarCloseReason,
    ) => {
        if (reason === 'clickaway') {
            return;
        }

        setToastOpen(false);
    };

    const copyText = (value: string) => {
        if ('clipboard' in navigator) {
            navigator.clipboard.writeText(value as string).then(
                () => { setToastOpen(true); }
            )
        }
    }

    return (
        <>
            <Tooltip title="Download POTA location data for stats">
                <Button onClick={handleMenuButtonClick}>
                    HamAlert
                </Button>
            </Tooltip>
            <HlModal2
                isOpen={open}
                onClose={handleClose}
                title='HamAlert Helper - list un-worked references in a location'
                id='hamalert'
                contentStyle={{ width: 600 }}            >

                <Typography variant="caption" gutterBottom>
                    For this to work, please click LOC STATS in STATS menu.
                </Typography>
                <Divider />
                <div>
                    <Typography variant="body2" gutterBottom marginTop={"10px"}>
                        This gives you a comma separated list of POTA references that HunterLog does not
                        have logged for a given location. You can use this to setup a HamAlert for that
                        location and get alerts to your mobile device.
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        The list is automatically copied to the clipboard when you select the location.
                    </Typography>
                </div>

                <Autocomplete
                    id="location"
                    value={loc}
                    sx={{ minWidth: 100 }}
                    options={locs}
                    onChange={handleLocationChange}
                    blurOnSelect={true}
                    renderInput={(params) => <TextField {...params} label="Location" />}
                >
                </Autocomplete>

                <TextField
                    type='text'
                    value={unhunted}
                    multiline={true}
                    rows={15}
                    sx={{ maxHeight: '500px' }}>

                </TextField>

                <Stack direction={'row'} spacing={1} sx={{ 'align-items': 'stretch', 'justify-content': 'space-evenly' }} useFlexGap>
                    <Button fullWidth variant='contained' onClick={handleClose}>OK</Button>
                </Stack>

                <Snackbar
                    open={toastOpen}
                    autoHideDuration={1500}
                    onClose={handleToastClose}
                    message="Copied to clipboard"
                />
            </HlModal2>
        </>
    );
};
