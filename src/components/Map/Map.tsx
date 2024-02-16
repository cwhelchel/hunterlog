import React from "react";
import { useAppContext } from "../AppContext";
import Leaflet from "./Leaflet";


// Takes park id and returns the lat long for the parks marker
// moderate checking on the park name
// async function getParkLocation(park) {
//     const re = /K-[0-9]*/;
//     park = park.toUpperCase();
//     let b = re.test(park);

//     if (b == false) return;

//     let url = "https://api.pota.app/park/" + park;

//     const parkData = await $.ajax({ url: url });

//     return { 'lat': parkData.latitude, 'lon': parkData.longitude };
// }

interface ParkInfo {
    parkId: number
    reference: string
    name: string
    latitude: number
    longitude: number
    grid4: string
    grid6: string
    parktypeId: number
    active: number,
    parkComments: string
    accessibility: null
    sensitivity: null
    accessMethods: string
    activationMethods: string
    agencies: null
    agencyURLs: null
    parkURLs: null
    website: string
    createdByAdmin: string
    parktypeDesc: string
    locationDesc: string
    locationName: string
    entityId: number
    entityName: string
    referencePrefix: string
    entityDeleted: number
    firstActivator: string
    firstActivationDate: string
}

interface ParkPoint {
    lat: number
    lon: number
}

function getParkInfo(park: string): Promise<ParkInfo> {

    let url = "https://api.pota.app/park/" + park;

    return fetch(url)

        .then(res => res.json()) // the JSON body is taken from the response
        .then(res => {
            // The response has an `any` type, so we need to cast
            // it to the `User` type, and return it from the promise
            return res as ParkInfo;
        })
}


export default function LeafMap() {
    const { contextData, setData } = useAppContext();
    const [lat, setLat] = React.useState(0.0);
    const [lon, setLon] = React.useState(0.0);

    function updateMap() {
        console.log(contextData.qso?.sig_info);
        const park = contextData.qso?.sig_info;
        if (park) {
            const info = getParkInfo(park)
                .then(x => {
                    setLat(x.latitude);
                    setLon(x.longitude);
                });
        }
    }

    // when the app context changes (ie a user clicks on a different spot)
    // we need to update our TextFields
    React.useEffect(() => {
        updateMap();
    }, [contextData.qso]);

    return (
        <Leaflet />
    )
}
