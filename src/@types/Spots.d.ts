export interface SpotRow {
    spotId: number,
    activator: string,
    frequency: string,
    mode: string,
    reference: string,
    parkName: any,
    spotTime: string,
    spotter: string,
    comments: string,
    source: string,
    invalid: any,
    name: string,
    locationDesc: string,
    grid4: string,
    grid6: string,
    latitude: number
    longitude: number,
    count: number,
    expire: number,
    hunted: boolean,
    hunted_bands: string,
    park_hunts: number,
    op_hunts: number
};

// const rows = [
//     {
//         "spotId": 24575447,
//         "activator": "KC4MIT",
//         "frequency": "14244",
//         "mode": "SSB",
//         "reference": "K-0050",
//         "parkName": null,
//         "spotTime": "2024-02-12T19:10:03",
//         "spotter": "KC4MIT",
//         "comments": "QRT",
//         "source": "Web",
//         "invalid": null,
//         "name": "Mammoth Cave National Park",
//         "locationDesc": "US-KY",
//         "grid4": "EM67",
//         "grid6": "EM67we",
//         "latitude": 37.1877,
//         "longitude": -86.1012,
//         "count": 52,
//         "expire": 18,
//         "hunted": false,
//         "park_hunts": 0,
//         "op_hunts": 0
//     }
// ]