import {Heap} from 'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs';
export class MidiTempoMessage {
    constructor({when, tempo, bpm = null}) {
        this.when = when;
        this.tempo = tempo;
        if (bpm !== null) this.bpm = bpm;
    }
    static makeArray(midi) {
        const heap = new Heap();
        for(const {event} of midi.track) {
            let currentTime = 0;
            for(const {deltaTime, type, metaType, data} of event) {
                currentTime += deltaTime;
                if(type === 0xFF && metaType === 0x51) heap.add(currentTime, new this({
                    when: currentTime,
                    tempo: data
                }));
            }
        }
        return [...heap];
    }
    get bpm() {
        return 6E7 / this.tempo;
    }
    set bpm(bpm) {
        this.tempo = 6E7 / bpm;
    }
}
