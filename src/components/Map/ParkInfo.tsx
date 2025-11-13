import * as React from 'react';
import LeafMap from './Map'
import { useAppContext } from '../AppContext';
import { getParkStats } from '../../tsx/pota';
import { ParkStats } from '../../@types/PotaTypes';

import './ParkInfo.scss'
import { checkApiResponse } from '../../tsx/util';
import ProgramIcon from '../Icons/ProgramIcon';


export default function ParkInfo() {
    const { contextData, setData } = useAppContext();
    const [stats, setStats] = React.useState<ParkStats | null>(null);
    const [hunts, setHunts] = React.useState(0);
    const [newBand, setNewBand] = React.useState(false);
    const [bandsText, setBandsText] = React.useState("");

    function onParkChange() {
        const park = contextData?.park?.reference || '';
        if (park === null || park === '')
            return;

        const freq = contextData?.qso?.freq;

        if (contextData?.park?.parktypeId != 0) {
            getParkStats(park).then((x: ParkStats) => {
                setStats(x);
            });
        }

        window.pywebview.api.get_park_hunts(park).then((j: string) => {
            const o = checkApiResponse(j, contextData, setData);
            const hunts = parseInt(o.count);
            setHunts(hunts);
        });

        if (freq !== null || freq !== '') {
            window.pywebview.api.get_park_hunted_bands(freq, park).then((j: string) => {
                const o = checkApiResponse(j, contextData, setData);
                const bandTxt = o.bands;
                const nb = o.new_band;
                setNewBand(nb);
                setBandsText("Hunted on: " + bandTxt);
            });
        }
    }

    React.useEffect(() => {
        onParkChange();
    }, [contextData.park]);

    return (
        <div id="parkInfo">
            <div id="parkTitleContainer">
                {contextData && contextData?.park && contextData?.park?.parktypeId != 0 && (
                    parkTitle()
                )}
                {contextData && contextData?.park?.parktypeDesc == 'SOTA SUMMIT' && (
                    summitTitle()
                )}
                {contextData && contextData?.park?.parktypeDesc == 'WWFF LOCATION' && (
                    wwffTitle()
                )}
                {contextData && contextData?.park?.parktypeDesc == 'WWBOTA REF' && (
                    bunkerTitle()
                )}

                <hr role='separator' className='sep' />
            </div>
            <LeafMap />
            <div id="parkStatsContainer">
                {stats && contextData?.park && contextData?.park?.parktypeId != 0 && (
                    <>
                        {parkStats()} <br />
                        {firstActivator()} <br />
                        {locationDesc()} <br />
                        {parkHunts()}
                    </>
                )}
                {contextData?.park?.parktypeDesc == 'SOTA SUMMIT' && (
                    <>
                        {summitInfo()} <br />
                        {parkHunts()}
                    </>
                )}
                {contextData?.park?.parktypeDesc == 'WWFF LOCATION' && (
                    <>
                        {wwffInfo()} <br />
                        {parkHunts()}
                    </>
                )}

                {contextData && contextData?.park?.parktypeDesc == 'WWBOTA REF' && (
                    <>
                        {bunkerInfo()} <br />
                        {parkHunts()}
                    </>
                )}
            </div>
        </div>
    );

    function parkTitle(): React.ReactNode {
        const url = `https://pota.app/#/park/${contextData?.park?.reference}`;
        const text = `${contextData?.park?.reference} - ${contextData?.park?.name} ${contextData?.park?.parktypeDesc}`;

        return <>
            <ProgramIcon sig="POTA" />
            <span id="parkTitle" onClick={() => {
                window.open(url);
            }}>{text}</span>
        </>;

    }

    function parkStats(): React.ReactNode {
        return <span>{stats?.activations}/{stats?.attempts} activations with {stats?.contacts} QSOs </span>;
    }

    function firstActivator(): React.ReactNode {
        return <span>First activator: {contextData?.park?.firstActivator} on {contextData?.park?.firstActivationDate} </span>;
    }
    function locationDesc(): React.ReactNode {
        return <span style={{ overflow: "hidden" }}>LOC: {contextData?.park?.locationDesc}</span>;
    }
    function parkHunts(): React.ReactNode {
        function getClassName(hunts: number) {
            if (hunts == 0)
                return 'parkQsosNone';
            return 'parkQsos';
        }
        return <>
            <span className={getClassName(hunts)}>You have {hunts} QSOs for {contextData?.park?.reference} </span>
            {(hunts == 0 && contextData?.park?.parktypeDesc == 'SOTA SUMMIT') && (
                <span className="label label-danger">NEW SUMMIT</span>
            )}
            {(hunts == 0 && contextData?.park?.parktypeDesc != 'SOTA SUMMIT') && (
                <span className="label label-danger">NEW PARK</span>
            )}
            {newBand && (
                <span className="label label-warning" title={bandsText}>NEW BAND</span>
            )}
        </>;
    }

    function summitTitle(): React.ReactNode {
        const url = `${contextData?.park?.website}`;
        const text = `${contextData?.park?.reference} - ${contextData?.park?.name}`;

        return <>
            <ProgramIcon sig='SOTA' />
            <span id="parkTitle" onClick={() => {
                window.open(url);
            }}>{text}</span>
        </>;
    }

    function summitInfo(): React.ReactNode {
        // for random summit info we hijack some of the not-displayed pieces of park info
        return <>
            <span>region: {contextData?.park?.locationName}</span> <br />
            <span>entity: {contextData?.park?.entityName}</span> <br />
            <span>points: {contextData?.park?.accessMethods}</span> <br />
            <span>alt: {contextData?.park?.activationMethods}</span> <br />
        </>;
    }

    function wwffTitle(): React.ReactNode {
        const url = `${contextData?.park?.website}`;
        const text = `${contextData?.park?.reference} - ${contextData?.park?.name}`;

        return <>
            <ProgramIcon sig='WWFF' />
            <span id="parkTitle" onClick={() => {
                console.log(url);
                window.open(url);
            }}>{text}</span>
        </>;
    }

    function wwffInfo(): React.ReactNode {
        // for random summit info we hijack some of the not-displayed pieces of park info
        return <>
            <span>dxcc: {contextData?.park?.locationDesc}</span> <br />
        </>;
    }

    function bunkerTitle(): React.ReactNode {
        const text = `${contextData?.park?.reference} - ${contextData?.park?.name}`;
        return <>
            <ProgramIcon sig="WWBOTA" />
            <span id="parkTitle">{text}</span>
        </>;
    }

    function bunkerInfo(): React.ReactNode {
        return <>
            <span>scheme: {contextData?.park?.locationDesc}</span> <br />
            <span>type: {contextData?.park?.locationName}</span> <br />
        </>;
    }

}