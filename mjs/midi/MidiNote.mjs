import {Heap} from 'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs';
export class MidiNote {
    constructor({start, end, channel, pitch, velocity}) {
        this.start = start;
        this.end = end;
        this.channel = channel;
        this.pitch = pitch;
        this.velocity = velocity;
    }
    static makeArray(midi) {
        const heap = new Heap();
        for(const {event} of midi.track) {
            const now = new Map;
            let currentTime = 0;
            for(const {deltaTime, type, data, channel} of event) {
                currentTime += deltaTime;
                if(type !== 8 && type !== 9) continue;
                const [pitch, velocity] = data,
                      isNoteOFF = type === 8 || !velocity;
                if(now.has(pitch) && isNoteOFF) {
                    const unit = now.get(pitch);
                    unit.end = currentTime;
                    heap.add(unit.start, unit);
                    now.delete(pitch);
                } else if (!isNoteOFF) now.set(pitch, new this({
                    start: currentTime,
                    channel,
                    pitch,
                    velocity
                }));
            }
        }
        return [...heap];
    }
}
