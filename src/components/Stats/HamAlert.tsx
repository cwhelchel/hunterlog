import * as React from 'react'
import clsx from 'clsx';
import { styled, css, Stack } from '@mui/system';
import { Tooltip, Button, Divider, Typography, MenuItem, InputLabel, FormControl, Select, SelectChangeEvent, Autocomplete, TextField, Snackbar, SnackbarCloseReason } from '@mui/material';
import { Modal as BaseModal } from '@mui/base/Modal';
import { checkApiResponse, setToastMsg } from '../../util';
import { useAppContext } from '../AppContext';
import { getPotaLocations } from '../../tsx/pota';

declare interface IHamAlertButtonProps {
}


export const HamAlertButton = (props: IHamAlertButtonProps) => {
    const [open, setOpen] = React.useState(false);
    const [toastOpen, setToastOpen] = React.useState(false);
    const [isWorking, _] = React.useState(false);
    const [loc, setLoc] = React.useState('');
    const [locs, setLocs] = React.useState(['']);
    const [unhunted, setUnhunted] = React.useState('');
    const { contextData, setData } = useAppContext();

    const handleClose = () => setOpen(false);

    const handleMenuButtonClick = () => {
        if (window.pywebview !== undefined) {
            setOpen(true);

            let x = window.pywebview.api.get_pota_locations();
            x.then((r: string) => {
                let resp = checkApiResponse(r, contextData, setData);
                if (resp.success) {
                    //console.log(resp.locations.join(','));
                    setLocs(resp.locations);
                }
            });
        }
    };

    function handleLocationChange(event: any, newValue: string | null): void {
        let newLoc = newValue ?? '';
        setLoc(newLoc);

        if (newLoc === '')
            return;

        let x = window.pywebview.api.get_hamalert_text(newLoc);
        x.then((r: string) => {
            let resp = checkApiResponse(r, contextData, setData);
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
            <Modal
                aria-labelledby="unstyled-modal-title"
                aria-describedby="unstyled-modal-description"
                open={open}
                onClose={handleClose}
                slots={{ backdrop: StyledBackdrop }}
            >
                <ModalContent sx={{ width: 600 }}>
                    <h2 id="unstyled-modal-title" className="modal-title">
                        HamAlert Helper - list un-worked references in a location
                    </h2>
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
                        sx={{maxHeight:'500px'}}>

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
                </ModalContent>
            </Modal>
        </>
    );
};


const Backdrop = React.forwardRef<
    HTMLDivElement,
    { open?: boolean; className: string }
>((props, ref) => {
    const { open, className, ...other } = props;
    return (
        <div
            className={clsx({ 'base-Backdrop-open': open }, className)}
            ref={ref}
            {...other}
        />
    );
});

const blue = {
    200: '#99CCFF',
    300: '#66B2FF',
    400: '#3399FF',
    500: '#007FFF',
    600: '#0072E5',
    700: '#0066CC',
};

const grey = {
    50: '#F3F6F9',
    100: '#E5EAF2',
    200: '#DAE2ED',
    300: '#C7D0DD',
    400: '#B0B8C4',
    500: '#9DA8B7',
    600: '#6B7A90',
    700: '#434D5B',
    800: '#303740',
    900: '#1C2025',
};

const Modal = styled(BaseModal)`
  position: fixed;
  z-index: 1300;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledBackdrop = styled(Backdrop)`
  z-index: -1;
  position: fixed;
  inset: 0;
  background-color: rgb(0 0 0 / 0.5);
  -webkit-tap-highlight-color: transparent;
`;

const ModalContent = styled('div')(
    ({ theme }) => css`
    /*font-family: 'IBM Plex Sans', sans-serif;*/
    font-weight: 500;
    text-align: start;
    align-items: stretch;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: hidden;
    background-color: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
    border-radius: 8px;
    border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
    box-shadow: 0 4px 12px
      ${theme.palette.mode === 'dark' ? 'rgb(0 0 0 / 0.5)' : 'rgb(0 0 0 / 0.2)'};
    padding: 24px;
    color: ${theme.palette.mode === 'dark' ? grey[50] : grey[900]};

    & .modal-title {
      margin: 0;
      line-height: 1.5rem;
      margin-bottom: 8px;
    }

    & .modal-description {
      margin: 0;
      line-height: 1.5rem;
      font-weight: 400;
      color: ${theme.palette.mode === 'dark' ? grey[400] : grey[800]};
      margin-bottom: 4px;
    }

    & .modal-config-text {
        margin: 0;
        line-height: 1.1rem;
        font-weight: 300;
        font-size: smaller;
        color: ${theme.palette.mode === 'dark' ? grey[400] : grey[800]};
        margin-bottom: 2px;
      }
  `,
);
