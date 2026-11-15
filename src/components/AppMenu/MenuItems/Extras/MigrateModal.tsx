import { Alert, Button, Divider, Stack, Typography } from "@mui/material";
import HlModal2 from "../../../Common/HlModal";
import React from "react";
import { checkApiResponse2 } from "../../../Utilities/util";
import { useMessageQueue } from "../../../MessageContext";

export interface MigrateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MigrateModal({ isOpen, onClose }: MigrateModalProps) {
    const [migrateDir, setMigrateDir] = React.useState('');

    const { addMessage } = useMessageQueue();

    function handleBrowseClick() {
        if (window.pywebview) {
            const x = window.pywebview.api.extras.open_folder_select_dialog();
            x.then((r: string) => {
                const resp = checkApiResponse2(r, addMessage);
                if (!resp.success) {
                    console.log("false returned from open_folder_select_dialog");
                }
                if (resp.success) {
                    console.log('got path', resp.path);
                    setMigrateDir(resp.path);
                }
            });
        }
    }

    function handleMigration() {
        if (window.pywebview) {
            const oldExe = migrateDir;
            const x = window.pywebview.api.extras.migrate_to_new_hunterlog(oldExe);
            x.then((r: string) => {
                const x = checkApiResponse2(r, addMessage);
                if (!x.success) {
                    console.log("migration failed! see logs");
                }
            });
        }
    }

    return (
        <HlModal2
            isOpen={isOpen}
            onClose={onClose}
            title='Migrate to new Install location'
            id='migration'
            contentStyle={{ width: 700 }}>

            <Typography variant="body1" gutterBottom>
                This will copy Hunterlog files from an older, manually installed directory
                into the new Hunterlog user data directory on your system.
            </Typography>
            <Typography variant="caption">
                Hunterlog will no longer load files from the place the executable is stored.
                It will use new platform dependant user data directories.
            </Typography>
            <Divider />
            <div>
                <ol>
                    <li>
                        <Typography variant="body1" gutterBottom marginTop={"10px"}>
                            Find the location of your old Hunterlog executable.
                        </Typography>
                        <Typography variant="body2" gutterBottom marginTop={"10px"}>
                            Where you extracted the old zip files and put Hunterlog.
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body1" gutterBottom marginTop={"10px"}>
                            Click browse button below.
                        </Typography>
                        <Typography variant="body2" gutterBottom marginTop={"10px"}>
                            Select the folder you found in step 1.
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body1" gutterBottom marginTop={"10px"}>
                            Click Migrate below
                        </Typography>
                        <Typography variant="body2" gutterBottom marginTop={"10px"}>
                            This will copy old files to the new USER directory location
                            on your system. This location is platform (OS) dependant.
                            <br /><span style={{marginLeft:'10px'}}>Linux: <code>~/.local/share/hunterlog/</code></span>
                            <br /><span style={{marginLeft:'10px'}}>Windows: <code>%LOCALAPPDATA%/hunterlog/</code></span>
                        </Typography>
                    </li>
                </ol>

                <Alert severity="warning">
                   Hunterlog will restart after the files are migrated.
                </Alert>
            </div>

            <Button variant='outlined' onClick={handleBrowseClick}>Browse</Button>

            {migrateDir !== '' && (
                <Typography textAlign={'center'} color={'primary'} variant="body2" gutterBottom>
                    {migrateDir}
                </Typography>
            )}

            <Stack direction={'row'} spacing={1} sx={{ 'align-items': 'stretch', 'justify-content': 'space-evenly' }} useFlexGap>
                <Button fullWidth variant='contained' onClick={handleMigration}>Migrate</Button>
                <Button fullWidth variant='contained' onClick={onClose}>Close</Button>
            </Stack>
        </HlModal2>
    );
}