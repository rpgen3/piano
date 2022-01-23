import {parseChord} from 'https://rpgen3.github.io/piano/mjs/parseChord.mjs';
class ChordFunction {
    constructor(type, chord){
        this.type = type;
        this.chord = [...parseChord(chord)];
    }
}
const t = new ChordFunction('t', 'C'),
      d = new ChordFunction('d', 'F'),
      s = new ChordFunction('s', 'G');
class Output {
    constructor(diff, obj){
        if(diff) Object.assign(this, obj);
        this.diff = diff;
    }
}
export const getChordFunctionType = input => {
    const m = new Map([t, d, s].map(v => [v.chord.reduce((p, x) => p + input.has(x), 0), v])),
          diff = Math.max(...m.keys());
    return new Output(diff, m.get(diff));
};
