import React from "react";
import { useAppContext } from "../AppContext";
import Leaflet from "./Leaflet";
import { ParkInfo } from "../../@types/PotaTypes";


export default function LeafMap() {
    // this is now just the initial lat long
    const [lat, setLat] = React.useState(0.0);
    const [lon, setLon] = React.useState(0.0);

    return (
        <Leaflet latitude={lat} longitude={lon} />
    )
}
