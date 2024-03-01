import * as React from 'react';
import LeafMap from './Map'
import { useAppContext } from '../AppContext';
import { getParkStats } from '../../pota';
import { ParkStats } from '../../@types/PotaTypes';

import './ParkInfo.scss'

export default function ParkInfo() {
    const { contextData, setData } = useAppContext();
    const [stats, setStats] = React.useState<ParkStats | null>(null);

    function fn() {
        let park = contextData?.park?.reference || '';
        if (park === null || park === '')
            return;
        getParkStats(park).then((x: ParkStats) => {
            setStats(x);
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
                        {locationDesc()}
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
}