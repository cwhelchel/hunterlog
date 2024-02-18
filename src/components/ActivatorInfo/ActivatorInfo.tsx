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

const defaultActData: ActivatorData = {
    activator_id: 0,
    callsign: "",
    name: "",
    qth: "",
    gravatar: "",
    activator: { activations: 0, parks: 0, qsos: 0 },
    attempts: "",
    hunter: "",
    endorsements: 0,
    awards: 0,
}

const getUserAvatarURL = (md5) => {
    if (!md5) return '';

    return `https://gravatar.com/avatar/${md5}?d=identicon`;
};

export const ActivatorInfo = (props: IActivatorInfoProps) => {
    const { contextData, setData } = useAppContext();
    const [activator, setActivator] = React.useState<ActivatorData>(defaultActData);

    React.useEffect(() => {
        const actCall = contextData?.qso?.call;

        if (window.pywebview === undefined) {
            return;
        }

        const q = window.pywebview.api.get_activator_stats(actCall);

        q.then((r) => {
            console.log(r);
            var x = JSON.parse(r) as ActivatorData;
            console.log(x);
            setActivator(x);
        });

    }, [contextData.qso]);

    return (
        <div className='activator-info'>
            {activator.activator_id !== 0 &&
                <>
                    <h3>{activator?.callsign} - {activator?.name}</h3>
                    <img src={getUserAvatarURL(activator?.gravatar)} />
                    <span>{activator?.qth}</span>
                    <br />
                    <span><em>{activator?.activator.activations} activations {activator?.activator.parks} parks {activator?.activator.qsos} qsos</em></span>
                    <br />
                    <span><em>Hunted {activator?.hunter.parks} parks {activator?.hunter.qsos} qsos</em></span>
                </>
            }
        </div>

    );
}
