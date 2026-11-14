import './Footer.scss'

import * as React from 'react'
import Link from '@mui/material/Link';
import { Alert, Box, Button, Divider, LinearProgress, Stack, Typography } from '@mui/material';
import { checkApiResponse2 } from '../Utilities/util';
import { useMessageQueue } from '../MessageContext';
import HlModal2 from '../Common/HlModal';

export default function Footer() {
    const [version, setVersion] = React.useState('');
    const [dbVersion, setDbVersion] = React.useState('');
    const [isWorking, setIsWorking] = React.useState(false);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [migrateDir, setMigrateDir] = React.useState('');
    const { addMessage } = useMessageQueue();

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null)
            initVersion();
        else
            window.addEventListener('pywebviewready', initVersion);

        function initVersion() {
            if (window.pywebview) {
                window.pywebview.api.get_version_num()
                    .then((x: string) => {
                        console.log(x);
                        const verInfo = JSON.parse(x);
                        setVersion(verInfo.app_ver);
                        setDbVersion(verInfo.db_ver);
                    });
            }
        }
    }, []);

    function handleOnClick() {
        if (window.pywebview) {
            setIsWorking(true);

            const x = window.pywebview.api.export_qsos();

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

            const x = window.pywebview.api.export_park_data();
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

            const x = window.pywebview.api.import_park_data();
            x.then((r: string) => {
                const x = checkApiResponse2(r, addMessage);
                setIsWorking(false);
                if (!x.success) {
                    console.log("import park data failed");
                }
            });
        }
    }

    function handleMigration() {
        if (window.pywebview) {
            setIsWorking(true);

            const oldExe = migrateDir;

            const x = window.pywebview.api.imports.migrate_to_new_hunterlog(oldExe);
            x.then((r: string) => {
                const x = checkApiResponse2(r, addMessage);
                setIsWorking(false);
                if (!x.success) {
                    console.log("migration failed! see logs");
                }
            });
        }
    }


    function handleBrowseClick() {
        if (window.pywebview) {

            const x = window.pywebview.api.imports.migrate_select_path();
            x.then((r: string) => {
                const resp = checkApiResponse2(r, addMessage);
                if (!resp.success) {
                    console.log("false returned from migrate_select_path");
                }
                if (resp.success) {
                    console.log('got path', resp.path);
                    setMigrateDir(resp.path);
                }
            });
        }
    }




    return (
        <div className="footer">
            <div className='left'>
                <span id="versionNum">{version} - db: {dbVersion}</span>
                <Link href="#" onClick={() => { handleOnClick() }} ml={1} mr={1}>
                    Export Logged QSOs
                </Link>
                <Link href="#" onClick={() => { handleExportParkData() }} ml={1} mr={1}>
                    Export Park Info
                </Link>
                <Link href="#" onClick={() => { handleImportParkData() }} ml={1} mr={1}>
                    Import Park Info
                </Link>
                <Link href="#" onClick={() => { setModalOpen(true) }} ml={1} mr={1}>
                    Migrate
                </Link>
                {isWorking && (
                    <Box sx={{ width: '50vw' }}>
                        <LinearProgress />
                    </Box>
                )}
            </div>
            <span id="attributionText">Icons from <a href="https://icons8.com" target='_blank' rel='noreferrer'>icons8.com</a></span>
            <HlModal2
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title='Migrate to new Install location'
                id='migration'
                contentStyle={{ width: 600 }}>

                <Typography variant="caption" gutterBottom>
                    This will copy your old configuration database and adif log files
                    to the new USER directory location on your system. <br/>
                    To facilitate the use of install systems, Hunterlog will no 
                    longer load files from the place the executable is stored. 
                    It will use new platform dependant user directories.
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
                                <br/><code>~/.local/share/hunterlog/</code> on Linux.
                                <br/><code>%LOCALAPPDATA%/hunterlog/</code> on Windows.
                            </Typography>
                        </li>
                    </ol>

                    <Alert severity="warning">
                        You must restart hunterlog immediately after.
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
                    <Button fullWidth variant='contained' onClick={() => setModalOpen(false)}>Close</Button>
                </Stack>
            </HlModal2>
        </div >


    )
}