
import './WsjtxArea.scss'

import React, { useState } from "react";

import { useAppContext } from '../../AppContext';
import { Tooltip } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import { checkApiResponse2 } from '../../Utilities/util';
import { useMessageQueue } from '../../MessageContext';

export default function WsjtxArea() {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contextData, setData } = useAppContext();
    const { addMessage } = useMessageQueue();

    const [color, setColor] = useState('primary');
    const [tooltipText, setTooltipText] = useState('Unknown');

    function set_wsjtx_status(status: number) {
        // console.log('wsjtx status', status);
        if (status === 1) {
            setColor('warning');
            setTooltipText("WSJTX: marginal")
        }
        else if (status === 2) {
            setColor('error');
            setTooltipText("WSJTX: offline")
        }
        else if (status === 0) {
            setColor('primary');
            setTooltipText("WSJTX: good")
        }
        else
            console.log('unknown param value in set_wsjtx_status');
    }

    function initState() {
        if (!window.pywebview.state) {
            window.pywebview.state = {};
        }
        window.pywebview.state.set_wsjtx_status = set_wsjtx_status;

        const x = window.pywebview.api.get_user_config_val('enable_wsjtx_int');

         x.then(async (r: string) => {
            const x = checkApiResponse2(r, addMessage);
            if (x.success) {
                const enabled: boolean = x.val;

                if (!enabled){
                    const el = document.getElementById("wsjtx-status-id");
                    if (el)
                        el.className = "hidden";
                }
            }
        });
    }

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null) {
            initState();
        }
        else {
            window.addEventListener('pywebviewready', initState);
        }
    }, []);


    return (
        <div className="wsjtx-area" id="wsjtx-status-id">
            <Tooltip title={tooltipText}>
                <PublicIcon color={color} />
            </Tooltip>
        </div>
    );
}