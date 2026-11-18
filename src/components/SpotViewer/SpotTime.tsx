import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Box } from '@mui/material';
import { useState } from 'react';

dayjs.extend(utc);

interface ISpotTimeProps {
    dateTimeObj: string
};


export default function SpotTimeCell(props: ISpotTimeProps) {

    function getStr(y: string) {
        const x = new Date(y);
        if (props.dateTimeObj === undefined) return '';

        const showSpotAgeStr = window.localStorage.getItem("SHOW_SPOT_AGE") || '1';
        const showSpotAge = parseInt(showSpotAgeStr);

        if (showSpotAge) {
            const diffDayjs = dayjs().subtract(x.getTime(), 'milliseconds');
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
        const now = dayjs().utc();
        const y = dayjs.utc(x);
        const diffInMin = now.diff(y, 'minute');

        if (diffInMin < 1) {
            return 'timeBrandNew'
        }
        else if (diffInMin < 5) {
            return 'timeNew';
        }
        else if (diffInMin <= 20 && diffInMin >= 15) {
            return 'timeAging';
        }
        else if (diffInMin > 20) {
            return 'timeOld';
        }
        
        return 'text'
    }

    const className = getClassName(props.dateTimeObj);

    return (
        <Box component={'span'} sx={{
            color: className + ".main",
            fontWeight: className == 'timeBrandNew' ? 600 : 'inherit'
        }}>
            {getStr(props.dateTimeObj)}
        </Box>
    );
}