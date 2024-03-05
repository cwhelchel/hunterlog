import Link from '@mui/material/Link';
import * as React from 'react'


export default function Ticker() {
    const [version, setVersion] = React.useState('');
    const [dbVersion, setDbVersion] = React.useState('');

    React.useEffect(() => {
        window.addEventListener('pywebviewready', function () {
            if (window.pywebview) {
                window.pywebview.api.get_version_num()
                    .then((x: string) => {
                        console.log(x);
                        const verInfo = JSON.parse(x);
                        setVersion(verInfo.app_ver);
                        setDbVersion(verInfo.db_ver);
                    });
            }
        })
    }, []);

    function handleOnClick() {
        if (window.pywebview) {
            window.pywebview.api.export_qsos();
        }
    }

    function handleLoadLocData() {
        if (window.pywebview) {
            window.pywebview.api.load_location_data()
        }
    }


    return (
        <div className="footer">
            <span id="versionNum">{version} - db: {dbVersion}</span>
            <Link href="#" onClick={() => {handleOnClick()}}  ml={1}>
                Export Logged QSOs
            </Link>
            <Link href="#" onClick={() => {handleLoadLocData()}}  ml={1}>
                Load Location Data
            </Link>
        </div>
    )
}