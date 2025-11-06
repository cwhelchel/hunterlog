import * as React from 'react';
import { useAppContext } from '../AppContext';
import { ActivatorData } from '../../@types/ActivatorTypes';
import { SpotRow } from '../../@types/Spots';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LanguageIcon from '@mui/icons-material/Language';
import { Tooltip } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';

import './ActivatorInfo.scss'
import { checkApiResponse } from '../../tsx/util';

interface IActivatorInfoProps {
}

const defaultActData: ActivatorData = {
    activator_id: 0,
    callsign: "",
    name: "",
    qth: "",
    gravatar: "",
    activator: { activations: 0, parks: 0, qsos: 0 },
    attempts: { activations: 0, parks: 0, qsos: 0 },
    hunter: { parks: 0, qsos: 0 },
    endorsements: 0,
    awards: 0,
    updated: '1970-01-01T00:00:00'
}

const getUserAvatarURL = (md5: string) => {
    if (!md5) return '';

    return `https://gravatar.com/avatar/${md5}?d=identicon`;
};

export const ActivatorInfo = (props: IActivatorInfoProps) => {
    const { contextData, setData } = useAppContext();
    const [activator, setActivator] = React.useState<ActivatorData>(defaultActData);
    const [huntCount, setHuntCount] = React.useState(0);
    const [actComments, setActComments] = React.useState(['']);
    const [cwSpeed, setCwSpeed] = React.useState(-1);

    React.useEffect(() => {
        if (window.pywebview === undefined) {
            return;
        }

        if (contextData.qso == null) {
            setActivator(defaultActData);
            return;
        }

        let pSpot = window.pywebview.api.get_spot(contextData?.spotId);

        pSpot.then((r: string) => {
            let spot = JSON.parse(r) as SpotRow;
            if (spot) {
                // pipe delimited
                let comments = spot.act_cmts.split('|')
                setActComments(comments);
                setCwSpeed(spot.cw_wpm);
            }
        });

        const actCall = contextData?.qso?.call;

        if (actCall !== null && actCall !== '') {
            const q = window.pywebview.api.get_activator_stats(actCall);

            q.then((r: string) => {
                if (r === null) {
                    setActivator(defaultActData);
                    return;
                }

                let j = checkApiResponse(r, contextData, setData)
                if (j.success == false) {
                    setActivator(defaultActData);
                    return;
                }

                //console.log(`parsing activator data: ${r}`);
                var x = JSON.parse(r) as ActivatorData;
                //console.log(x);
                setActivator(x);
            });
        }

        let hunts = window.pywebview.api.get_activator_hunts(actCall);
        hunts.then((x: number) => {
            setHuntCount(x);
        });

    }, [contextData.qso]);


    function copyMarkDown(event: React.MouseEvent<SVGSVGElement>) {
        if (contextData.qso == null) {
            return;
        }
        let qso = contextData.qso;

        let text = `**${qso.call}** -- ${qso.mode} (_${qso.freq}_) @ park ${qso.sig_info}`;
        navigator.clipboard.writeText(text);
    }

    function copyText() {
        if (contextData.qso == null) {
            return;
        }
        let qso = contextData.qso;

        let text = `${qso.call} -- ${qso.mode} (${qso.freq}) @ park ${qso.sig_info}`;
        navigator.clipboard.writeText(text);
    }

    function openQrzLink() {
        if (contextData.qso == null) {
            return;
        }
        let qso = contextData.qso;

        let url = `http://www.qrz.com/db/${qso.call}`;
        window.open(url);
    }

    function openRbnLink() {
        if (contextData.qso == null) {
            return;
        }
        let qso = contextData.qso;

        let pskRptUrl = `https://pskreporter.info/pskmap.html?callsign=${qso.call}&mode=${qso.mode}`
        let url = `https://www.reversebeacon.net/main.php?spotted_call=${qso.call}&rows=30&timerange=900`;

        if (qso.mode.startsWith('FT')) {
            window.open(pskRptUrl);
        }
        else {
            window.open(url);
        }
    }

    function discordIcon() {
        return (
            <svg xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -5 32 32"
                height={16}
                width={16}
                onClick={copyMarkDown}>
                <path fill="currentColor" d="M 12.65625 4.90625 L 11.875 5 C 11.875 5 8.3696481 5.3828732 5.8125 7.4375 L 5.78125 7.4375 L 5.75 7.46875 C 5.1774699 7.997402 4.9258115 8.6459602 4.53125 9.59375 C 4.1366885 10.54154 3.715591 11.752904 3.34375 13.09375 C 2.600068 15.775442 2 19.027802 2 22 L 2 22.25 L 2.125 22.5 C 3.0505624 24.125542 4.6941059 25.161949 6.21875 25.875 C 7.7433941 26.588051 9.0579959 26.97057 9.96875 27 L 10.5625 27.03125 L 10.875 26.5 L 11.96875 24.5625 C 13.127347 24.822671 14.464603 25 16 25 C 17.535397 25 18.872626 24.822668 20.03125 24.5625 L 21.125 26.5 L 21.4375 27.03125 L 22.03125 27 C 22.942004 26.97057 24.256606 26.588051 25.78125 25.875 C 27.305894 25.161949 28.949438 24.125542 29.875 22.5 L 30 22.25 L 30 22 C 30 19.027802 29.399932 15.775442 28.65625 13.09375 C 28.284409 11.752904 27.863312 10.54154 27.46875 9.59375 C 27.074188 8.6459602 26.82253 7.997402 26.25 7.46875 L 26.21875 7.4375 L 26.1875 7.4375 C 23.630352 5.3828732 20.125 5 20.125 5 L 19.34375 4.90625 L 19.0625 5.625 C 19.0625 5.625 18.774449 6.3543498 18.59375 7.1875 C 17.461371 7.0362261 16.533867 7 16 7 C 15.466133 7 14.538629 7.0362261 13.40625 7.1875 C 13.225551 6.3543498 12.9375 5.625 12.9375 5.625 L 12.65625 4.90625 z M 11.28125 7.1875 C 11.325016 7.3291146 11.368882 7.4483477 11.40625 7.5625 C 10.113115 7.8816609 8.7337425 8.3716234 7.46875 9.15625 L 8.53125 10.84375 C 11.125303 9.2347577 14.852326 9 16 9 C 17.147674 9 20.874697 9.2347577 23.46875 10.84375 L 24.53125 9.15625 C 23.266257 8.3716234 21.886885 7.8816609 20.59375 7.5625 C 20.631119 7.4483477 20.674984 7.3291146 20.71875 7.1875 C 21.650407 7.3747917 23.432834 7.8029395 24.90625 8.96875 C 24.89895 8.97302 25.282 9.5510677 25.625 10.375 C 25.977157 11.220929 26.365716 12.351971 26.71875 13.625 C 27.396257 16.068068 27.925038 19.037784 27.96875 21.65625 C 27.340295 22.618973 26.173793 23.484306 24.9375 24.0625 C 23.859964 24.566446 23.006955 24.75086 22.5 24.84375 L 22 24 C 22.296059 23.891494 22.589175 23.768223 22.84375 23.65625 C 24.381119 22.980051 25.21875 22.25 25.21875 22.25 L 23.90625 20.75 C 23.90625 20.75 23.342631 21.266949 22.03125 21.84375 C 20.719869 22.420551 18.71659 23 16 23 C 13.28341 23 11.280411 22.420573 9.96875 21.84375 C 8.6570887 21.266927 8.09375 20.75 8.09375 20.75 L 6.78125 22.25 C 6.78125 22.25 7.6186613 22.980073 9.15625 23.65625 C 9.4108611 23.768219 9.7039258 23.891495 10 24 L 9.5 24.84375 C 8.9930451 24.75086 8.1400359 24.566446 7.0625 24.0625 C 5.8262068 23.484306 4.6597053 22.618973 4.03125 21.65625 C 4.0749615 19.037784 4.6037429 16.068068 5.28125 13.625 C 5.634284 12.351971 6.0228428 11.220929 6.375 10.375 C 6.7180001 9.5510677 7.1010436 8.9730183 7.09375 8.96875 C 8.5671656 7.8029395 10.349593 7.3747917 11.28125 7.1875 z M 12.5 14 C 11.725493 14 11.042938 14.44275 10.625 15 C 10.207062 15.55725 10 16.24505 10 17 C 10 17.75495 10.207062 18.44275 10.625 19 C 11.042938 19.55725 11.725493 20 12.5 20 C 13.274507 20 13.957062 19.55725 14.375 19 C 14.792938 18.44275 15 17.75495 15 17 C 15 16.24505 14.792938 15.55725 14.375 15 C 13.957062 14.44275 13.274507 14 12.5 14 z M 19.5 14 C 18.725493 14 18.042938 14.44275 17.625 15 C 17.207062 15.55725 17 16.24505 17 17 C 17 17.75495 17.207062 18.44275 17.625 19 C 18.042938 19.55725 18.725493 20 19.5 20 C 20.274507 20 20.957062 19.55725 21.375 19 C 21.792938 18.44275 22 17.75495 22 17 C 22 16.24505 21.792938 15.55725 21.375 15 C 20.957062 14.44275 20.274507 14 19.5 14 z M 12.5 16 C 12.55392 16 12.625044 16.02089 12.75 16.1875 C 12.874956 16.354108 13 16.650381 13 17 C 13 17.349619 12.874956 17.645892 12.75 17.8125 C 12.625044 17.979108 12.55392 18 12.5 18 C 12.44608 18 12.374956 17.979108 12.25 17.8125 C 12.125044 17.645892 12 17.349619 12 17 C 12 16.650381 12.125044 16.354108 12.25 16.1875 C 12.374956 16.020892 12.44608 16 12.5 16 z M 19.5 16 C 19.55392 16 19.625044 16.02089 19.75 16.1875 C 19.874956 16.354108 20 16.650381 20 17 C 20 17.349619 19.874956 17.645892 19.75 17.8125 C 19.625044 17.979108 19.55392 18 19.5 18 C 19.44608 18 19.374956 17.979108 19.25 17.8125 C 19.125044 17.645892 19 17.349619 19 17 C 19 16.650381 19.125044 16.354108 19.25 16.1875 C 19.374956 16.020892 19.44608 16 19.5 16 z" overflow="visible" font-family="Sans">
                </path>
            </svg>
        );
    }

    return (
        <div className='activator-info'>
            {activator !== null && activator.activator_id !== 0 &&
                <>
                    <div className="activatorTitle">
                        <span>{activator?.callsign} - {activator?.name}</span>
                        <span style={{ marginLeft: '3px' }}>
                            <Tooltip title="Copy Spot as Markdown">
                                {discordIcon()}
                            </Tooltip>
                        </span>

                        <span style={{ marginLeft: '3px', height: '16px', width: '16px' }}
                            onClick={() => copyText()}>
                            <Tooltip title="Copy Spot as Text">
                                <ContentCopyIcon className="svg_icons" fontSize='small' />
                            </Tooltip>
                        </span>

                        <span style={{ marginLeft: '3px', height: '16px', width: '16px' }}
                            onClick={() => openQrzLink()}>
                            <Tooltip title="QRZ">
                                <LanguageIcon className="svg_icons" fontSize='small' />
                            </Tooltip>
                        </span>

                        {contextData.qso?.mode == 'CW' && (
                            <span style={{ marginLeft: '3px', height: '16px', width: '16px' }}
                                onClick={() => openRbnLink()}>
                                <Tooltip title="RBN">
                                    <TimelineIcon className="svg_icons" fontSize='small' />
                                </Tooltip>
                            </span>
                        )}

                        {contextData.qso?.mode?.startsWith('FT') && (
                            <span style={{ marginLeft: '3px', height: '16px', width: '16px' }}
                                onClick={() => openRbnLink()}>
                                <Tooltip title="PSK">
                                    <TimelineIcon className="svg_icons" fontSize='small' />
                                </Tooltip>
                            </span>
                        )}

                        {cwSpeed > 0 && (
                            <div className='activatorSpeed'>
                                CW: {cwSpeed} wpm
                            </div>
                        )}
                    </div>
                    <hr className='titleSeparator' role='separator' />
                    <div className='activatorData'>
                        <img src={getUserAvatarURL(activator?.gravatar)} style={{ float: "left", width: "80px", height: "80px" }} />

                        <div className='activatorBasics'>
                            <span>{activator?.qth}</span>
                            <br />
                            <span><em>{activator?.activator.activations} activations {activator?.activator.parks} parks {activator?.activator.qsos} qsos</em></span>
                            <br />
                            <span><em>Hunted {activator?.hunter.parks} parks {activator?.hunter.qsos} qsos</em></span>
                            <br />
                            <span><em>You have {huntCount} QSOs with {activator?.callsign}</em></span>
                            <br />
                        </div>
                        <div className='activatorCommentMetaData'>
                            <span className='activatorCmtsHdg'>Activator comments:</span>
                            <div className='activatorComments'>
                                {actComments.map((comment) => (
                                    <span>{comment}<br /></span>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            }
        </div>
    );
}


