import React from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAppContext } from "../AppContext";
import { ParkInfo } from "../../@types/PotaTypes";
import { LatLngExpression } from "leaflet";
import { getParkInfo } from "../../pota";

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
            mapRef.current.setView([lat, lon], 5);
            setMarkerPosition([lat, lon]);
        }
    }

    React.useEffect(() => {
        // this will set the state's lat,lon and trigger next effect
        getParkLoc();
    }, [contextData.qso]);

    React.useEffect(() => {
        handleOnSetView();
    }, [lat, lon]);

    return (
        // Make sure you set the height and width of the map container otherwise the map won't show
        <MapContainer center={[lat, lon]}
            zoom={5}
            ref={mapRef}
            style={{ height: "300px", width: "300px" }}>
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

    function getParkLoc() {

        function getFromPotaApi(parkRef: string) {
            getParkInfo(parkRef)
                .then(x => {
                    setLat(x.latitude);
                    setLon(x.longitude);
                    window.pywebview.api.update_park(x);
                });
        }

        //console.log(contextData.qso?.sig_info);
        const park = contextData.qso?.sig_info;

        if (park) {
            let j = window.pywebview.api.get_park(park);
            j.then((parkJson: string) => {
                //console.log(parkJson);

                if (parkJson == null) {
                    // db does not have the goods. lets ask POTA.APP
                    getFromPotaApi(park);
                    return;
                }

                let p = JSON.parse(parkJson) as ParkInfo;
                if (p) {
                    // the park could have been added via stat parsing from
                    // hunter_parks.csv and have no lat lon
                    if (p.latitude == null || p.longitude == null) {
                        console.log(`invalid lat/lon for ${p}. pulling from POTA api`);
                        getFromPotaApi(park);
                    } else {
                        console.log(`park in db ${p}`);
                        setLat(p.latitude);
                        setLon(p.longitude);
                    }
                }
            });
        }
    }
};
