import * as React from 'react';
import { Box, Button, CircularProgress, FormControlLabel, Switch } from '@mui/material';
import { SpotComments } from '../../@types/SpotComments';

import './SpotComments.scss'
import HlModal2 from '../Common/HlModal';

interface ISpotCommentsProps {
    spotId: number,
    spotter: string,
    comments: string,
};

export default function SpotCommentsButton(props: ISpotCommentsProps) {
    const [open, setOpen] = React.useState(false);
    const [spinnerOpen, setSpinnerOpen] = React.useState(false);
    const [isRbnFiltered, setIsRbnFiltered] = React.useState<undefined | boolean>(undefined);
    const [comments, setComments] = React.useState<null | SpotComments[]>(null);
    // tempComments holds all comments to swap b/w filtered and unfiltered
    const [tempComments, setTempComments] = React.useState<null | SpotComments[]>(null);

    const cellVal = `${props.spotter}: ${props.comments}`;

    async function getSpotComments(spotId: number, filterRbnOut: boolean) {
        const id = spotId;
        setSpinnerOpen(true);

        // do these calls synchronously so they can be filtered when
        // first shown.
        await window.pywebview.api.insert_spot_comments(id);

        const x = await window.pywebview.api.get_spot_comments(id);
        const t = JSON.parse(x) as SpotComments[];
        if (filterRbnOut) {
            setTempComments(t);
            // console.log(t);
            const filtered = t?.filter(c => {
                const source = c.source;
                return !source.includes('RBN');
            });
            // console.log('filtered', filtered);

            setComments(filtered ?? []);
        } else {
            setComments(t);
            setTempComments(t);
        }
        setSpinnerOpen(false);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function onClick(e: React.MouseEvent<HTMLElement>) {
        setOpen(true);
    };

    function handleClickAway() {
        setOpen(false);
    }

    function handleChange(event: React.ChangeEvent<HTMLInputElement>, checked: boolean): void {
        setIsRbnFiltered(checked);
        window.localStorage.setItem("HIDE_RBN_CMTS", checked ? '1' : '0');
    }

    function filterRbn() {
        const saved = comments;
        const newComments = comments?.filter(c => {
            const source = c.source;
            return !source.includes('RBN');
        });

        setComments(newComments ?? []);
        setTempComments(saved);
    };

    React.useEffect(() => {
        if (isRbnFiltered)
            filterRbn();
        else {
            setComments(tempComments);
        }
    }, [isRbnFiltered]);

    React.useEffect(() => {
        const hideRbn = window.localStorage.getItem("HIDE_RBN_CMTS") || '0';
        // console.log('hideRbn', hideRbn);
        const isHidden = parseInt(hideRbn) != 0;
        // console.log('isHidden', isHidden);


        if (open) {
            getSpotComments(props.spotId, isHidden);
            setIsRbnFiltered(isHidden);
        }
    }, [open]);

    return (
        <div>
            <Button variant='text' onClick={onClick}>
                {cellVal}
            </Button>

            <HlModal2
                isOpen={open}
                onClose={handleClickAway}
                id='spotcomments'
                title=''
                contentStyle={{ maxHeight: 800, width: '25%', overflowY: 'scroll', padding: '12px' }}
            >
                {isRbnFiltered !== undefined && (
                    <FormControlLabel control={<Switch onChange={handleChange} checked={isRbnFiltered} />} label="Hide RBN" />
                )}
                <>
                    {spinnerOpen && (
                        <Box
                            display='flex'
                            width='100%'
                            height='100%'
                            alignItems='center'
                            justifyContent='center'
                            sx={{ color: '#fff', zIndex: 1500 }}
                        >
                            <CircularProgress color="inherit" />
                        </Box>
                    )}
                </>

                {comments?.map(c => {
                    return (<>
                        <div className={getClassName(c)}>
                            <div className="spotCmtTitle">
                                {c.spotter}
                            </div>
                            <div className="spotCmtInfo">
                                {c.mode} ({c.frequency}) at {c.spotTime} via {c.source}
                            </div>
                            <div className="spotCmtText">{c.comments}</div>
                            <hr role='separator' className='spotSep' />
                        </div>
                    </>)
                })
                }
            </HlModal2>
        </div >
    );

    function getClassName(cmt: SpotComments): string {
        if (cmt.source === 'RBN')
            return 'spotCmtItemRbn';

        if (cmt.spotter == cmt.activator || cmt.activator.includes(cmt.spotter))
            return "spotCmtItemAct";

        if (cmt.source === 'hunterlog')
            return 'spotCmtItemHl';

        return 'spotCmtItem';
    }
}
