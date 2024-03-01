import { GridFilterModel } from "@mui/x-data-grid/models";
import { Qso } from "./QsoTypes";
import { ParkInfo } from "./PotaTypes";
import { Park } from "./Parks";

export interface ContextData {
    qso: Qso | null;
    park: Park | null;
    filter: GridFilterModel;
    bandFilter: number;
    regions: string[];
    regionFilter: string;
}

export  interface AppContextType {
    contextData: ContextData;
    setData: (d: ContextData) => void;
}