import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useAppContext } from '../AppContext';

dayjs.extend(utc);

interface ISpotTimeProps {
    dateTimeObj: string
};


export default function SpotTimeCell(props: ISpotTimeProps) {
    const { contextData, setData } = useAppContext();
    
    function getStr(y: string) {
        let x = new Date(y);
        if (props.dateTimeObj === undefined) return '';

        let showSpotAgeStr = window.localStorage.getItem("SHOW_SPOT_AGE") || '1';
        let showSpotAge = parseInt(showSpotAgeStr);

        if (showSpotAge) {
            const diffDayjs = dayjs().subtract( x.getTime(), 'milliseconds');
            if (diffDayjs.minute() > 0) {
                return `${diffDayjs.minute()} min`;
            } else {
                return `${diffDayjs.second()} sec`;
            }
        }

        const hh = x.getHours().toString().padStart(2, '0');
        const mm = x.getMinutes().toString().padStart(2, '0');
        return `${hh}:${mm}`;
    }

    function getClassName(x: string) {
        let now = dayjs().utc();
        let y = dayjs.utc(x);
        let diffInMin = now.diff(y, 'minute');
        if (diffInMin < 1) {
            return contextData.themeMode == 'dark' ?  'timeBrandNew': 'timeBrandNew-light';
        }
        else if (diffInMin < 5) {
            return 'timeNew';
        }
        else if (diffInMin < 20 && diffInMin > 15) {
            return 'timeAging';
        }
        else if (diffInMin > 20) {
            return 'timeOld';
        }
        return 'timeNormal'
    }

    return (
        <span className={getClassName(props.dateTimeObj)}>
            {getStr(props.dateTimeObj)}
        </span>
    );
}