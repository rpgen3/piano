import {Heap} from 'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs';
export class MidiProgramChangeMessage {
    constructor({when, channel, program}) {
        this.when = when;
        this.channel = channel;
        this.program = program;
    }
    static makeArray(midi) {
        const heap = new Heap();
        for(const {event} of midi.track) {
            let currentTime = 0;
            for(const {deltaTime, type, channel, data} of event) {
                currentTime += deltaTime;
                if(type === 0xC) heap.add(currentTime, new this({
                    when: currentTime,
                    channel,
                    program: data
                }));
            }
        }
        return [...heap];
    }
}
