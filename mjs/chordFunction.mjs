import {parseChord} from 'https://rpgen3.github.io/piano/mjs/parseChord.mjs';
const type = new Map([...'tsd'].map((v, i) => [i, v]));
const list = [ // tonic subdominant dominant
    ['C', 'F', 'G'],
    ['C△7', 'F△7', 'G7']
].map(v => v.map(v => [...parseChord(chord).value]));
class Output {
    constructor(diff, i){
        this.diff = diff;
        this.type = type.get(i);
    }
}
export const chordFunction = new class {
    constructor(){
        this.status = 1;
    }
    getType(input){
        const m = new Map(list[this.status].map((v, i) => [
            v.reduce((p, x) => p + input.has(x), 0),
            i
        ]));
        const diff = Math.max(...m.keys());
        return new Output(diff, m.get(diff));
    }
}
