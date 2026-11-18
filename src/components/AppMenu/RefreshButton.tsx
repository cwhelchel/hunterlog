import * as React from 'react';
import { Box, CircularProgress, IconButton, Tooltip, keyframes } from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme } from '@mui/material/styles';

const highlightLimit = 20;

const pulseGlow = keyframes`
    0% {
        opacity: 0.0;
        filter: brightness(1) drop-shadow(0 0 0px rgba(255, 255, 255, 0));
    }
    50% {
        opacity: 1.0;
        filter: brightness(1.75) drop-shadow(0 0 5px rgba(255, 230, 0, 1.0));
    }
    100% {
        opacity: 0.0;
        filter: brightness(1) drop-shadow(0 0 0px rgba(255, 255, 255, 0));
    }
`

export default function RefreshButton() {

    const timerRef = React.useRef<number | null>(null);

    const theme = useTheme();
    const currentMode = theme.palette.mode; // 'light' or 'dark'

    const refreshBtnColor = (currentMode === 'dark') ? 'primary.main' : 'primary.contrastText';

    const [progress, setProgress] = React.useState(() => {
        const saved = sessionStorage.getItem('progressVal');
        return saved !== null ? parseInt(saved) : 100;
    });

    React.useEffect(() => {
        // automatically sync state changes to sessionStorage
        sessionStorage.setItem('progressVal', progress.toString());
    }, [progress]);

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null)
            init();
        else
            window.addEventListener('pywebviewready', init);

        timerRef.current =
            setInterval(() => {
                setProgress((prevProgress) => (prevProgress <= 0 ? 100 : prevProgress - 1.6666));
            }, 1000);

        return () => {
            if (timerRef.current)
                clearInterval(timerRef.current);
        };

    }, []);

    function workingDone() {
        // called when the main update method of the back end finishes
        setProgress(100);
    }

    function init() {
        if (!window.pywebview.state) {
            window.pywebview.state = {}
        }
        window.pywebview.state.workingDone = workingDone;
    }

    return (
        <Tooltip title="Refresh">
            <IconButton onClick={() => {
                location.reload();
            }}>
                <Box sx={{
                    position: 'relative',
                    animation: progress < highlightLimit ? `${pulseGlow} 0.5s ease-in-out infinite` : 'none',

                }}>
                    <RefreshIcon sx={{
                        color: progress < highlightLimit ? 'rgb(255, 230, 0)' : refreshBtnColor,
                    }} />
                    <CircularProgress
                        size={28}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            marginTop: '-17px',
                            marginLeft: '-14px',
                            opacity: '0.5',
                            color: progress < highlightLimit ? 'rgb(255, 230, 0)' : refreshBtnColor,
                        }}
                        thickness={3.0}
                        variant="determinate"
                        value={progress}
                    />
                </Box>
            </IconButton >
        </Tooltip>

    )
}