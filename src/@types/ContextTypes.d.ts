import { GridFilterModel } from "@mui/x-data-grid/models";
import { Qso } from "./QsoTypes";

export interface ContextData {
    qso: Qso | null;
    filter: GridFilterModel;
    bandFilter: number;
    regions: string[];
    regionFilter: string;
}

export  interface AppContextType {
    contextData: ContextData;
    setData: (d: ContextData) => void;
}