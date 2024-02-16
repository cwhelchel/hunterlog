import * as React from 'react';
import { IconButton } from '@mui/material';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import OutlinedInputClasses from '@mui/material/OutlinedInput/outlinedInputClasses'


interface CustomOpenPickerProps {
    isPlayValue: boolean;
    setter: (value: boolean) => void;
}

const customOpenPickerButton = ({ isPlayValue, setter }: CustomOpenPickerProps) => {
    return (
        <IconButton
            aria-label="play-timer"
            onClick={(e) => setter(!isPlayValue)}>
            {isPlayValue && (<PauseOutlinedIcon color='primary' />)}
            {!isPlayValue && (<PlayArrowOutlinedIcon color='error' />)}
        </IconButton>
    );
};


interface QsoTimeEntryProps {
    qsoTime: Dayjs;
    setQsoTime: (newTime: Dayjs) => void;
}


export default function QsoTimeEntry({ qsoTime, setQsoTime }: QsoTimeEntryProps) {
    const [isPlaying, setIsPlaying] = React.useState(true);

    // setup a timer to increment qso time by 1 second
    React.useEffect(() => {
        const interval: any = setInterval(() => {
            incQsoTime();
        }, 1000);
        return () => clearInterval(interval);
    });

    // whenever the button is clicked set qsoTime to now
    React.useEffect(() => {
        setQsoTime(dayjs());
    }, [isPlaying]);

    return (
        <TimePicker
            label="Time On"
            sx={{
                "& .MuiOutlinedInput-root": { "color": isPlaying ? "inherit" : "#FF2D00" },
            }}
            ampm={false}
            disabled={isPlaying}
            timezone="UTC"
            format='HH:mm:ss'
            value={qsoTime}
            onChange={(e) => {
                // console.log(e?.toISOString());
                setQsoTime(e);
            }}
            slots={{ openPickerButton: customOpenPickerButton }}
            slotProps={{
                openPickerButton: { isPlayValue: isPlaying, setter: setIsPlaying },
                textField: {
                    sx: {
                        [`.${OutlinedInputClasses.root}`]: {
                            width: 233,
                        },
                    }
                },
            }}
        />
    );

    function incQsoTime() {
        if (isPlaying) {
            const t = dayjs(qsoTime).add(1, 's');
            //console.log(t.toISOString());
            setQsoTime(t);
        }
    }

}