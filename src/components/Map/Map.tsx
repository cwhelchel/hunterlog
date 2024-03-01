import React from "react";
import Leaflet from "./Leaflet";

export default function LeafMap() {
    // this is now just the initial lat long
    const [lat, setLat] = React.useState(0.0);
    const [lon, setLon] = React.useState(0.0);

    return (
        <Leaflet latitude={lat} longitude={lon} />
    )
}
