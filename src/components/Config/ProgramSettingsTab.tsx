import * as React from 'react';
import { FormControlLabel, FormGroup, Stack, Switch } from "@mui/material";
import { useConfigContext } from './ConfigContextProvider';

export interface ProgramCfg {
    name: string;
    enabled: boolean;
}

export default function ProgramSettingsTab() {
    const { config, setConfig } = useConfigContext();
    const [progs, setProgs] = React.useState<ProgramCfg[]>([])

    React.useEffect(() => {
        const x = config.enabled_progs
        console.log(x);

        const obj = JSON.parse(x);
        console.log(obj);
        const newProgs: ProgramCfg[] = [];

        for (const key in obj) {
            const p: ProgramCfg = { name: key, enabled: obj[key] };
            newProgs.push(p);
        }
        setProgs(newProgs);

    }, []);

    function handleOnChange(event: React.ChangeEvent<HTMLInputElement>, checked: boolean): void {
        const sig = event.target.id;
        const newProgs = [...progs];
        const item = newProgs.find((x) => x.name == sig);
        if (item)
            item.enabled = checked;
        setProgs(newProgs);

        const newJson: Record<string, boolean> = {};
        progs.forEach((x: ProgramCfg) => {
            newJson[x.name] = x.enabled;
        });

        setConfig({ ...config, enabled_progs: JSON.stringify(newJson) });
    }

    return (
        <div style={{ 'display': 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <p className="modal-config-text">
                Use these switches to enable or disable downloading and processing
                of spots from various supported programs. You must restart Hunterlog for
                any changes to take effect.
            </p>
            <Stack direction={'column'} spacing={1}>
                <FormGroup>
                    {progs.map((p) => {
                        return (
                            <FormControlLabel
                                key={p.name}
                                label={p.name}
                                control={
                                    <Switch
                                        id={p.name}
                                        checked={p.enabled}
                                        onChange={handleOnChange}
                                    />}
                            />
                        )
                    })}
                </FormGroup>
            </Stack>
        </div>
    )

}