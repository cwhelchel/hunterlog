import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import './SpotViewer.scss'

// export default function SpotViewer() {
//   return (
//     <div className='spots-container'>
//       <div className='links'>
//         <a href='https://pywebview.flowrl.com/' target='_blank'>Documentation</a>
//       </div>
//     </div>
//   );
// };

// https://mui.com/material-ui/react-table/

function createData(
    name: string,
    calories: number,
    fat: number,
    carbs: number,
    protein: number,
) {
    return { name, calories, fat, carbs, protein };
}

// const rows = [
//     createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
//     createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
//     createData('Eclair', 262, 16.0, 24, 6.0),
//     createData('Cupcake', 305, 3.7, 67, 4.3),
//     createData('Gingerbread', 356, 16.0, 49, 3.9),
// ];

const rows =
    [
        {
            "spotId": 24575447,
            "activator": "KC4MIT",
            "frequency": "14244",
            "mode": "SSB",
            "reference": "K-0050",
            "parkName": null,
            "spotTime": "2024-02-12T19:10:03",
            "spotter": "KC4MIT",
            "comments": "QRT",
            "source": "Web",
            "invalid": null,
            "name": "Mammoth Cave National Park",
            "locationDesc": "US-KY",
            "grid4": "EM67",
            "grid6": "EM67we",
            "latitude": 37.1877,
            "longitude": -86.1012,
            "count": 52,
            "expire": 18
        }
    ]
export default function SpotViewer() {
    const [inqueries, setInqueries] = React.useState(rows)

    React.useEffect(() => {
        window.addEventListener('pywebviewready', function () {
            if (!window.pywebview.state) {
                window.pywebview.state = {}
            }
            // Expose setTicker in order to call it from Python
            const spots = window.pywebview.api.get_spots()
            spots.then((r) => {
                var x = JSON.parse(r);
                setInqueries(x);
            });
        })
    }, [])

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} size="small" aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell>Activator</TableCell>
                        <TableCell align="left">Time</TableCell>
                        <TableCell align="right">f</TableCell>
                        <TableCell align="right">mode</TableCell>
                        <TableCell align="right">ref</TableCell>
                        <TableCell align="right">name</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {inqueries.map(spot => (
                        <TableRow
                            key={spot.spotId}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell component="th" scope="row">
                                {spot.activator}
                            </TableCell>
                            <TableCell align="left">{spot.spotTime}</TableCell>
                            <TableCell align="right"><button>{spot.frequency}</button></TableCell>
                            <TableCell align="right">{spot.mode}</TableCell>
                            <TableCell align="right">{spot.reference}</TableCell>
                            <TableCell align="right">{spot.name}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
