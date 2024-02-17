import * as React from 'react';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Box from '@mui/material/Box';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import { useAppContext } from '../AppContext';
import { ActivatorData } from '../../@types/ActivatorTypes';

import './ActivatorInfo.scss'


interface IActivatorInfoProps {
}

export const ActivatorInfo = (props: IActivatorInfoProps) => {
    const { contextData, setData } = useAppContext();

    React.useEffect(() => {
        const actCall = contextData?.qso?.call;

        if (window.pywebview === undefined) {
            return;
        }

        const q = window.pywebview.api.get_activator_stats(actCall);

        q.then((r) => {
            console.log(r);
            var x = JSON.parse(r) as ActivatorData;
        });

    }, [contextData.qso]);

    return (
        <div className='activator-info'>
        </div>

    );
}
