import * as React from 'react';
import { Button, Tooltip } from '@mui/material';
import { checkApiResponse2 } from '../../../Utilities/util';
import { useMessageQueue } from '../../../MessageContext';


export default function OpenLogFileMenuItem() {
    const { addMessage } = useMessageQueue();

    function handleClick() {
        if (window.pywebview) {
            const x = window.pywebview.api.extras.open_user_log_file();
            x.then((r: string) => {
                const x = checkApiResponse2(r, addMessage);
                if (!x.success) {
                    console.log("open log file failed");
                }
            });
        }
    }

    return (
        <Tooltip title="Open the Hunterlog Log file.">
            <Button onClick={handleClick}>
                View Log File
            </Button>
        </Tooltip>
    )
}

