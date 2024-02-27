import * as React from 'react';

import { useAppContext } from '../AppContext';

import Tooltip from '@mui/material/Tooltip';
import { ActivatorData } from '../../@types/ActivatorTypes';
import Badge from '@mui/material/Badge';

declare interface ICallToolTipProps {
    callsign: string,
    op_hunts: number
}

export default function CallToolTip(props: ICallToolTipProps) {
    const [name, setName] = React.useState('');

    React.useEffect(() => {
        if (window.pywebview !== undefined)
            getActivatorData()
    }, []);

    function getActivatorData() {
        const x = window.pywebview.api.get_activator_stats(props.callsign);

        x.then((r: string) => {
            if (r == null) return;
            var x = JSON.parse(r) as ActivatorData;
            setName(x.name)
        });
    }

    return (

        <Tooltip title={name}>
            <Badge
                badgeContent={props.op_hunts}
                color="secondary"
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}>

                <span id="activatorText">{props.callsign}</span>
            </Badge>
        </Tooltip>
    );
}