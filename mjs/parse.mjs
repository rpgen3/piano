import {SortedSet} from 'https://rpgen3.github.io/piano/mjs/SortedSet.mjs';
// [degree - 1] to [pitch class]
const idx2pitch = [0, 2, 4, 5, 7, 9, 11];
for(const i of [...idx2pitch.keys()]) idx2pitch.push(idx2pitch[i] + 12);
// [degree] to [pitch class]
const deg2pitch = deg => idx2pitch[deg - 1];
class Input {
    static nums = new Set('0123456789');
    constructor(str){
        this.str = str;
        this.idx = 0;
    }
    get isEOF(){
        const {str, idx} = this;
        return str.length <= idx;
    }
    get char(){
        const {str, idx} = this;
        return str[idx];
    }
    get num(){ // destructive
        let str = '';
        while(!this.isEOF) {
            const {char} = this;
            if(!Input.nums.has(char)) break;
            str += char;
            this.idx++;
        }
        return str.length ? Number(str) : null;
    }
    slice(i){
        const {str, idx} = this;
        return str.slice(idx, idx + i);
    }
}
class Output {
    constructor(){
        this.pitch = null;
        this.chord = null;
        this.isChord = false;
        this.pending = null;
    }
    get value(){
        const {pitch, chord} = this;
        return new Set([...chord].map(v => v + pitch));
    }
    set value(chord){
        const {pitch} = this;
        this.chord = new Set([...chord].map(v => v - pitch));
    }
}
class Parser {
    constructor(){
        this.map = new Map;
        this.len = new SortedSet(true);
    }
    _set(key, value){
        this.map.set(key, value);
        this.len.add(key.length);
    }
    set(key, value){
        if(Array.isArray(key)) for(const k of key) this._set(k, value);
        else this._set(key, value);
    }
    parse(input){
        const {map, len} = this;
        for(const i of len) {
            const s = input.slice(i);
            if(map.has(s)) {
                input.idx += s.length;
                return map.get(s);
            }
        }
        return null;
    }
};
// parser
export const parse = str => parseFormula(new Input(str));
const err = (input, msg) => {
    throw Error(`SyntaxError: ${[msg, ...['idx','str'].map(v => `input.${v}: ${input[v]}`)].join('\n')}`);
};
const parseFormula = (() => {
    const p = new Parser;
    p.set('(', 0); // magic number
    p.set(')', 1);
    p.set(['/', 'on'], 2);
    return (input, output = new Output, nest = 0) => {
        let start = input.idx;
        const _eval = (offset = 0) => {
            const str = input.str.slice(start, input.idx + offset);
            if(str.length) parseChord(new Input(str), output);
        };
        while(true) {
            if(input.isEOF) {
                if(nest) err(input, `Unclosed ${nest} brackets`);
                _eval();
                return output;
            }
            const res = p.parse(input);
            if(res === null) {
                input.idx++;
                continue;
            }
            _eval(-1);
            if(res === 0) parseFormula(input, output, nest + 1);
            else if(res === 1) {
                if(nest - 1 < 0) err(input, 'Unable to close brackets');
                return output;
            }
            else if(res === 2) {
                const o = parseFormula(input, new Output, nest),
                      v = [...output.value];
                if(o.isChord) output.value = [...o.value].concat(v); // UST
                else { // [inversion] or [hybrid chord]
                    const a = v.sort((a, b) => a - b),
                          {pitch} = o;
                    while(a[0] < pitch) a.push(a.shift() + 12);
                    a.push(pitch);
                    output.value = a;
                }
            }
            start = input.idx;
        }
    };
})();
const parseHalf = (() => {
    const p = new Parser,
          _p = new Parser;
    for(const v of [p, _p]) {
        v.set(['#', '♯'], 1);
        v.set(['b', '♭'], -1);
    }
    _p.set('+', 1);
    _p.set('-', -1);
    return (input, isPitch = false) => (isPitch ? p : _p).parse(input);
})();
const parseChord = (input, output) => {
    if(input.isEOF) return output;
    else if(output.pitch === null) parsePitch(input, output);
    else if(output.pending === null) parseFunc(input, output);
    else parsePending(input, output);
};
const parsePitch = (() => {
    const p = new Parser;
    for(const [i, v] of [...'CDEFGAB'].entries()) p.set(v, idx2pitch[i]);
    return (input, output = new Output) => {
        const pitch = p.parse(input);
        if(pitch === null) err(input, 'Not fond pitch');
        output.pitch = pitch;
        const half = parseHalf(input, true);
        if(half !== null) output.pitch += half;
        return parseBasic(input, output);
    };
})();
const parseBasic = (() => {
    const p = new Parser,
          major = [0, 4, 7],
          dim = [0, 3, 6];
    p.set(['m', 'min', 'Min', 'minor', 'Minor', '-'], [0, 3, 7]);
    p.set(['dim', 'o', '〇'], [0, 3, 6]);
    p.set('+', [0, 4, 8]); // aug
    p.set(['Φ', 'φ', 'ø'], [0, 3, 6, 10]);
    return (input, output) => {
        const res = p.parse(input);
        if(res !== null) output.isChord = true;
        output.chord = new Set(res || major);
        if(res === dim) {
            const {num} = input,
                  {chord} = output;
            chord.add(deg2pitch(n) - 2);
        }
        return parseFunc(input, output);
    };
})();
const parseFunc = (() => {
    const p = new Parser;
    p.set('add', (chord, n, half) => {
        chord.add(deg2pitch(n) + half);
    });
    p.set(['omit', 'no'], (chord, n, half) => {
        chord.delete(deg2pitch(n) + half);
    });
    p.set('sus', (chord, n, half) => {
        chord.delete(deg2pitch(3));
        chord.add(deg2pitch(n) + half);
    });
    const _7th = (chord, n, half, isFlat = false) => { // C7, CM7
        if(n === 5) chord.delete(deg2pitch(3));
        else if(n === 6) chord.add(deg2pitch(6));
        else if(n === 69) chord.add(deg2pitch(6)).add(deg2pitch(9));
        else {
            if(n >= 7) chord.add(deg2pitch(7) + (isFlat ? -1 : 0)); // C7
            if(n >= 9) chord.add(deg2pitch(9)); // C7add(9) -> C9
            if(n >= 11) chord.add(deg2pitch(11));
            if(n >= 13) chord.add(deg2pitch(13));
        }
    };
    p.set(['M', 'maj', 'Maj', 'major', 'Major', '△', 'Δ'], _7th);
    const _half = (chord, n, half) => {
        chord.delete(deg2pitch(n));
        chord.add(deg2pitch(n) + half);
    };
    const aug = chord => {
        chord.delete(deg2pitch(5));
        chord.add(deg2pitch(5) + 1);
    };
    p.set('aug', aug);
    return (input, output) => {
        if(!output.isChord) output.isChord = true;
        const func = p.parse(input),
              {chord} = output;
        if(func === null) {
            const half = parseHalf(input),
                  {num} = input;
            if(num === null) err(input, 'Not found number');
            if(half === null) _7th(chord, num, half, true);
            else _half(chord, num, half);
        }
        else if(func === aug) aug(chord);
        else output.pending = func;
        return parseChord(input, output);
    };
})();
const parsePending = () => {
    const {pending, chord} = output,
          {func} = pending,
          half = parseHalf(input),
          {num} = input;
    output.pending = null;
    if(num === null) err(input, 'Not found number');
    else if(half === null) func(chord, num);
    else func(chord, num, half);
    return parseChord(input, output);
};
