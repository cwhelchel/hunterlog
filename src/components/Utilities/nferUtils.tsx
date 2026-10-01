import { SpotComments } from "../../@types/SpotComments";

// match POLO and any general POTA ref (US-XXXX CA-XXXX)
const nferPat = /\b([0-9n]+-fer:)?((?:\s*[a-zA-Z0-9]{2}-[0-9]{4,5}|TEST){1,})/;

export function getPotaPlusNfer(comment: string) {
    const re = new RegExp("{Also:([^}]*)}");
    const m = comment.match(re);

    if (m) {
        return m[1];
    }

    return null;
}

export function getPoloNfer(comment: string) {
    // parse polo nfer comment

    const m = comment.match(nferPat);
    if (m) {
        // make em comma separated
        console.log("da match", m);
        let parks = "";
        if (m.length == 2)
            parks = m[1]?.trim().replace(/ /g, ',');
        else if (m.length == 3)
            parks = m[2]?.trim().replace(/ /g, ',');
        return parks;
    }

    return null;
}

export function getMultiParkString(comms: SpotComments[]): string {
    if (comms.length > 0) {
        const str = comms[0].comments;

        const pp = getPotaPlusNfer(str);
        if (pp)
            return pp;

        const pl = getPoloNfer(str);
        if (pl) {
            console.log(pl);
            return pl;
        }
    }

    // console.log('comms.length was <= 0');
    return '';
}


export function testForNfer(comment: string) {
    // potaplus or HL
    if (comment.includes('{Also:'))
        return true;

    if (comment.match(nferPat))
        return true;

    return false;
}