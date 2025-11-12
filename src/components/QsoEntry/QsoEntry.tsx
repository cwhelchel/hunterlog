/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import { Button, TextField, Grid, Stack, Tooltip, Box } from '@mui/material';
import { useAppContext } from '../AppContext';
import { Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

import './QsoEntry.scss'
import QsoTimeEntry from './QsoTimeEntry';
import { Qso } from '../../@types/QsoTypes';
import { checkApiResponse, checkReferenceForPota, checkReferenceForSota, checkReferenceForWwbota, checkReferenceForWwff, setToastMsg } from '../../tsx/util';
import { getStateFromLocDesc } from '../../tsx/pota';
import { Park } from '../../@types/Parks';

dayjs.extend(utc);


const defaultQso: Qso = {
    call: "",
    rst_sent: "",
    rst_recv: "",
    freq: "",
    freq_rx: "",
    mode: "",
    comment: "",
    qso_date: "",
    time_on: "1970-01-01T00:00",
    tx_pwr: 0,
    rx_pwr: 0,
    gridsquare: "",
    sig: "",
    sig_info: "",
    distance: 0,
    bearing: 0,
    name: '',
    state: '',
    pota_ref: undefined,
    sota_ref: undefined,
    wwff_ref: undefined
}


export default function QsoEntry() {
    const [qso, setQso] = React.useState(defaultQso);
    const [otherOps, setOtherOps] = React.useState('');
    const [otherOpsHidden, setOtherOpsHidden] = React.useState(true);
    const [otherParks, setOtherParks] = React.useState('');
    const [otherParksHidden, setOtherParksHidden] = React.useState(true);
    const [qsoTime, setQsoTime] = React.useState<Dayjs>(dayjs('2022-04-17T15:30'));
    const { contextData, setData } = useAppContext();
    const [spinnerOpen, setSpinnerOpen] = React.useState(false);
    const [isSwapped, setIsSwapped] = React.useState(false);

    async function logQso() {
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        console.log(`logging qso at ${contextData.park?.name}`);

        if (qso.sig_info !== undefined && qso.sig_info !== "") {
            // NOTE: compress this for multi location parks like PotaPlus?
            const loc = contextData.park?.locationDesc;
            const cmt = qso.comment ?? '';
            const name = `${contextData.park?.name} ${contextData.park?.parktypeDesc}`;
            qso.comment = `[${qso.sig} ${qso.sig_info} ${loc} ${qso.gridsquare} ${name}] ` + cmt;
        }

        qso.time_on = (qsoTime) ? qsoTime.toISOString() : dayjs().toISOString();
        qso.qso_date = qso.time_on;
        if (qso.sig == "SOTA")
            qso.sota_ref = qso.sig_info;

        if (qso.sig == "WWFF")
            qso.wwff_ref = qso.sig_info;

        if (qso.sig == "POTA") {
            if (otherParks) {
                const myPotaRef = getPotaRef(checkReferenceForPota);

                if (!myPotaRef.ok)
                    setToastMsg("Bad POTA Ref in Other Parks", contextData, setData);

                qso.pota_ref = myPotaRef.pota_ref;
                qso.comment += ` {Also: ${myPotaRef.otherParks}}`;
            } else {
                qso.pota_ref = qso.sig_info;
            }
        }

        // all other sigs
        if (otherParks) {
            // TODO: map sigs to functions to check references
            const othersRef = getPotaRef(checkReferenceForWwbota);
            if (!othersRef.ok)
                setToastMsg("Bad Ref in Others list", contextData, setData);
            else {
                // sig info can be a comma separated list. 
                qso.sig_info = othersRef.pota_ref ? othersRef.pota_ref : qso.sig_info;
                qso.comment += ` {Also: ${othersRef.otherParks}}`;
            }
        }

        const multiOps = otherOps;

        if (multiOps !== null && multiOps != '') {
            const ops = multiOps.split(',');

            // log main window first then loop thru multiops
            await window.pywebview.api.log_qso(qso).then((x: string) => {
                checkApiResponse(x, contextData, setData);

                ops.forEach(async function (call) {
                    console.log(`logging multiop QSO: ${call}`);
                    await sleep(100);
                    const newQso = { ...qso };
                    newQso.call = call.trim();
                    window.pywebview.api.log_qso(newQso).then((x: string) => {
                        checkApiResponse(x, contextData, setData);
                    });
                });
            });
        } else {
            // log a single operator
            await window.pywebview.api.log_qso(qso).then((x: string) => {
                const json = checkApiResponse(x, contextData, setData);

                window.pywebview.api.refresh_spot(contextData.spotId, qso.call, qso.sig_info)
                    .then((x: string) => {
                        window.pywebview.state.getSpots();
                    });
            });
        }
    }

    interface IGetPotaRef {
        pota_ref: string | undefined;
        otherParks: string | undefined;
        ok: boolean;
    }

    function getPotaRef(checker: (ref: string) => boolean): IGetPotaRef {
        const res = otherParks;
        const currentPark = qso.sig_info;
        const arr = res.split(',');

        arr.forEach((x) => {
            const isPota = checker(x);
            if (!isPota) {
                return { ok: false };
            }
        })

        arr.push(currentPark);
        return {
            ok: true,
            pota_ref: arr.join(','),
            otherParks: res
        };
    }

    function spotActivator() {
        if (qso.sig != 'POTA')
            return;
        console.log(`spotting activator at ${contextData.park?.name}`);
        const park = qso.sig_info;

        const multiOps = otherOps;
        if (multiOps !== null && multiOps != '') {
            const ops = multiOps.split(',');
            const x = ops.filter(e => e !== contextData.qso?.call);

            x.forEach((call) => call = call.trim());

            const l = x.join(',');
            const cmt = ` {With: ${l}}`;

            qso.comment += cmt;
        }

        window.pywebview.api.spot_activator(qso, park).then((r: string) => {
            checkApiResponse(r, contextData, setData);
        });
    }

    async function handleLogQsoClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        await logQso();
        handleClearClick(event);
    }

    async function handleSpotAndLogClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        await logQso();
        spotActivator();
        handleClearClick(event);
    };

    function handleSpotOnlyClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        spotActivator();
        handleClearClick(event);
    };

    function handleClearClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null
    ) {
        console.log("clearing qso...");
        setQso(defaultQso);
        contextData.park = null;
        contextData.qso = null;
        contextData.otherOperators = '';
        contextData.otherParks = '';
        contextData.spotId = 0;
        setData(contextData);

        setOtherOpsHidden(true);
        setOtherOps('');
        setOtherParksHidden(true);
        setOtherParks('');

        if (event?.currentTarget.id == 'clear-btn' || event == null) {
            window.pywebview.api.clear_staged_qso();
        }
    }

    function handleMultiOpClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        setOtherOpsHidden(!otherOpsHidden);
    }

    function handleMultiParkClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        setOtherParksHidden(!otherParksHidden);
    }

    function updateQsoEntry() {
        let x = contextData?.qso;
        if (x == null) {
            x = defaultQso;
        }
        x.time_on = dayjs().toISOString();
        setQsoTime(dayjs())
        setQso(x);
    }

    function getDistance() {
        // default to yes
        const units = window.localStorage.getItem("USE_FREEDOM_UNITS") || '1';
        const use_imperial = parseInt(units);

        if (use_imperial) {
            const mi = Math.trunc(qso.distance * 0.621371);
            return `${mi} mi`;
        }
        else
            return `${qso.distance} km`;
    }

    function onCallsignEntry(entry: string) {
        if (entry === null || entry === '')
            return;

        setQso({ ...qso, call: entry });

        const newCtxData = { ...contextData };

        if (newCtxData.qso === null) {
            newCtxData.qso = { ...defaultQso, call: entry };
        } else if (newCtxData.qso.call != entry) {
            newCtxData.qso = { ...newCtxData.qso, call: entry };
        }

        //console.log(newCtxData.qso?.call);

        setData(newCtxData);
    }

    function onParkEntry(park: string) {
        if (park === null || park === '')
            return;

        function updateQsoData(grid6: string, sig: string, sig_info: string, state: string) {
            function setLocalQso() {
                const newQso = { ...qso };
                newQso.gridsquare = grid6;
                newQso.sig = sig;
                newQso.sig_info = sig_info;
                newQso.state = state;
                setQso(newQso);
                return newQso;
            }

            if (newCtxData.qso != null) {
                // a qso object exists in current context. update that one
                newCtxData.qso.gridsquare = grid6;
                newCtxData.qso.sig = sig;
                newCtxData.qso.sig_info = sig_info;
                newCtxData.qso.state = state;
                setData(newCtxData);

                setLocalQso();
            }
            else {
                const newQso = setLocalQso();

                // create a qso object in context data
                newCtxData.qso = newQso;
                setData(newCtxData);
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function getRefInfo(): any {

            const isSota = checkReferenceForSota(park);
            const isWwff = checkReferenceForWwff(park);

            let sig = 'POTA';
            if (isSota)
                sig = 'SOTA'
            else if (isWwff)
                sig = 'WWFF'

            window.pywebview.api.get_reference(sig, park)
                .then((r: string) => {
                    const result = checkApiResponse(r, contextData, setData);
                    if (!result.success) {
                        console.log("get_qso_from_spot failed: " + result.message);
                        return;
                    }
                    const p = JSON.parse(result.park_data) as Park;
                    newCtxData.park = p;

                    let state = '';
                    if (sig == 'POTA')
                        state = getStateFromLocDesc(p.locationDesc)

                    updateQsoData(
                        p.grid6,
                        sig,
                        p.reference,
                        state
                    );
                });
        }

        const newCtxData = { ...contextData };

        if (newCtxData.park === null) {
            getRefInfo();
        }
        else if (newCtxData.park.reference != park) {
            // user entered different park
            getRefInfo();
        }
    };

    function updateOtherOperators(otherOperators: string) {
        if (otherOperators == null || otherOperators === undefined) {
            setOtherOps('');
            setOtherOpsHidden(true);
            return;
        }

        if (otherOperators == '') {
            setOtherOps('');
            setOtherOpsHidden(true);
            return;
        }

        setOtherOpsHidden(false);
        const ops = otherOperators.trim().split(',');

        // remove current qso call if needed
        const x = ops.filter(e => e !== contextData.qso?.call);

        if (x.length > 0) {
            setOtherOps(x.join(','));
        }
    }

    function updateOtherParks(otherParks: string) {
        if (otherParks == null || otherParks === undefined) {
            setOtherParks('');
            setOtherParksHidden(true);
            return;
        }

        if (otherParks == '') {
            setOtherParks('');
            setOtherParksHidden(true);
            return;
        }

        setOtherParksHidden(false);
        const parks = otherParks.trim().split(',');

        // remove current qso call if needed
        const x = parks.filter(e => e !== contextData.qso?.sig_info);

        if (x.length > 0) {
            setOtherParks(x.join(','));
        }
    }


    // when the app context changes (ie a user clicks on a different spot)
    // we need to update our TextFields
    React.useEffect(() => {
        updateQsoEntry();

        // this is ignored if the logger doesn't support staging
        if (contextData.qso)
            window.pywebview.api.stage_qso(JSON.stringify(contextData.qso));
    }, [contextData.qso]);

    React.useEffect(() => {
        updateOtherOperators(contextData.otherOperators);
    }, [contextData.otherOperators]);

    React.useEffect(() => {
        updateOtherParks(contextData.otherParks);
    }, [contextData.otherParks]);

    React.useEffect(() => {
        if (contextData.loadingQsoData)
            setSpinnerOpen(true);
        else
            setSpinnerOpen(false);
    }, [contextData.loadingQsoData]);

    React.useEffect(() => {
        if (contextData.swapRstOrder)
            setIsSwapped(true);
        else
            setIsSwapped(false);
    }, [contextData.swapRstOrder])

    React.useEffect(() => {
        function handleEscapeKey(event: KeyboardEvent) {
            if (event.code === 'Escape') {
                handleClearClick(null);
            }
        }
        const swapStr = window.localStorage.getItem("SWAP_RST_ORDER") || '1';
        setIsSwapped(parseInt(swapStr) == 1 ? true : false);

        document.addEventListener('keydown', handleEscapeKey)
        return () => document.removeEventListener('keydown', handleEscapeKey)
    }, []);

    const textFieldStyle: React.CSSProperties = { fontSize: 14, textTransform: "uppercase" };
    const otherOpsStyle: React.CSSProperties = { fontSize: 12, textTransform: "uppercase", color: 'orange', margin: '5px' };
    const commentStyle: React.CSSProperties = { fontSize: 14 };

    const StyledTypoGraphy = styled(Typography)(({ theme }) =>
        theme.unstable_sx({
            fontSize: {
                lg: 14,
                md: 14,
                sm: 11,
                xs: 9
            }
        }),
    );

    return (
        <div className="qso-container">
            {/* <Backdrop
                sx={{ position: 'absolute', color: '#ff00aa', zIndex: 1500 }}
                open={spinnerOpen}
            >
                <CircularProgress color="inherit" />
            </Backdrop> */}
            <Grid container
                spacing={{ xs: 1, md: 1, lg: 1 }}
            >
                <Grid item xs={4} lg={3}>
                    <TextField id="callsign" label="Callsign"
                        value={qso.call}
                        fullWidth={true}
                        inputProps={{ style: textFieldStyle }}
                        onBlur={(e) => { onCallsignEntry(e.target.value); }}
                        onChange={(e) => {
                            setQso({ ...qso, call: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={4} lg={3}>
                    <TextField id="freq" label="Frequency"
                        value={qso.freq}
                        fullWidth={true}
                        inputProps={{ style: textFieldStyle }}
                        onChange={(e) => {
                            setQso({ ...qso, freq: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={4} lg={2}>
                    <TextField id="mode" label="Mode"
                        value={qso.mode}
                        inputProps={{ style: textFieldStyle }}
                        onChange={(e) => {
                            setQso({ ...qso, mode: e.target.value });
                        }} />
                </Grid>
                {isSwapped &&
                    <>
                        <Grid item xs={4} lg={2}>
                            <TextField id="rstRecv" label="RST Recv"
                                value={qso.rst_recv}
                                inputProps={{ style: textFieldStyle }}
                                onChange={(e) => {
                                    setQso({ ...qso, rst_recv: e.target.value });
                                }} />
                        </Grid>
                        <Grid item xs={4} lg={2}>
                            <TextField id="rstSent" label="RST Sent"
                                value={qso.rst_sent}
                                inputProps={{ style: textFieldStyle }}
                                onChange={(e) => {
                                    setQso({ ...qso, rst_sent: e.target.value });
                                }} />
                        </Grid>
                    </>
                }
                {!isSwapped &&
                    <>
                        <Grid item xs={4} lg={2}>
                            <TextField id="rstSent" label="RST Sent"
                                value={qso.rst_sent}
                                inputProps={{ style: textFieldStyle }}
                                onChange={(e) => {
                                    setQso({ ...qso, rst_sent: e.target.value });
                                }} />
                        </Grid>
                        <Grid item xs={4} lg={2}>
                            <TextField id="rstRecv" label="RST Recv"
                                value={qso.rst_recv}
                                inputProps={{ style: textFieldStyle }}
                                onChange={(e) => {
                                    setQso({ ...qso, rst_recv: e.target.value });
                                }} />
                        </Grid>
                    </>
                }

                <Grid item xs={4} lg={2}>
                    <TextField id="park" label="Park"
                        value={qso.sig_info}
                        inputProps={{ style: textFieldStyle }}
                        onBlur={(e) => {
                            onParkEntry(e.target.value);
                        }}
                        onChange={(e) => {
                            setQso({ ...qso, sig_info: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={6} lg={2}>
                    <TextField id="grid" label="Grid"
                        value={qso.gridsquare}
                        inputProps={{ style: textFieldStyle }}
                        onChange={(e) => {
                            setQso({ ...qso, gridsquare: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={6} lg={3}>
                    <QsoTimeEntry qsoTime={qsoTime} setQsoTime={setQsoTime} />
                </Grid>
                <Grid item xs={12} lg={5}>
                    <TextField id="comments" label="Comments"
                        value={qso.comment}
                        fullWidth={true}
                        inputProps={{ style: commentStyle }}
                        onChange={(e) => {
                            setQso({ ...qso, comment: e.target.value });
                        }} />
                </Grid>
            </Grid>

            <div className='qsoMetaData'>
                <span>Distance: {getDistance()}</span>
                &nbsp;-&nbsp;
                <span>Bearing: {qso.bearing}&deg;</span>
            </div>

            <Stack
                direction={{ xs: 'row', sm: 'row', md: 'row' }}
                spacing={{ xs: 0, sm: 1, md: 1 }}
                sx={{ flexWrap: 'wrap' }}
            >
                <Button variant="outlined" onClick={(e) => handleLogQsoClick(e)}>
                    <StyledTypoGraphy>
                        Log
                    </StyledTypoGraphy>
                </Button>
                <Button variant='contained' onClick={(e) => handleSpotAndLogClick(e)}>
                    <StyledTypoGraphy>
                        Spot+Log
                    </StyledTypoGraphy>
                </Button>
                <Button variant="outlined" onClick={(e) => handleSpotOnlyClick(e)}>
                    <StyledTypoGraphy>
                        Spot
                    </StyledTypoGraphy>
                </Button>
                <Button id="clear-btn" variant="outlined" onClick={(e) => handleClearClick(e)}
                    color='secondary'>
                    <StyledTypoGraphy>
                        Clear
                    </StyledTypoGraphy>
                </Button>
                <Button variant={otherOpsHidden ? 'outlined' : 'contained'} onClick={(e) => handleMultiOpClick(e)}
                    color='secondary'>
                    <StyledTypoGraphy>
                        MultiOp
                    </StyledTypoGraphy>
                </Button>
                <Tooltip title="POTA only: multi-park logging">
                    <Button variant={otherParksHidden ? 'outlined' : 'contained'} onClick={(e) => handleMultiParkClick(e)}
                        color='secondary'>
                        <StyledTypoGraphy>
                            N-Fer
                        </StyledTypoGraphy>
                    </Button>
                </Tooltip>
                <Box sx={{ flexGrow: 1 }}>
                    {!otherOpsHidden && (
                        <TextField id="otherOps" label="Other OPs (comma separated)"
                            value={otherOps}
                            color='warning'
                            margin='normal'
                            fullWidth
                            size='small'
                            sx={{
                                '& .MuiInputLabel-root': {
                                    fontSize: 12
                                },
                                marginY: '4px'
                            }}
                            inputProps={{ style: otherOpsStyle }}
                            onChange={(e) => {
                                setOtherOps(e.target.value);
                            }} />
                    )}

                    {!otherParksHidden && (
                        <TextField id="otherParks" label="Other Parks (comma separated)"
                            value={otherParks}
                            color='warning'
                            margin='normal'
                            size='small'
                            fullWidth
                            sx={{
                                '& .MuiInputLabel-root': {
                                    fontSize: 12
                                },
                                marginY: '4px'
                            }}
                            inputProps={{ style: otherOpsStyle }}
                            onChange={(e) => {
                                setOtherParks(e.target.value);
                            }} />
                    )}
                </Box>
            </Stack>
        </div >
    );
};

