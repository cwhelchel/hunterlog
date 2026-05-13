import { ArrowDropDown, ArrowDropUp } from "@mui/icons-material";
import { Box, Button, ButtonGroup, IconButton } from "@mui/material";
import React from "react";
import { checkApiResponse2 } from "../../Utilities/util";
import { useMessageQueue } from "../../MessageContext";

export default function CwControl() {

    const { addMessage } = useMessageQueue();
    const [speed, setSpeed] = React.useState(20);

    function modSpeed(modVal: number) {
        console.log('modSpeed', modVal, speed);

        const newSpeed = speed + modVal;

        setSpeed(old => old + modVal);

        const res = window.pywebview.api.cat.set_cw_speed(newSpeed);
        res.then((cfgStr: string) => {
            const obj = checkApiResponse2(cfgStr, addMessage);
            console.log(obj);
            if (!obj.success)
                return;
        });
    }

    // tie up page up and down keystrokes to CW speed up and down
    const handlePageUpDown = (event: KeyboardEvent) => {
        if (event.code === 'PageUp') {
            console.log('pageup');
            modSpeed(1);
        }
        else if (event.code === 'PageDown') {
            console.log('pagedown');
            modSpeed(-1);
        }
    }

    React.useEffect(() => {
        document.addEventListener('keydown', handlePageUpDown);
        return () => document.removeEventListener('keydown', handlePageUpDown)
    }, [handlePageUpDown]);

    return (
        <Box>
            <ButtonGroup
                orientation="vertical"
                variant="text"
                size="small"
                sx={{
                    '& .MuiButtonGroup-grouped': {
                        border: 'none', // Removes borders from all buttons
                    },
                    '& .MuiButtonGroup-grouped:not(:last-of-type)': {
                        borderRight: 'none', // Specifically ensures no right-side borders
                    },
                }}>
                <IconButton
                    size="small"
                    color="primary"
                    onClick={() => modSpeed(1)}
                    sx={{
                        padding: '2px', // Reduced padding
                        minWidth: 'auto',  // Allow to shrink
                    }}>
                    <ArrowDropUp fontSize="small"></ArrowDropUp>
                </IconButton>
                <Button size="small" variant="text">
                    {speed}
                </Button>
                <IconButton
                    size="small"
                    color="primary"
                    onClick={() => modSpeed(-1)}
                    sx={{
                        padding: '2px', // Reduced padding
                        minWidth: 'auto',  // Allow to shrink
                    }}>
                    <ArrowDropDown fontSize="small"></ArrowDropDown>
                </IconButton>
            </ButtonGroup>
        </Box>
    );
}
