import * as React from 'react';
import LeafMap from './Map'
import { useAppContext } from '../AppContext';
import { getParkStats } from '../../pota';
import { ParkStats } from '../../@types/PotaTypes';

import './ParkInfo.scss'
import { checkApiResponse } from '../../util';

export default function ParkInfo() {
    const { contextData, setData } = useAppContext();
    const [stats, setStats] = React.useState<ParkStats | null>(null);
    const [hunts, setHunts] = React.useState(0);
    const [newBand, setNewBand] = React.useState(false);
    const [bandsText, setBandsText] = React.useState("");

    function onParkChange() {
        let park = contextData?.park?.reference || '';
        if (park === null || park === '')
            return;

        let freq = contextData?.qso?.freq;

        if (contextData?.park?.parktypeId != 0) {
            getParkStats(park).then((x: ParkStats) => {
                setStats(x);
            });
        }

        window.pywebview.api.get_park_hunts(park).then((j: string) => {
            let o = checkApiResponse(j, contextData, setData);
            let hunts = parseInt(o.count);
            setHunts(hunts);
        });

        if (freq !== null || freq !== '') {
            window.pywebview.api.get_park_hunted_bands(freq, park).then((j: string) => {
                let o = checkApiResponse(j, contextData, setData);
                let bandTxt = o.bands;
                let nb = o.new_band;
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
            </div>
        </div>
    );

    function parkTitle(): any {
        const url = `https://pota.app/#/park/${contextData?.park?.reference}`;
        const text = `${contextData?.park?.reference} - ${contextData?.park?.name} ${contextData?.park?.parktypeDesc}`;

        return <span id="parkTitle" onClick={() => {
            window.open(url);
        }}>{text}</span>;
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
            {(hunts == 0 && contextData?.park?.parktypeDesc == 'SOTA SUMMIT' ) && (
                <span className="label label-danger">NEW SUMMIT</span>
            )}
            {(hunts == 0 && contextData?.park?.parktypeDesc != 'SOTA SUMMIT' ) && (
                <span className="label label-danger">NEW PARK</span>
            )}
            {newBand && (
                <span className="label label-warning" title={bandsText}>NEW BAND</span>
            )}
        </>;
    }

    function summitTitle(): any {
        const url = `${contextData?.park?.website}`;
        const text = `🗻 ${contextData?.park?.reference} - ${contextData?.park?.name}`;

        return <span id="parkTitle" onClick={() => {
            window.open(url);
        }}>{text}</span>;
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

    function wwffTitle(): any {
        const url = `${contextData?.park?.website}`;
        const text = `🌙 ${contextData?.park?.reference} - ${contextData?.park?.name}`;

        return <span id="parkTitle" onClick={() => {
            console.log(url);
            window.open(url);
        }}>{text}</span>;
    }

    function wwffInfo(): React.ReactNode {
        // for random summit info we hijack some of the not-displayed pieces of park info
        return <>
            <span>dxcc: {contextData?.park?.locationDesc}</span> <br />
        </>;
    }

}