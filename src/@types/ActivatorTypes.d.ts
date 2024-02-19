export interface ActivatorData {
    activator_id: number;
    callsign: string;
    name: string;
    qth: string;
    gravatar: string;
    activator: { activations: number, parks: number, qsos: number };
    attempts: { activations: number, parks: number, qsos: number };
    hunter: { parks: number, qsos: number };
    endorsements: number;
    awards: number;
    updated: string;
}

//{"activations": 54, "parks": 13, "qsos": 2070}