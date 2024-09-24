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

    function onParkChange() {
        let park = contextData?.park?.reference || '';
        if (park === null || park === '')
            return;
        getParkStats(park).then((x: ParkStats) => {
            setStats(x);
        });

        window.pywebview.api.get_park_hunts(park).then((j: string) => {
            let o = checkApiResponse(j, contextData, setData);
            let hunts = parseInt(o.count);
            setHunts(hunts);
        });
    }

    React.useEffect(() => {
        onParkChange();
    }, [contextData.park]);

    return (
        <div id="parkInfo">
            <div id="parkTitleContainer">
                {contextData && contextData?.park && (
                    parkTitle()
                )}
                {contextData && contextData?.summit && (
                    summitTitle()
                )}
                <hr role='separator' className='sep' />
            </div>
            <LeafMap />
            <div id="parkStatsContainer">
                {stats && contextData?.park && (
                    <>
                        {parkStats()} <br />
                        {firstActivator()} <br />
                        {locationDesc()} <br />
                        {parkHunts()}
                    </>
                )}
                {contextData?.summit && (
                    <>
                        {summitInfo()} <br />
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
        return <span className={getClassName(hunts)}>You have {hunts} QSOs for {contextData?.park?.reference} </span>;
    }

    function summitTitle(): any {
        //const url = `https://pota.app/#/park/${contextData?.park?.reference}`;
        const text = `${contextData?.summit?.summitCode} - ${contextData?.summit?.name}`;

        return <span id="parkTitle">{text}</span>;
    }

    function summitInfo(): React.ReactNode {
        return <>
            <span>region: {contextData?.summit?.regionName}</span> <br/>
            <span>assn: {contextData?.summit?.associationName} - {contextData?.summit?.associationCode}</span> <br/>
            <span>points: {contextData?.summit?.points}</span> <br/>
            <span>alt: {contextData?.summit?.altFt} ft - {contextData?.summit?.altM} m</span>
        </>;
    }
}