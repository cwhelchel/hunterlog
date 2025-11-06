import * as React from 'react';
import { useEffect, useState } from "react";
import { Park } from "../../@types/Parks";
import { Qso } from "../../@types/QsoTypes";
import { SpotComments } from "../../@types/SpotComments";
import { useAppContext } from "../AppContext";
import { checkApiResponse } from '../../tsx/util';
import { getMultiParkString, testForNfer } from '../../tsx/nferUtils';

interface MultiData {
    otherOps: string;
    otherParks: string;
}

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
    const [isWorking, setIsWorking] = useState(false);

    async function getOtherData(spotId: number): Promise<MultiData> {
        const r = await window.pywebview.api.get_spot_comments(spotId);

        const t = JSON.parse(r) as SpotComments[];

        const filtered = t.filter(function (el) {
            return el.comments.includes('{With:');
        });

        const nferComments = t.filter(function (el) {
            return testForNfer(el.comments);
        });

        // console.log(nferComments);

        function getMultiOps(ops: SpotComments[]): string {
            if (ops.length > 0) {
                const str = ops[0].comments;
                const re = new RegExp("{With:([^}]*)}");
                const m = str.match(re);

                if (m) {
                    return m[1];
                }
            }
            return '';
        }

        const result: MultiData = {
            otherOps: getMultiOps(filtered),
            otherParks: getMultiParkString(nferComments)
        };

        return result;
    }

    function getQsoData(id: number) {
        // use the spot to generate qso data (unsaved)
        const q = window.pywebview.api.get_qso_from_spot(id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        q.then((r: any) => {
            const result = checkApiResponse(r, contextData, setData);

            if (!result.success) {
                console.log("get_qso_from_spot failed: " + result.message);
                return;
            }

            const x = JSON.parse(result.qso) as Qso;

            window.pywebview.api.get_reference(x.sig, x.sig_info)
                .then((r: string) => {
                    const result = checkApiResponse(r, contextData, setData);
                    if (!result.success) {
                        console.log("get_qso_from_spot failed: " + result.message);
                        setIsWorking(false);
                        return;
                    }
                    const p = JSON.parse(result.park_data) as Park;
                    const newCtxData = { ...contextData };
                    newCtxData.qso = x;
                    newCtxData.park = p;
                    newCtxData.summit = null;
                    if (x.sig == 'POTA') {
                        getOtherData(id).then((oo) => {
                            newCtxData.otherOperators = oo.otherOps;
                            newCtxData.otherParks = oo.otherParks;
                            setData(newCtxData);
                        });
                    } else {
                        setData(newCtxData);
                    }

                    setIsWorking(false);
                });
        });
    }

    function loadSpotData(spotId: number) {
        if (window.pywebview === undefined || window.pywebview === null)
            return;

        //console.log('loadingSpotData ' + spotId);


        const newCtxData = { ...contextData };
        contextData.loadingQsoData = true;
        setData(newCtxData);

        // load the spot's comments into the db
        const x = window.pywebview.api.insert_spot_comments(spotId);

        //getQsoData(spotId);

        x.then(() => {
            // wait to get the rest of the data until after the spot comments 
            // are inserted
            getQsoData(spotId);
            const newCtxData = { ...contextData };
            contextData.loadingQsoData = false;
            setData(newCtxData);
        });
    }



    useEffect(() => {
        if (!isWorking) {
            setIsWorking(true);
            loadSpotData(contextData.spotId);
        } else {
            console.log('re-entry prevented on spot row click');
        }
        return () => {
            setIsWorking(false);
        }
    }, [contextData.spotId]);

    useEffect(() => {
        setIsWorking(false);
    }, []);

    return (
        <>
        </>
    )
};