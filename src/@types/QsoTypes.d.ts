export interface Qso {
    //qso_id: number;
    call: string;
    name: string;
    state: string;
    rst_sent: string;
    rst_recv: string;
    freq: string;
    freq_rx: string;
    mode: string;
    comment: string;
    qso_date: string;
    time_on: string;
    tx_pwr: number;
    rx_pwr: number;
    gridsquare: string;
    distance: number;
    bearing: number;
    sig: string;
    sig_info: string;
    pota_ref: string | undefined;
    sota_ref: string | undefined;
}