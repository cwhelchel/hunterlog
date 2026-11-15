import * as React from 'react';
import { Button, Tooltip } from '@mui/material';
import { checkApiResponse2 } from '../../../Utilities/util';
import { useMessageQueue } from '../../../MessageContext';


export default function OpenUserDirectoryMenuItem() {
    const { addMessage } = useMessageQueue();

    function handleClick() {
        if (window.pywebview) {
            const x = window.pywebview.api.extras.open_user_data_dir();
            x.then((r: string) => {
                const x = checkApiResponse2(r, addMessage);
                if (!x.success) {
                    console.log("open file explorer failed");
                }
            });
        }
    }

    return (
        <Tooltip title="Open the Hunterlog User Data directory.">
            <Button onClick={handleClick}>
                Open User Dir
            </Button>
        </Tooltip>
    )
}

