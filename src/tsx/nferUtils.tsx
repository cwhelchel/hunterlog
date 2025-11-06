import { SpotComments } from "../@types/SpotComments";

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
    const poloRex = /\b[0-9]+-fer:((?:\s+[A-Z0-9]+-[0-9]{4,5}|TEST){2,})/;
    const poloRe = new RegExp(poloRex);

    const m = comment.match(poloRe);
    if (m) {
        // make em comma separated
        const parks = m[1].trim().replace(/ /g, ',');
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
    return '';
}


export function testForNfer(comment: string) {
    // potaplus or HL
    if (comment.includes('{Also:'))
        return true;

    // Ham2k Polo self spot for n-fers
    if (comment.match(/\b[0-9]+-fer:(?: [A-Z0-9]+-(?:[0-9]{4,5}|TEST)){2,}/))
        return true;
}