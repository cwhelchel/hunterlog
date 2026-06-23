import * as React from 'react';
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAppContext } from '../AppContext';

export default function RefreshButton() {

    const { contextData } = useAppContext();
    const [refreshBtnColor, setRefreshBtnColor] = React.useState('#008C2C');
    const timerRef = React.useRef<number | null>(null);

    const [progress, setProgress] = React.useState(() => {
        const saved = sessionStorage.getItem('progressVal');
        return saved !== null ? parseInt(saved) : 100;
    });

    const LIGHT_COLOR = '#ffffff';
    const DARK_COLOR = '#008C2C';

    React.useEffect(() => {
        if (contextData.themeMode == 'dark')
            setRefreshBtnColor(DARK_COLOR)
        else if (contextData.themeMode == 'light')
            setRefreshBtnColor(LIGHT_COLOR)
    }, [contextData.themeMode]);

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

                <Box sx={{ position: 'relative' }}>
                    <RefreshIcon sx={{ color: refreshBtnColor }} />
                    <CircularProgress
                        size={28}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            marginTop: '-17px',
                            marginLeft: '-14px',
                            opacity: '0.5',
                            color: refreshBtnColor
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