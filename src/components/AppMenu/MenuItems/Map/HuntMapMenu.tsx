import * as React from 'react';
import { Button, Checkbox, CircularProgress, FormControlLabel, Stack, Typography } from '@mui/material';
import { useAppContext } from '../../../AppContext';
import { FeatureGroup, MapContainer, Marker, TileLayer } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { checkApiResponse } from '../../../Utilities/util';
import { Qso } from '../../../../@types/QsoTypes';
import * as L from 'leaflet';
import 'leaflet.geodesic'; // Import the plugin
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import waterMarkControl from './HlMapWaterMark';
import HlModal2 from '../../../Common/HlModal';

const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

interface QsoMarker {
    callsign: string;
    position: number[];
}

const options = {
    weight: 2,
    opacity: 0.90,
    color: 'blue',
    steps: 8,
    wrap: false,
    smoothFactor: 2
};

// bound from this project https://github.com/pointhi/leaflet-color-markers
const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function HuntMapMenu() {
    const { contextData, setData } = useAppContext();
    const [open, setOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [homePosition, setHomePosition] = React.useState<LatLngExpression>([0.0, 0.0]);
    const [markers, setMarkers] = React.useState<QsoMarker[]>([]);
    const mapRef = React.useRef(null);
    const featureGroupRef = React.useRef(null);
    const [showCalls, setShowCalls] = React.useState(false);
    const savedCallback = React.useRef(showQsosOnMap);
    const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(dayjs());
    const [watermarkAdded, setWaterMarkAdded] = React.useState(false);

    const handleOpen = () => {
        getHomePosition();
        getQsoMarkers();
        setOpen(true);
    }
    const handleClose = () => {
        setMarkers([]);
        clearMarkerLayer();
        setOpen(false);
        setWaterMarkAdded(false);
        setIsLoading(true);
    }

    React.useEffect(() => {
        savedCallback.current = showQsosOnMap
    }, [showQsosOnMap, homePosition, markers, selectedDate]);

    React.useEffect(() => {
        setMarkers([]);
        clearMarkerLayer();
        getQsoMarkers();
    }, [selectedDate]);

    // this is the only way to get shit drawn of this fuck ass map
    React.useEffect(() => {
        console.log('effected markers', markers, featureGroupRef.current, mapRef.current);
        renderMapStuff();
    }, [showCalls]);

    React.useEffect(() => {
        // This code runs only once after the initial render
        let timerId: number = -1;
        if (open) {
            timerId = setTimeout(() => {
                console.log('This message appears after a 2-second delay on first render!');
                savedCallback.current();
            }, 3000);
        }

        // Cleanup function to clear the timer if the component unmounts
        return () => {
            if (timerId > 0)
                clearTimeout(timerId);
        };
    }, [open]);

    function getHomePosition() {
        // get home QTH as LL
        const x = window.pywebview.api.get_user_config_val('my_grid6');
        x.then(async (r: string) => {
            const x = checkApiResponse(r, contextData, setData);
            if (x.success) {
                const home_grid = x.val;
                // console.log('home grid', home_grid);
                const grid = await window.pywebview.api.grid_to_ll(home_grid);
                const gridObj = checkApiResponse(grid, contextData, setData);
                // console.log('grid', gridObj, gridObj['latitude'], gridObj['longitude']);
                const lat = parseFloat(gridObj['latitude']);
                let lon = parseFloat(gridObj['longitude']);

                // all our Lon need to in range [0..360] and not [-180..180]
                // b/c the map is continual, this keeps markers in expected 
                // places when crossing the antimeridian 
                lon = L.Util.wrapNum(lon, [0, 360], true);

                console.log('home ll', lat, lon);
                setHomePosition([lat, lon]);
            }
        });
    }

    async function getQsoMarkers() {
        const newMarkers = [...markers];
        newMarkers.length = 0;

        if (window.pywebview === undefined || window.pywebview.api === undefined)
            return;

        // toISOString converts it to UTC. api must convert back to local
        const d = selectedDate?.toISOString();
        // console.log('date to look for', d);

        const q = await window.pywebview.api.get_daily_qsos(d);

        const x = checkApiResponse(q, contextData, setData);
        if (x.success) {
            //console.log('qsos', x.qsos);
            const t = JSON.parse(x.qsos) as Qso[];
            t.forEach(async (qso) => {
                const call = qso.call;
                const grid = qso.gridsquare;
                const res = await window.pywebview.api.grid_to_ll(grid);
                const gridObj = checkApiResponse(res, contextData, setData);
                const lat = parseFloat(gridObj['latitude']);
                let lon = parseFloat(gridObj['longitude']);
                //console.log('marker', call, lat, lon);

                lon = L.Util.wrapNum(lon, [0, 360], true);

                newMarkers.push({ callsign: call, position: [lat, lon] });
            });

        }
        //console.log('newMarkers', newMarkers);
        setMarkers(newMarkers);
    }

    function renderMapStuff(): void {
        clearMarkerLayer();

        if (mapRef.current && !watermarkAdded) {
            waterMarkControl().addTo(mapRef.current);
            setWaterMarkAdded(true);
        }

        markers.forEach(m => {
            const ll = L.latLng(m.position[0], m.position[1]);
            let dx = ll;
            L.marker(dx)
                .addTo(featureGroupRef.current!)
                .bindTooltip(m.callsign, { permanent: showCalls });

            // render a copy of the marker for the infinite scrolling map
            // getting points rendered correctly for a US based qso hunt map

            dx = L.latLng([ll.lat, ll.lng + 360]);
            L.marker(dx)
                .addTo(featureGroupRef.current!)
                .bindTooltip(m.callsign, { permanent: showCalls });

            dx = L.latLng([ll.lat, ll.lng - 360]);
            L.marker(dx)
                .addTo(featureGroupRef.current!)
                .bindTooltip(m.callsign, { permanent: showCalls });

            // last update of dx var is to render line. 
            new L.Geodesic([homePosition, dx], options)
                .addTo(featureGroupRef.current!);
        });
    }

    function clearMarkerLayer() {
        if (featureGroupRef.current) {
            (featureGroupRef.current as L.FeatureGroup).clearLayers();
        }
    }

    function showQsosOnMap(): void {
        setIsLoading(false);
        // console.log('showQsosOnMap', mapRef.current);
        (mapRef.current! as L.Map).setView(homePosition, 4);
        renderMapStuff();
    }

    return (
        <>
            <Button onClick={handleOpen} style={{
                color: "#bdbdbd",
                marginRight: '15px'
            }}>
                Map
            </Button>
            <HlModal2
                aria-labelledby="unstyled-modal-title"
                aria-describedby="unstyled-modal-description"
                isOpen={open}
                onClose={handleClose}
                title='Daily Hunt Map'
                id='huntmap'
                contentStyle={{ width: '1050px' }}
            >
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <div style={{ margin: '2px', width: '100%', fontSize: '0.9rem' }}>
                        This map shows hunts for a given day. These QSOs shown are logged during your local day, not UTC day.
                        <br />
                        After changing the date, click <code>Show QSOs</code> button.
                    </div>
                </div>

                {isLoading ? (
                    <Stack direction={'row'} gap={5} justifyContent={'center'} alignItems={'center'}>
                        <CircularProgress />
                        <Typography color={'darkgreen'}>Loading...</Typography>
                    </Stack>
                ) : (
                    <Stack marginY={'5px'} direction={'row'} gap={3} justifyContent={'center'} alignItems={'center'}>
                        <DatePicker
                            label="Select Date"
                            value={selectedDate}
                            onChange={(newValue) => { console.log('setting date', newValue); setSelectedDate(newValue); }} />
                        <Button variant='contained' onClick={() => showQsosOnMap()} >Show QSOs</Button>
                        <FormControlLabel
                            label="Show Calls"
                            control={<Checkbox checked={showCalls} onChange={(e) => setShowCalls(e.target.checked)} />}
                        />
                    </Stack>
                )}

                {/* Make sure you set the height and width of the map container otherwise the map won't show */}
                <MapContainer
                    center={homePosition}
                    zoom={4}
                    ref={mapRef}
                    style={{ width: "1000px", height: "750px" }}>
                    <TileLayer
                        attribution={attribution}
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {open && (
                        <>
                            <Marker icon={greenIcon} position={homePosition} />
                        </>
                    )}
                    <FeatureGroup ref={featureGroupRef}>
                    </FeatureGroup>
                </MapContainer>
            </HlModal2>
        </>
    );
}
