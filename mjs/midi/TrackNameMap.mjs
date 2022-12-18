import {getScript} from 'https://rpgen3.github.io/mylib/export/import.mjs';
await getScript('https://cdnjs.cloudflare.com/ajax/libs/encoding-japanese/1.0.29/encoding.min.js');
export class TrackNameMap extends Map {
    constructor(midi) {
        super();
        for (const {event} of midi.track) {
            let trackName = null;
            let trackChannel = null;
            for (const v of event) {
                if (v.type === 0xff && v.metaType === 0x03) {
                    trackName = v.data;
                }
                if ('channel' in v) {
                    trackChannel = v.channel;
                }
            }
            if (trackName !== null && trackChannel !== null) {
                const decodedTrackName = Encoding.convert(trackName, {
                    to: 'unicode',
                    from: 'sjis',
                    type: 'string'
                });
                this.set(trackChannel, decodedTrackName);
                continue;
            }
        }
    }
}
