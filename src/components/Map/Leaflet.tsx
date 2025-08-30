import React from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAppContext } from "../AppContext";
import { LatLngExpression } from "leaflet";

const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

interface ILeafletProps {
    latitude: number,
    longitude: number
}
export default function Leaflet(props: ILeafletProps) {
    const mapRef = React.useRef(null);
    const { contextData, setData } = useAppContext();
    const [lat, setLat] = React.useState(props.latitude);
    const [lon, setLon] = React.useState(props.longitude);
    const [markerPosition, setMarkerPosition] = React.useState<LatLngExpression>([0.0, 0.0]);

    function handleOnSetView() {
        if (mapRef && mapRef.current) {
            mapRef.current.setView([lat, lon], 4);
            setMarkerPosition([lat, lon]);
        }
    }

    React.useEffect(() => {
        // this will set the state's lat,lon and trigger next effect
        setLatLon();
    }, [contextData.park]);

    React.useEffect(() => {
        handleOnSetView();
    }, [lat, lon]);

    React.useEffect(() => {
        setLatLonFromSota();
    }, [contextData.summit]);

    return (
        // Make sure you set the height and width of the map container otherwise the map won't show
        <MapContainer center={[lat, lon]}
            zoom={4}
            ref={mapRef}
            style={{ height: "150px", width: "300px", float: "left" }}>
            <TileLayer
                attribution={attribution}
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={markerPosition}>
            </Marker>
        </MapContainer>
    );

    function setLatLon() {
        const park = contextData.park;
        console.log(`Leaflet: ${park?.name}`);
        if (park === undefined)
            return;

        if (park?.latitude == null || park?.longitude == null) {
            console.log(`Leaflet: invalid lat/lon for ${park}.`);
        } else {
            //console.log(`Leaflet: park in db ${park}`);
            setLat(park.latitude);
            setLon(park.longitude);
        }
    }

    function setLatLonFromSota() {
        const summit = contextData.summit;
        if (summit === undefined)
            return;

        console.log(`Leaflet: ${summit?.name}`);

        if (summit?.latitude == null || summit?.longitude == null) {
            console.log(`Leaflet: invalid lat/lon for ${summit}.`);
        } else {
            //console.log(`Leaflet: park in db ${park}`);
            setLat(summit.latitude);
            setLon(summit.longitude);
        }
    }
};
