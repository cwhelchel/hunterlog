import * as React from 'react';
import Button from '@mui/material/Button';
import { useGridApiContext, gridFilteredSortedRowIdsSelector, useGridSelector } from '@mui/x-data-grid';
import { useConfigContext } from '../Config/ConfigContextProvider';
import { checkApiResponse } from '../../tsx/util'
import { useAppContext } from '../AppContext';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import LoopIcon from '@mui/icons-material/Loop';
import { styled, keyframes } from '@mui/system';

export default function ScanButton() {
    const apiRef = useGridApiContext();
    const filteredIds = useGridSelector(apiRef, gridFilteredSortedRowIdsSelector);
    const { config } = useConfigContext();
    const { contextData, setData, setLastQsyBtnId } = useAppContext();
    const [isScanning, setIsScanning] = React.useState(false);
    const [scanIndex, setScanIndex] = React.useState(0);

    const waitTime = (config.scan_wait_time || 5) * 1000;

    React.useEffect(() => {
        console.log("isScanning state changed to:", isScanning);
    }, [isScanning]);

    React.useEffect(() => {
        let scanInterval: number;
        let pttInterval: number;

        if (isScanning) {
            // Fast PTT check every 250ms
            pttInterval = setInterval(async () => {
                if (window.pywebview?.api) {
                    try {
                        const pttResp = await window.pywebview.api.get_ptt();
                        const json = checkApiResponse(pttResp, contextData, setData);
                        console.log("PTT check - success:", json.success, "ptt value:", json.ptt, "type:", typeof json.ptt);
                        // loose equality check or string conversion to handle int/string return
                        if (json.success && String(json.ptt) !== '0') {
                            console.log("Stopping scan due to PTT: ", json.ptt);
                            setIsScanning(false);
                            return;
                        }
                    } catch (e) {
                        console.error("Error checking PTT", e);
                    }
                }
            }, 250); // Check PTT every 250ms

            // Scan interval to move to next station
            scanInterval = setInterval(async () => {
                // Get next row
                const currentIds = gridFilteredSortedRowIdsSelector(apiRef);
                if (currentIds.length <= 1) {
                    console.log("Stopping scan due to row len: ", currentIds.length);
                    setIsScanning(false);
                    return;
                }

                let nextIndex = scanIndex + 1;
                if (nextIndex >= currentIds.length) {
                    nextIndex = 0;
                }
                setScanIndex(nextIndex);

                const nextId = currentIds[nextIndex];
                console.log("Scanning to row:", nextIndex, "ID:", nextId);
                if (nextId) {
                    apiRef.current.setRowSelectionModel([nextId]);
                    console.log("Set selection model to:", [nextId]);
                    const row = apiRef.current.getRow(nextId);
                    if (row && window.pywebview?.api) {
                        console.log("QSY to:", row.frequency, row.mode);

                        // Update qsyButtonId so FreqButton changes color
                        const actId = [row.activator, row.frequency, row.mode].join("|");
                        const buttonId = actId + '==scan';
                        setLastQsyBtnId(buttonId);

                        // Update contextData.spotId to trigger HandleSpotRowClick
                        // This loads the park/activator info at the top of the screen
                        const newCtxData = { ...contextData };
                        newCtxData.spotId = nextId;
                        setData(newCtxData);

                        window.pywebview.api.qsy_to(row.frequency, row.mode);
                    }
                }

            }, waitTime);
        }

        return () => {
            clearInterval(scanInterval);
            clearInterval(pttInterval);
        };
    }, [isScanning, scanIndex, waitTime, apiRef, contextData, setData, setLastQsyBtnId]);

    const handleScanClick = () => {
        console.log("handleScanClick - Current isScanning:", isScanning);
        if (isScanning) {
            console.log("Stopping scan");
            setIsScanning(false);
        } else {
            console.log("Starting scan");
            // Start scanning
            const currentIds = gridFilteredSortedRowIdsSelector(apiRef);
            if (currentIds.length > 1) {
                // Start from currently selected if any, else 0
                const selected = apiRef.current.getSelectedRows();
                let startIndex = 0;
                if (selected.size > 0) {
                    const id = selected.keys().next().value;
                    const idx = currentIds.indexOf(id);
                    if (idx !== -1) startIndex = idx;
                }

                setScanIndex(startIndex);
                setIsScanning(true);
                console.log("Scan started, isScanning set to true");
            }
        }
    };

    const disabled = filteredIds.length <= 1;

    // 1. Define the keyframes animation
    const spin = keyframes`
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
    }
    `;

    const SpinningIcon = styled(LoopIcon)({
        animation: `${spin} 2s linear infinite reverse`,
    });

    return (
        <Button
            variant="contained"
            size='small'
            color={isScanning ? "secondary" : "primary"}
            onClick={handleScanClick}
            disabled={disabled}
            startIcon={isScanning ? <SpinningIcon /> : <PlayCircleOutlineIcon />}
        >
            {isScanning ? "Stop" : "Scan"}
        </Button>
    );
}
