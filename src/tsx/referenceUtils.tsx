// import { ContextData } from "../@types/ContextTypes";

export function checkReferenceForSota(ref: string) {
    // eslint-disable-next-line no-useless-escape
    const regex = new RegExp('[a-zA-Z0-9]{2,3}\/[a-zA-Z0-9]{2}-[0-9]{3}');
    return regex.test(ref);
}

export function checkReferenceForWwff(ref: string) {
    const regex = new RegExp('[a-zA-Z0-9]{1,2}FF-[0-9]{4}');
    return regex.test(ref);
}

export function checkReferenceForPota(ref: string) {
    const regex = new RegExp('[A-Z0-9]+-[0-9]*');
    return regex.test(ref);
}

export function checkReferenceForWwbota(ref: string) {
    // eslint-disable-next-line no-useless-escape
    const regex = new RegExp('B\/[A-Z0-9]+-[0-9]*');
    return regex.test(ref);
}


interface ICheckedRefs {
    xota_ref: string | undefined;
    otherRefs: string | undefined;
    ok: boolean;
}

/*
* Checks a comma seperated list of references for valid reference ids using
* the checker function. The function should regex check the given ref string
* and return true if its a valid reference for the program
*/
export function checkForValidRefs(currentRef: string, otherRefs: string, checker: (ref: string) => boolean): ICheckedRefs {
    const res = otherRefs;
    const currentPark = currentRef;
    const arr = res.split(',');

    arr.forEach((x) => {
        const isValid = checker(x);
        if (!isValid) {
            return { ok: false };
        }
    })

    // add current sig_info to list for xota_ref adif
    arr.push(currentPark);

    return {
        ok: true,
        xota_ref: arr.join(','),
        otherRefs: res
    };
}

/*
* This dic stores the reference checker functions keyed by the programs SIG str.
* When new programs are added this should be updated.
*/
export const sigCheckers: Record<string, (ref: string) => boolean>  = {
    "POTA": checkReferenceForPota,
    "SOTA": checkReferenceForSota,
    "WWFF": checkReferenceForWwff,
    "WWBOTA": checkReferenceForWwbota,
}