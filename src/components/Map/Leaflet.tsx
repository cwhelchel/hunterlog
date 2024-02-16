import React from "react";
import { Map, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAppContext } from "../AppContext";
import { ParkInfo } from "../../@types/PotaTypes";

const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function getParkInfo(park: string): Promise<ParkInfo> {

    let url = "https://api.pota.app/park/" + park;
    console.log(url);

    return fetch(url)
        .then(res => res.json()) // the JSON body is taken from the response
        .then(res => {
            // The response has an `any` type, so we need to cast
            // it to the `User` type, and return it from the promise
            return res as ParkInfo;
        })
}


export default function Leaflet({ latitude, longitude }) {
    const mapRef = React.useRef(null);
    //const [mapRef, setMap] = React.useState<Map | null>(null);
    const { contextData, setData } = useAppContext();
    const [lat, setLat] = React.useState(latitude);
    const [lon, setLon] = React.useState(longitude);
    const [markerPosition, setMarkerPosition] = React.useState([0.0,0.0]);

    function handleOnSetView() {
        const { current = {} } = mapRef;
        //const { leafletElement: map } = current;
        console.log(`setting view ${lat} ${lon}`);

        if (mapRef && mapRef.current) {

            mapRef.current.setView([lat, lon], 5);
            setMarkerPosition([lat, lon]);
        }
    }

    React.useEffect(() => {
        updateMap();
    }, [contextData.qso]);

    React.useEffect(() => {
        handleOnSetView();
    }, [lat, lon]);

    return (
        // Make sure you set the height and width of the map container otherwise the map won't show
        <MapContainer center={[lat, lon]}
            zoom={5}
            ref={mapRef}
            style={{ height: "35vh", width: "100vw" }}>
            <TileLayer
                attribution={attribution}
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={markerPosition}>
                <Popup>
                    A pretty CSS3 popup. <br /> Easily customizable.
                </Popup>
            </Marker>
        </MapContainer>
    );

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
};
