import {Heap} from 'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs';
export class MidiNoteMessage {
    constructor({when, channel, pitch, velocity}) {
        this.when = when;
        this.channel = channel;
        this.pitch = pitch;
        this.velocity = velocity;
    }
    static makeArray(midiNoteArray) {
        const heap = new Heap();
        for (const {start, end, channel, pitch, velocity} of midiNoteArray) {
            for (const [i, v] of [
                start,
                end
            ].entries()) {
                heap.add(v, new this({
                    when: v,
                    channel,
                    pitch,
                    velocity: i === 0 ? velocity : 0
                }));
            }
        }
        return this.fixArray([...heap]);
    }
    static fixArray(midiNoteMessageArray) {
        const channelMap = new Map;
        const pitchMap = new Map;
        let currentTime = -1;
        for (const i of midiNoteMessageArray.keys()) {
            const {
                when,
                channel,
                pitch,
                velocity
            } = midiNoteMessageArray[i];
            if (currentTime === when) {
                if (pitchMap.has(pitch) && channelMap.has(channel) && velocity === 0) {
                    const j = pitchMap.get(pitch);
                    [midiNoteMessageArray[i], midiNoteMessageArray[j]] = [midiNoteMessageArray[j], midiNoteMessageArray[i]];
                }
            } else {
                currentTime = when;
                channelMap.clear();
                pitchMap.clear();
            }
            channelMap.set(channel, i);
            pitchMap.set(pitch, i);
        }
        return midiNoteMessageArray;
    }
}
