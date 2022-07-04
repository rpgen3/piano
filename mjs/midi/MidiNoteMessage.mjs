import {Heap} from 'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs';
export class MidiNoteMessage {
    constructor({pitch, velocity, when}) {
        this.pitch = pitch;
        this.velocity = velocity;
        this.when = when;
    }
    static makeArray(midiNoteArray) {
        const heap = new Heap();
        for (const {
            pitch,
            velocity,
            start,
            end
        } of midiNoteArray) {
            for (const [i, v] of [
                start,
                end
            ].entries()) {
                heap.add(v, new this({
                    pitch,
                    velocity: i === 0 ? velocity : 0,
                    when: v
                }));
            }
        }
        return this.fixArray([...heap]);
    }
    static fixArray(midiNoteMessageArray) {
        const m = new Map;
        let currentTime = -1;
        for (const i of midiNoteMessageArray.keys()) {
            const {
                pitch,
                velocity,
                when
            } = midiNoteMessageArray[i];
            if (currentTime === when) {
                if (m.has(pitch) && velocity === 0) {
                    const j = m.get(pitch);
                    [midiNoteMessageArray[i], midiNoteMessageArray[j]] = [midiNoteMessageArray[j], midiNoteMessageArray[i]];
                }
            } else {
                currentTime = when;
                m.clear();
            }
            m.set(pitch, i);
        }
        return midiNoteMessageArray;
    }
}
