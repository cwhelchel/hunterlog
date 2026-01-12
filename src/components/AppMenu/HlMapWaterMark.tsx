/* eslint-disable @typescript-eslint/no-unused-vars */
import * as L from 'leaflet';
import logo from '../../assets/logo.png';

export class HlMapWaterMark extends L.Control {
    options: L.ControlOptions = {
        position: 'bottomleft',
    };

    onAdd(map: L.Map): HTMLElement {
        const img = L.DomUtil.create('img');
        img.src = logo;
        //console.log(img.src);

        img.style.width = '25px';
        img.style.height = '25px';
        img.style.opacity = '0.55';

        return img;
    }

    onRemove(map: L.Map) {
        // Clean up event listeners if necessary
        // L.DomEvent.off(this._container, 'click', ...);
    }
}

/**
* Factory function following leaflet convention. Creates HlMapWaterMark instance
* with given options.
*/
export default function waterMarkControl(options?: L.ControlOptions) {
    return new HlMapWaterMark(options);
}