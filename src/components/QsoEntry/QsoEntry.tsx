import * as React from 'react';
import { Button, TextField, Grid, Stack } from '@mui/material';
import { useAppContext } from '../AppContext';
import { Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

import './QsoEntry.scss'
import QsoTimeEntry from './QsoTimeEntry';
import { Qso } from '../../@types/QsoTypes';
import { checkApiResponse, checkReferenceForPota, checkReferenceForSota, checkReferenceForWwff, setToastMsg } from '../../util';
import { getParkInfo, getStateFromLocDesc, getSummitInfo } from '../../pota';
import { Park } from '../../@types/Parks';
import { ParkInfo } from '../../@types/PotaTypes';
import { Summit } from '../../@types/Summit';

dayjs.extend(utc);


let defaultQso: Qso = {
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
    state: ''
}


export default function QsoEntry() {
    const [qso, setQso] = React.useState(defaultQso);
    const [otherOps, setOtherOps] = React.useState('');
    const [otherOpsHidden, setOtherOpsHidden] = React.useState(true);
    const [otherParks, setOtherParks] = React.useState('');
    const [otherParksHidden, setOtherParksHidden] = React.useState(true);
    const [qsoTime, setQsoTime] = React.useState<Dayjs>(dayjs('2022-04-17T15:30'));
    const { contextData, setData } = useAppContext();

    function logQso() {
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        console.log(`logging qso at ${contextData.park?.name}`);

        if (qso.sig_info !== undefined && qso.sig_info !== "") {
            // NOTE: compress this for multi location parks like PotaPlus?
            let loc = contextData.park?.locationDesc;
            let cmt = qso.comment ?? '';
            let name = `${contextData.park?.name} ${contextData.park?.parktypeDesc}`;
            qso.comment = `[${qso.sig} ${qso.sig_info} ${loc} ${qso.gridsquare} ${name}] ` + cmt;
        }

        qso.time_on = (qsoTime) ? qsoTime.toISOString() : dayjs().toISOString();
        qso.qso_date = qso.time_on;

        if (otherParks) {
            const myPotaRef = getPotaRef();

            if (!myPotaRef.ok)
                setToastMsg("Bad POTA Ref in Other Parks", contextData, setData);

            // set qso val
            return;
        }

        let multiOps = otherOps;

        if (multiOps !== null && multiOps != '') {
            let ops = multiOps.split(',');

            // log main window first then loop thru multiops
            window.pywebview.api.log_qso(qso).then((x: string) => {
                checkApiResponse(x, contextData, setData);

                ops.forEach(async function (call) {
                    console.log(`logging multiop QSO: ${call}`);
                    await sleep(100);
                    let newQso = { ...qso };
                    newQso.call = call.trim();
                    window.pywebview.api.log_qso(newQso).then((x: string) => {
                        checkApiResponse(x, contextData, setData);
                    });
                });
            });
        } else {
            // log a single operator
            window.pywebview.api.log_qso(qso).then((x: string) => {
                let json = checkApiResponse(x, contextData, setData);

                window.pywebview.api.refresh_spot(contextData.spotId, qso.call, qso.sig_info)
                    .then((x: string) => {
                        window.pywebview.state.getSpots();
                    });
            });
        }
    }

    interface IGetPotaRef {
        text: string | undefined;
        ok: boolean;
    }

    function getPotaRef(): IGetPotaRef {
        let res = otherParks;
        let arr = res.split(',');
        arr.forEach((x) => {
            const isPota = checkReferenceForPota(x);
            console.log(x);
            if (!isPota) {
                // setToastMsg("Bad POTA Ref in Other Parks", contextData, setData);
                return { ok: false };
            }
        })
        return {
            ok: true,
            text: res
        };
    }

    function spotActivator() {
        if (qso.sig != 'POTA')
            return;
        console.log(`spotting activator at ${contextData.park?.name}`);
        let park = qso.sig_info;

        let multiOps = otherOps;
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

    function handleLogQsoClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        logQso();
        handleClearClick(event);
    }

    function handleSpotAndLogClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        logQso();
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
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        console.log("clearing qso...");
        setQso(defaultQso);
        contextData.park = null;
        contextData.qso = null;
        contextData.otherOperators = '';
        setData(contextData);

        setOtherOpsHidden(true);
        setOtherOps('');
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
        let units = window.localStorage.getItem("USE_FREEDOM_UNITS") || '1';
        let use_imperial = parseInt(units);

        if (use_imperial) {
            let mi = Math.trunc(qso.distance * 0.621371);
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
                let newQso = { ...qso };
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
                let newQso = setLocalQso();

                // create a qso object in context data
                newCtxData.qso = newQso;
                setData(newCtxData);
            }
        }

        function getRefInfo(): any {
            let isSota = checkReferenceForSota(park);

            if (isSota) {
                console.log('doing a SOTA');

                window.pywebview.api.get_summit(park)
                    .then((r: string) => {
                        let summit = JSON.parse(r) as Park;
                        newCtxData.park = summit;

                        updateQsoData(
                            summit.grid6,
                            'SOTA',
                            summit.reference,
                            ''
                        );
                    });
                return;
            }

            //TODO check this
            let isWwff = checkReferenceForWwff(park);
            if (isWwff) {
                console.log('doing a WWFF');

                window.pywebview.api.get_wwff_info(park)
                    .then((r: string) => {
                        let summit = JSON.parse(r) as Park;
                        newCtxData.park = summit;

                        updateQsoData(
                            summit.grid6,
                            'WWFF',
                            summit.reference,
                            ''
                        );
                    });
                return;
            }
            // TODO: why not use api func to pull from db / from api?
            let p = getParkInfo(park);
            p.then((apiData: ParkInfo) => {
                let x: Park = {
                    id: apiData.parkId,
                    reference: apiData.reference,
                    name: apiData.name,
                    grid6: apiData.grid6,
                    active: apiData.active == 1,
                    latitude: apiData.latitude,
                    longitude: apiData.longitude,
                    parkComments: '',
                    parktypeId: apiData.parktypeId,
                    parktypeDesc: apiData.parktypeDesc,
                    locationDesc: apiData.locationDesc,
                    firstActivator: apiData.firstActivator,
                    firstActivationDate: apiData.firstActivationDate,
                    website: '',
                    locationName: '',
                    entityName: '',
                    accessMethods: '',
                    activationMethods: ''
                };

                newCtxData.park = x;

                updateQsoData(
                    apiData.grid6,
                    'POTA',
                    apiData.reference,
                    getStateFromLocDesc(apiData.locationDesc)
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
        let x = ops.filter(e => e !== contextData.qso?.call);

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
        let x = parks.filter(e => e !== contextData.qso?.sig_info);

        if (x.length > 0) {
            setOtherParks(x.join(','));
        }
    }


    // when the app context changes (ie a user clicks on a different spot)
    // we need to update our TextFields
    React.useEffect(() => {
        updateQsoEntry();
    }, [contextData.qso]);

    React.useEffect(() => {
        updateOtherOperators(contextData.otherOperators);
    }, [contextData.otherOperators]);

    React.useEffect(() => {
        updateOtherParks(contextData.otherParks);
    }, [contextData.otherParks]);

    const textFieldStyle: React.CSSProperties = { fontSize: 14, textTransform: "uppercase" };
    const otherOpsStyle: React.CSSProperties = { fontSize: 14, textTransform: "uppercase", color: 'orange' };
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
            <Grid container
                spacing={{ xs: 1, md: 1, lg: 2 }}
            >
                <Grid item xs={4} lg={3}>
                    <TextField id="callsign" label="Callsign"
                        value={qso.call}
                        inputProps={{ style: textFieldStyle }}
                        onBlur={(e) => { onCallsignEntry(e.target.value); }}
                        onChange={(e) => {
                            setQso({ ...qso, call: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={4} lg={3}>
                    <TextField id="freq" label="Frequency"
                        value={qso.freq}
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
                <Grid item xs={4} lg={2}>
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
                spacing={{ xs: 0, sm: 1, md: 2 }}>
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
                <Button variant="outlined" onClick={(e) => handleClearClick(e)}
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
                <Button variant={otherParksHidden ? 'outlined' : 'contained'} onClick={(e) => handleMultiParkClick(e)}
                    color='secondary'>
                    <StyledTypoGraphy>
                        Multi-Park
                    </StyledTypoGraphy>
                </Button>
            </Stack>
            <>
                {!otherOpsHidden && (
                    <TextField id="otherOps" label="Other OPs (comma separated)"
                        value={otherOps}
                        fullWidth
                        color='warning'
                        margin='normal'
                        inputProps={{ style: otherOpsStyle }}
                        onChange={(e) => {
                            setOtherOps(e.target.value);
                        }} />
                )}

                {!otherParksHidden && (
                    <TextField id="otherParks" label="Other Parks (comma separated)"
                        value={otherParks}
                        fullWidth
                        color='warning'
                        margin='normal'
                        inputProps={{ style: otherOpsStyle }}
                        onChange={(e) => {
                            setOtherParks(e.target.value);
                        }} />
                )}
            </>
        </div >
    );
};

