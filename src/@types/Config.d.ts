export interface UserConfig {
    my_call: string,
    my_grid6: string,
    default_pwr: number,
    flr_host: string,
    flr_port: number,
    adif_host: string,
    adif_port: number,
    logger_type: number,
    size_x: number,
    size_y: number,
    is_max: boolean,
    cw_mode: string,
    ftx_mode: string,
    qth_string: string,
    rig_if_type: string,
    include_rst: boolean,
    enabled_progs: string
    scan_wait_time: number,
}

export interface ConfigVer2 {
    id: string,
    key: string,
    val: string,
    type: string,
    enabled: boolean,
    editable: boolean,
    description: string,
    group: string,
}
