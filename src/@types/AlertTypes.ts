export interface AlertRow {
    /*
    id = sa.Column(sa.Integer, primary_key=True)
    enabled = sa.Column(sa.Boolean, server_default='1')
    new_only = sa.Column(sa.Boolean, server_default='1')
    name = sa.Column(sa.String, nullable=True)
    loc_search = sa.Column(sa.String, nullable=True)
    exclude_modes = sa.Column(sa.String, nullable=True)
    last_triggered = sa.Column(sa.TIMESTAMP, nullable=True)
    dismissed_until = sa.Column(sa.TIMESTAMP, nullable=True)
    dismissed_callsigns = sa.Column(sa.String, nullable=True)
    */
    id: number,
    enabled: boolean,
    new_only: boolean,
    name: string,
    loc_search: string,
    exclude_modes: string,
    last_triggered: string | null,
    dismissed_until: string | null,
    dismissed_callsigns: string | null
};
