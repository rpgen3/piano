import {Heap} from 'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs';
export class MidiNoteMessage {
    constructor({when, ch, pitch, velocity}) {
        this.when = when;
        this.ch = ch;
        this.pitch = pitch;
        this.velocity = velocity;
    }
    static makeArray(midiNoteArray) {
        const heap = new Heap();
        for (const {start, end, ch, pitch, velocity} of midiNoteArray) {
            for (const [i, v] of [
                start,
                end
            ].entries()) {
                heap.add(v, new this({
                    when: v,
                    ch,
                    pitch,
                    velocity: i === 0 ? velocity : 0
                }));
            }
        }
        return this.fixArray([...heap]);
    }
    static fixArray(midiNoteMessageArray) {
        const chMap = new Map;
        const pitchMap = new Map;
        let currentTime = -1;
        for (const i of midiNoteMessageArray.keys()) {
            const {
                when,
                ch,
                pitch,
                velocity
            } = midiNoteMessageArray[i];
            if (currentTime === when) {
                if (pitchMap.has(pitch) && chMap.has(ch) && velocity === 0) {
                    const j = pitchMap.get(pitch);
                    [midiNoteMessageArray[i], midiNoteMessageArray[j]] = [midiNoteMessageArray[j], midiNoteMessageArray[i]];
                }
            } else {
                currentTime = when;
                chMap.clear();
                pitchMap.clear();
            }
            chMap.set(ch, i);
            pitchMap.set(pitch, i);
        }
        return midiNoteMessageArray;
    }
}
