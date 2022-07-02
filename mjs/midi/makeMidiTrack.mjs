import {Heap} from 'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs';
import {fixTrack} from 'https://rpgen3.github.io/piano/mjs/midi/fixTrack.mjs';
export const makeMidiTrack = midiNoteSequence => {
    const heap = new Heap();
    for(const {
        pitch,
        velocity,
        start,
        end
    } of midiNoteSequence) {
        for(const [i, v] of [
            start,
            end
        ].entries()) {
            heap.add(v, {
                pitch,
                velocity: i === 0 ? 100 : 0,
                when: v
            });
        }
    }
    return fixTrack([...heap]);
};
