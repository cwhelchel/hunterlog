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
import { SpotRow } from '../../@types/Spots';
import { map } from 'leaflet';


interface IActivatorInfoProps {
}

const defaultActData: ActivatorData = {
    activator_id: 0,
    callsign: "",
    name: "",
    qth: "",
    gravatar: "",
    activator: { activations: 0, parks: 0, qsos: 0 },
    attempts: { activations: 0, parks: 0, qsos: 0 },
    hunter: { parks: 0, qsos: 0 },
    endorsements: 0,
    awards: 0,
    updated: '1970-01-01T00:00:00'
}

const getUserAvatarURL = (md5: string) => {
    if (!md5) return '';

    return `https://gravatar.com/avatar/${md5}?d=identicon`;
};

export const ActivatorInfo = (props: IActivatorInfoProps) => {
    const { contextData, setData } = useAppContext();
    const [activator, setActivator] = React.useState<ActivatorData>(defaultActData);
    const [huntCount, setHuntCount] = React.useState(0);
    const [actComments, setActComments] = React.useState(['']);
    const [cwSpeed, setCwSpeed] = React.useState(-1);

    React.useEffect(() => {
        if (window.pywebview === undefined) {
            return;
        }

        if (contextData.qso == null) {
            setActivator(defaultActData);
            return;
        }

        let pSpot = window.pywebview.api.get_spot(contextData?.spotId);

        pSpot.then((r: string) => {
            let spot = JSON.parse(r) as SpotRow;
            if (spot) {
                // pipe delimited
                let comments = spot.act_cmts.split('|')
                setActComments(comments);
                setCwSpeed(spot.cw_wpm);
            }
        });

        const actCall = contextData?.qso?.call;
        const q = window.pywebview.api.get_activator_stats(actCall);

        q.then((r: string) => {
            if (r === null) {
                setActivator(defaultActData);
                return;
            }

            if (JSON.parse(r).success == false) {
                setActivator(defaultActData);
                return;
            } 

            //console.log(`parsing activator data: ${r}`);
            var x = JSON.parse(r) as ActivatorData;
            //console.log(x);
            setActivator(x);
        });

        let hunts = window.pywebview.api.get_activator_hunts(actCall);
        hunts.then((x: number) => {
            setHuntCount(x);
        });

    }, [contextData.qso]);

    return (
        <div className='activator-info'>
            {activator !== null && activator.activator_id !== 0 &&
                <>
                    <div className="activatorTitle">
                        <span>{activator?.callsign} - {activator?.name}</span>
                        <hr role='separator' />
                    </div>
                    <img src={getUserAvatarURL(activator?.gravatar)} style={{ float: "left" }} />
                    <div className='activatorData'>
                        <span>{activator?.qth}</span>
                        <br />
                        <span><em>{activator?.activator.activations} activations {activator?.activator.parks} parks {activator?.activator.qsos} qsos</em></span>
                        <br />
                        <span><em>Hunted {activator?.hunter.parks} parks {activator?.hunter.qsos} qsos</em></span>
                        <br />
                        <span><em>You have {huntCount} QSOs with {activator?.callsign}</em></span>
                        <br/>
                    </div>
                    <br/>
                    <div className='activatorSpeed'>
                        {cwSpeed > 0 && (
                            <span>CW speed is {cwSpeed}<br/></span>
                        )}
                    </div>
                    <span className='activatorCmtsHdg'>Activator comments:</span>
                    <hr role='separator' className='separator'/>
                    <div className='activatorComments'>
                        {actComments.map((comment) => (
                            <span>{comment}<br/></span>
                        ))}
                    </div>

                </>
            }
        </div>

    );
}
