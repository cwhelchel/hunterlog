import { GridFilterModel } from "@mui/x-data-grid/models";
import { Qso } from "./QsoTypes";

export interface ContextData {
    qso: Qso | null;
    filter: GridFilterModel;
    bandFilter: number;
}

export  interface AppContextType {
    contextData: ContextData;
    setData: (d: ContextData) => void;
}