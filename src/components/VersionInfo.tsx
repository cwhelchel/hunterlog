import * as React from 'react'


export default function Ticker() {
    const [version, setVersion] = React.useState('');

    React.useEffect(() => {
        window.addEventListener('pywebviewready', function () {
            if (window.pywebview) {
                window.pywebview.api.get_version_num()
                    .then((x: string) => {
                        setVersion(x);
                    });
            }
        })
    }, []);

    return (
        <div className="footer">
            <span id="versionNum">{version}</span>
        </div>
    )
}