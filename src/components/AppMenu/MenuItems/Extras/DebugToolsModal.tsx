import { Box, Button, Divider, LinearProgress, MenuItem, Select, Stack, Typography } from "@mui/material";
import HlModal2 from "../../../Common/HlModal";
import React from "react";
import { checkApiResponse2 } from "../../../Utilities/util";
import { useMessageQueue } from "../../../MessageContext";

export interface DebugToolsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DebugToolsModal({ isOpen, onClose }: DebugToolsModalProps) {
    const { addMessage } = useMessageQueue();
    const [isWorking, setIsWorking] = React.useState(false);

    function handleExportQsosClick() {
        if (window.pywebview) {
            setIsWorking(true);

            const x = window.pywebview.api.extras.export_qsos();

            x.then((r: string) => {
                const x = checkApiResponse2(r, addMessage);
                setIsWorking(false);
                if (!x.success) {
                    console.log("export qsos failed");
                }
            });
        }
    }

    function handleExportParkData() {
        if (window.pywebview) {
            setIsWorking(true);

            const x = window.pywebview.api.extras.export_park_data();
            x.then((r: string) => {
                const x = checkApiResponse2(r, addMessage);
                setIsWorking(false);
                if (!x.success) {
                    console.log("export park data failed");
                }
            });
        }
    }

    function handleImportParkData() {
        if (window.pywebview) {
            setIsWorking(true);

            const x = window.pywebview.api.extras.import_park_data();
            x.then((r: string) => {
                const x = checkApiResponse2(r, addMessage);
                setIsWorking(false);
                if (!x.success) {
                    console.log("import park data failed");
                }
            });
        }
    }

    return (
        <HlModal2
            isOpen={isOpen}
            onClose={onClose}
            title='Debug Tools and Helpers'
            id='debug-tools-modal'
            contentStyle={{ width: 800 }}>

            <Divider>Debug Log Level</Divider>
            <Typography variant="body2">
                Select this to reduce amount of text that gets logged to the index.log file.
                DEBUG has the most detailed info and is most useful for fixing issues but also
                takes up the most space. 
            </Typography>
            <Typography variant="caption">
                HL is configured to use no more than 10 MB for log files.
            </Typography>
            <Select
                value={0}
                label="Logger Type"
                onChange={(_e) => {
                }}>
                <MenuItem value={0}>DEBUG</MenuItem>
                <MenuItem value={1}>INFO</MenuItem>
                <MenuItem value={2}>WARNING</MenuItem>
                <MenuItem value={3}>ERROR</MenuItem>
            </Select>

            <Divider>Backup Park Info</Divider>
            <Typography variant="body2">
                Select to backup the parks table in the database. Hunterlog slowly
                builds up this table over time. It also contains the number of times
                the park/reference has been hunted.
            </Typography>
            <Stack direction={'row'} spacing={1}>
                <Button fullWidth variant='outlined' onClick={handleExportParkData}>Export</Button>
                <Button fullWidth variant='outlined' onClick={handleImportParkData}>Import</Button>
            </Stack>

            <Divider>Export QSOs to ADIF</Divider>
            <Typography variant="body2">
                Export the QSOs logged via Hunterlog into an adif file.
            </Typography>
            <Stack direction={'row'} spacing={1}>
                <Button fullWidth variant='outlined' onClick={handleExportQsosClick}>Export</Button>
            </Stack>

            {isWorking && ( 
                <Box sx={{ width: '50vw' }}>
                    <LinearProgress />
                </Box>
            )}

            <Stack direction={'row'} spacing={1} sx={{ 'align-items': 'stretch', 'justify-content': 'space-evenly' }} useFlexGap>
                <Button fullWidth variant='contained' onClick={onClose}>Close</Button>
            </Stack>
        </HlModal2>
    );
}