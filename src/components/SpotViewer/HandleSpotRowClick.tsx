import * as React from 'react';
import { useEffect } from "react";
import { Park } from "../../@types/Parks";
import { Qso } from "../../@types/QsoTypes";
import { SpotComments } from "../../@types/SpotComments";
import { useAppContext } from "../AppContext";

/**
 * This is the handler code for selecting a spot. It's triggered by 
 * setting contextData.spotId to a valid spot row id. Normally this is by 
 * clicking on a row in the SpotViewer Data Grid.
 * 
 * It does enough processing to warrant being in it's own file apart from
 * SpotViewer.tsx. It mostly updates the various other components of HL by 
 * setting data in contextData (ex: reference, qso object) 
 */
export default function HandleSpotRowClick() {

    const { contextData, setData } = useAppContext();

    async function getOtherOps(spotId: number): Promise<string> {
        const r = await window.pywebview.api.get_spot_comments(spotId);

        let t = JSON.parse(r) as SpotComments[];
        let filtered = t.filter(function (el) {
            return el.comments.includes('{With:');
        });

        if (filtered.length > 0) {
            const str = filtered[0].comments;
            const re = new RegExp("{With:([^}]*)}");
            const m = str.match(re);

            if (m) {
                return m[1];
            }
        } else {
            return '';
        }

        return '';

    }

    function getQsoData(id: number) {
        // use the spot to generate qso data (unsaved)
        const q = window.pywebview.api.get_qso_from_spot(id);

        q.then((r: any) => {
            if (r['success'] == false)
                return;
            var x = JSON.parse(r) as Qso;
            //console.log("got qso:" + r);

            if (x.sig == 'POTA') {
                window.pywebview.api.get_park(x.sig_info)
                    .then((r: string) => {
                        let p = JSON.parse(r) as Park;
                        const newCtxData = { ...contextData };
                        newCtxData.spotId = id;
                        newCtxData.qso = x;
                        newCtxData.park = p;
                        newCtxData.summit = null;
                        getOtherOps(id).then((oo) => {
                            newCtxData.otherOperators = oo;
                            setData(newCtxData);
                        });
                    });
            } else if (x.sig == 'SOTA') {

                window.pywebview.api.get_summit(x.sig_info)
                    .then((r: string) => {
                        let summit = JSON.parse(r) as Park;
                        const newCtxData = { ...contextData };
                        newCtxData.spotId = id;
                        newCtxData.qso = x;
                        //newCtxData.summit = summit;
                        newCtxData.park = summit;
                        setData(newCtxData);
                    });

                // getSummitInfo(x.sig_info).then((summit: Summit) => {
                //     console.log("got summit: " + summit.summitCode);
                //     const newCtxData = { ...contextData };
                //     newCtxData.spotId = id;
                //     newCtxData.qso = x;
                //     newCtxData.summit = summit;
                //     newCtxData.park = null;
                //     setData(newCtxData);
                // });
            }

        });
    }

    function loadSpotData(spotId: number) {
        if (window.pywebview === undefined || window.pywebview === null)
            return;

        console.log('loadingSpotData ' + spotId);

        // load the spot's comments into the db
        let x = window.pywebview.api.insert_spot_comments(spotId);

        x.then(() => {
            // wait to get the rest of the data until after the spot comments 
            // are inserted
            getQsoData(spotId);
        });
    }

    useEffect(() => {
        loadSpotData(contextData.spotId);
    }, [contextData.spotId]);

    return (
        <>
        </>
    )
};