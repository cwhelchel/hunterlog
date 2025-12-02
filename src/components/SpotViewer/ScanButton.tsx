import * as React from 'react';
import Button from '@mui/material/Button';
import { useGridApiContext, gridFilteredSortedRowIdsSelector, useGridSelector } from '@mui/x-data-grid';
import { useConfigContext } from '../Config/ConfigContextProvider';
import { checkApiResponse } from '../../util';
import { useAppContext } from '../AppContext';

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
        let interval: NodeJS.Timeout;

        if (isScanning) {
            interval = setInterval(async () => {
                // Check PTT
                if (window.pywebview?.api) {
                    try {
                        const pttResp = await window.pywebview.api.get_ptt();
                        const json = checkApiResponse(pttResp, contextData, setData);
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

                // Get next row
                const currentIds = gridFilteredSortedRowIdsSelector(apiRef);
                if (currentIds.length <= 1) {
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

        return () => clearInterval(interval);
    }, [isScanning, scanIndex, waitTime, apiRef, contextData, setData]);

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

                // Immediately tune to start? Or wait? User said "wait_time... go to next". 
                // But usually you want immediate feedback. 
                // Requirement 3a: "go to the next channel... park... after wait_time... go to next"
                // So it implies wait first? Or move then wait?
                // "when pushed... on a predetermined timeout... go to next"
                // This sounds like it waits first. 
                // But usually "Scan" starts immediately. 
                // Let's trigger the first move immediately for better UX, or at least tune to current.
                // If I set index to current, the interval will move to next after wait_time.
                // That seems correct based on "go to the next channel".

                // Also Requirement 5: "As Scan is going through the stations, it should highlight the selected station"
                // This is handled by setRowSelectionModel.
            }
        }
    };

    const disabled = filteredIds.length <= 1;

    return (
        <Button
            variant="contained"
            color={isScanning ? "secondary" : "primary"}
            onClick={handleScanClick}
            disabled={disabled}
        >
            {isScanning ? "Stop Scanning" : "Scan"}
        </Button>
    );
}
