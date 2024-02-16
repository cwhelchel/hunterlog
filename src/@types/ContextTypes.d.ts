import { Qso } from "./QsoTypes";

export interface ContextData {
    id: number;
    text: string;
    qso: Qso | null;
}

export  interface AppContextType {
    contextData: ContextData;
    setData: (d: ContextData) => void;
}