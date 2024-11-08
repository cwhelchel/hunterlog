export interface Summit {
    summitCode: string;
    name: string;
    shortCode: string;
    altM: number;
    altFt: number;
    gridRef1: number;
    gridRef2: number;
    notes: string;
    validFrom: string;
    validTo: string;
    activationCount: number;
    myActivations: number;
    activationDate: string;
    myChases: number;
    activationCall: string;
    longitude: number;
    latitude: number
    locator: string;
    points: number;
    regionCode: string;
    regionName: string;
    associationCode: string;
    associationName: string;
    valid: boolean;
    restrictionMask: string;
    restrictionList: any;
};