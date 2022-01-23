import {parseChord} from 'https://rpgen3.github.io/piano/mjs/parseChord.mjs';
const keys = 'CDEFGAB',
      m = new Map([...'ⅠⅡⅢⅣⅤⅥⅦ'].map((v, i) => [v, i]));
const scale = {};
scale.major = [
    ['ⅠM7', 'T'],
    ['Ⅱm7', 'SD'],
    ['Ⅲm7', 'T'],
    ['ⅣM7', 'SD'],
    ['Ⅴ7', 'D'],
    ['Ⅵm7', 'T'],
    ['Ⅶm7(b5)', 'D']
];
// https://watanabejunya.com/minor-perfect-guide/
scale.minor = {};
scale.minor.natural = [
    ['Ⅰm7', 'Tm'],
    ['Ⅱm7(b5)', 'SDm'],
    ['bⅢM7', 'Tm'],
    ['Ⅳm7', 'SDm'],
    ['Ⅴm7', 'Dm'],
    ['bⅥM7', 'SDm'],
    ['bⅦ7', 'Dm*']
];
scale.minor.harmonic = [
    ['ⅠmM7', 'Tm'],
    ['Ⅱm7(b5)', 'SDm'],
    ['bⅢaugM7', 'Tm'],
    ['Ⅳm7', 'SDm'],
    ['Ⅴ7', 'D'],
    ['bⅥM7', 'SDm'],
    ['Ⅶdim7', 'D']
];
scale.minor.melodic = [
    ['ⅠmM7', 'Tm'],
    ['Ⅱm7', 'SD'],
    ['bⅢaugM7', 'Tm'],
    ['Ⅳ7', 'D*'],
    ['Ⅴ7', 'D'],
    ['ⅥM7', 'Tm'],
    ['Ⅶm7(b5)', 'D']
];
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
        return {
            diff,
            type: m.get(diff)
        };
    }
}
