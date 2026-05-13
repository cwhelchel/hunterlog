import { Box, Button, ToggleButton } from "@mui/material";
import React from "react";
import { checkApiResponse2 } from "../../Utilities/util";
import { useMessageQueue } from "../../MessageContext";
import { useAppContext } from "../../AppContext";

export default function FxControl() {

    const { addMessage } = useMessageQueue();
    const [freq, setFreq] = React.useState('');
    const [isOn, setIsOn] = React.useState(false);
    const intervalRef = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const { contextData, setData } = useAppContext();

    function getRigFreq() {
        const res = window.pywebview.api.cat.get_freq();

        res.then((cfgStr: string) => {
            const obj = checkApiResponse2(cfgStr, addMessage);

            console.log(obj);
            if (!obj.success)
                return;

            const fx = obj.fx;
            setFreq(fx);
        });
    }

    React.useEffect(() => {
        if (isOn) {
            intervalRef.current = setInterval(() => {
                // clear old read
                setFreq('');

                // get new read
                getRigFreq();
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }

        return () => {
            clearInterval(intervalRef.current);
        }
    }, [isOn, getRigFreq]);

    React.useEffect(() => {
        // set QSO context data with new frequency
        const newCtxData = { ...contextData };
        newCtxData.rigFreqRead = freq;
        setData(newCtxData);
    }, [freq]);

    const tinyButton = {
        padding: '2px',    // Reduced padding
        minWidth: 'auto',  // Allow to shrink
    };

    return (
        <Box>
            <ToggleButton
                value="check"
                title="Toggle continuous reading of frequency from CAT control"
                selected={isOn}
                sx={tinyButton}
                onChange={() => setIsOn(x => !x)}>

                <Button size="small" variant="text" sx={tinyButton}>
                    𝑓x
                </Button>

            </ToggleButton>
        </Box>
    );
}
