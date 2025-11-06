import { ParkInfo, ParkStats } from "../@types/PotaTypes";
import { Summit } from "../@types/Summit";

/*
!!!!Dont use this!!!! the python api will take care of getting the park info
*/
export function getParkInfo(park: string): Promise<ParkInfo> {
    const url = "https://api.pota.app/park/" + park;

    return fetch(url)
        .then(res => res.json()) // the JSON body is taken from the response
        .then(res => {
            // The response has an `any` type, so we need to cast
            // it to the `ParkInfo` type, and return it from the promise
            return res as ParkInfo;
        })
}

export function getParkStats(park: string): Promise<ParkStats> {
    const url = 'https://api.pota.app/park/stats/' + park;

    return fetch(url)
        .then(res => res.json())
        .then(res => {
            return res as ParkStats;
        })
}

export function getSummitInfo(summitCode: string): Promise<Summit> {
    const url = "https://api2.sota.org.uk/api/summits/" + summitCode;

    return fetch(url)
        .then(res => res.json()) 
        .then(res => {
            return res as Summit;
        })
}

export function getStateFromLocDesc(locDesc: string): string {
    const loc = locDesc.split(',')[0];

    const arr = loc.split('-');
    console.log(`${arr[0]} === ${arr[1]}`);

    if (arr[0] === 'US' || arr[0] == 'CA') {
        return arr[1];
    }
    return '';
};