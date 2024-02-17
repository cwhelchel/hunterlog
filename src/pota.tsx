import { ParkInfo } from "./@types/PotaTypes";

export function getParkInfo(park: string): Promise<ParkInfo> {
    let url = "https://api.pota.app/park/" + park;

    return fetch(url)
        .then(res => res.json()) // the JSON body is taken from the response
        .then(res => {
            // The response has an `any` type, so we need to cast
            // it to the `User` type, and return it from the promise
            return res as ParkInfo;
        })
}
