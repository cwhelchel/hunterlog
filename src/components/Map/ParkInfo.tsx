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
    const [hunts, setHunts]  = React.useState(0);

    function fn() {
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
        fn();
    }, [contextData.park]);

    return (
        <div id="parkInfo">
            <div id="parkTitleContainer">
                {contextData && contextData?.park && (
                    parkTitle()
                )}
                 <hr role='separator' className='sep' />
            </div>
            <LeafMap />
            <div id="parkStatsContainer">
                {stats && (
                    <>
                        {parkStats()} <br />
                        {firstActivator()} <br/>
                        {locationDesc()} <br/>
                        {parkHunts()}
                    </>
                )}
            </div>
        </div>
    );

    function parkTitle(): React.ReactNode {
        return <span id="parkTitle">{contextData?.park?.reference} - {contextData?.park?.name} {contextData?.park?.parktypeDesc}</span>;
    }

    function parkStats(): React.ReactNode {
        return <span>{stats?.activations}/{stats?.attempts} activations with {stats?.contacts} QSOs </span>;
    }

    function firstActivator(): React.ReactNode {
        return <span>First activator: {contextData?.park?.firstActivator} on {contextData?.park?.firstActivationDate} </span>;
    }
    function locationDesc(): React.ReactNode {
        return <span style={{overflow: "hidden"}}>LOC: {contextData?.park?.locationDesc}</span>;
    }
    function parkHunts(): React.ReactNode {
        function getClassName(hunts: number) {
            if (hunts == 0) 
                return 'parkQsosNone';
            return 'parkQsos';
        }
        return <span className={getClassName(hunts)}>You have {hunts} QSOs for {contextData?.park?.reference} </span>;
    }
}