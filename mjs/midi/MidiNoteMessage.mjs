import {Heap} from 'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs';
export class MidiNoteMessage {
    constructor({pitch, velocity, when}) {
        this.pitch = pitch;
        this.velocity = velocity;
        this.when = when;
    }
    static makeArray(midiNoteArray) {
        const heap = new Heap();
        for(const {
            pitch,
            velocity,
            start,
            end
        } of midiNoteArray) {
            for(const [i, v] of [
                start,
                end
            ].entries()) {
                heap.add(v, new MidiNoteMessage({
                    pitch,
                    velocity: i === 0 ? velocity : 0,
                    when: v
                }));
            }
        }
        return this.#fixArray([...heap]);
    }
    static #fixArray(midiNoteMessageArray) {
        const m = new Map;
        let currentTime = -1;
        for(const midiNoteMessage of midiNoteMessageArray) {
            const {
                pitch,
                velocity,
                when
            } = midiNoteMessage;
            if(currentTime === when) {
                if(m.has(pitch) && velocity === 0) {
                    const _midiNoteMessage = m.get(pitch);
                    midiNoteMessage.velocity = _midiNoteMessage.velocity;
                    _midiNoteMessage.velocity = 0;
                }
            } else {
                currentTime = when;
                m.clear();
            }
            m.set(pitch, midiNoteMessage);
        }
        return midiNoteMessageArray;
    }
}
