import {Heap} from 'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs';
export class MidiControlChangeMessage {
    constructor({when, channel, control, value}) {
        this.when = when;
        this.channel = channel;
        this.control = control;
        this.value = value;
    }
    static makeArray(midi) {
        const heap = new Heap();
        for(const {event} of midi.track) {
            let currentTime = 0;
            for(const {deltaTime, type, channel, data} of event) {
                currentTime += deltaTime;
                if(type === 0xB) heap.add(currentTime, new this({
                    when: currentTime,
                    channel,
                    control: data[0],
                    value: data[1]
                }));
            }
        }
        return [...heap];
    }
}
