import './Footer.scss'

import * as React from 'react'

export default function Footer() {
    const [version, setVersion] = React.useState('');
    const [dbVersion, setDbVersion] = React.useState('');

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

    return (
        <div className="footer">
            <div className='left'>
                <span id="versionNum">{version} - db: {dbVersion}</span>
            </div>
            <span id="attributionText">Icons from <a href="https://icons8.com" target='_blank' rel='noreferrer'>icons8.com</a></span>
        </div >
    )
}