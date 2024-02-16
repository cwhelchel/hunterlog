export interface Qso {
    id: number;
    call: string;
    rst_sent: string;
    rst_recv: string;
    freq: string;
    freq_rx: string;
    mode: string;
    comment: string;
    qso_date: Date;
    time_on: string;
    tx_pwr: number;
    rx_pwr: number;
    gridsquare: string;
    sig: string;
    sig_info: string;
}