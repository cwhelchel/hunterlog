import './Footer.scss'

import * as React from 'react'
import Link from '@mui/material/Link';
import { Box, LinearProgress } from '@mui/material';
import { checkApiResponse } from '../../util';
import { useAppContext } from '../AppContext';

export default function Footer() {
    const [version, setVersion] = React.useState('');
    const [dbVersion, setDbVersion] = React.useState('');
    const [isWorking, setIsWorking] = React.useState(false);
    const { contextData, setData } = useAppContext();

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

            let x = window.pywebview.api.export_qsos();

            x.then((r: string) => {
                let x = checkApiResponse(r, contextData, setData);
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

            let x = window.pywebview.api.export_park_data();
            x.then((r: string) => {
                let x = checkApiResponse(r, contextData, setData);
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

            let x = window.pywebview.api.import_park_data();
            x.then((r: string) => {
                let x = checkApiResponse(r, contextData, setData);
                setIsWorking(false);
                if (!x.success) {
                    console.log("import park data failed");
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
                {isWorking && (
                    <Box sx={{ width: '50vw'}}>
                        <LinearProgress />
                    </Box>
                )}
            </div>
            <span id="attributionText">Icons from <a href="https://icons8.com" target='_blank'>icons8.com</a></span>
        </div>
    )
}