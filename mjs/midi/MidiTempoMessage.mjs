import {Heap} from 'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs';
export class MidiTempoMessage {
    constructor({tempo, when}) {
        this.tempo = tempo;
        this.when = when;
    }
    static makeArray(midi) {
        const heap = new Heap();
        for(const {event} of midi.track) {
            let currentTime = 0;
            for(const {deltaTime, type, metaType, data} of event) {
                currentTime += deltaTime;
                if(type === 0xFF && metaType === 0x51) heap.add(currentTime, new this({
                    tempo: data,
                    when: currentTime
                }));
            }
        }
        return [...heap];
    }
    get bpm() {
        return 6E7 / this.tempo;
    }
    set bpm(bpm) {
        this.tempo = 6E7 / this.bpm;
    }
}
