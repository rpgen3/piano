export const chord = new class {
    constructor(){
        this.white = [0, 2, 4, 5, 7, 9, 11];
        for(const i of [...this.white.keys()]) this.white.push(this.white[i] + 12);
        this.major = [0, 4, 7];
        this.minor = [0, 3, 7];
        this.dim = [0, 3, 6];
        this.pitch = new Map([...'CDEFGAB'].map((v, i) => [v, this.white[i]]));
    }
    clean(output){
        let i = -Infinity;
        for(const v of [...output].sort((a, b) => a - b)) {
            if(i - v === -1) output.delete(v);
            else i = v;
        }
        return output;
    }
    _parseSemitone(c){
        return /[\+#]/.test(c) ? 1 : /[\-b♭]/.test(c) ? -1 : 0;
    }
    parse(str){
        let i = 0,
            tmp = 0;
        const findPitch = () => {
            const pitch = str.slice(i)[0];
            if(!this.pitch.has(pitch)) return null;
            i++;
            const k = this._parseSemitone(str.slice(i)[0]);
            i += Math.abs(k);
            return this.pitch.get(pitch) + k;
        };
        const pitch = null !== (tmp = findPitch()) ? tmp : 0;
        const output = new Set((() => {
            if(/^dim/.test(str.slice(i))) { // Cdim Cdim7
                i += 3;
                return this.dim;
            }
            else if(str.slice(i)[0] === 'm') { // Cm
                i++;
                return this.minor;
            }
            else return this.major;
        })());
        const getN = () => {
            const m = str.slice(i).match(/^[0-9]+/);
            if(m === null) return null;
            i += m[0].length;
            return Number(m[0]);
        };
        const w = deg => this.white[deg - 1];
        const setBack = () => { // C7 CM7 Cm7 CmM7
            const isFlat = str.slice(i)[0] === 'M' ? (i++, false) : true;
            if(null !== (tmp = getN())) {
                if(tmp === 5) output.delete(w(3));
                else if(tmp === 6) {
                    if(/^\/9/.test(str.slice(i))) {
                        i += 2;
                        output.add(w(6)).add(w(9));
                    }
                    else output.add(w(6));
                }
                else if(tmp === 69) output.add(w(6)).add(w(9));
                else {
                    if(tmp >= 7) output.add(w(7) + (isFlat ? -1 : 0));
                    if(tmp >= 9) output.add(w(9));
                    if(tmp >= 11) output.add(w(11));
                    if(tmp >= 13) output.add(w(13));
                }
            }
            bracket(add);
        };
        const bracket = func => {
            const m = str.slice(i).match(/^\((.+?)\)/);
            if(m) {
                let j = i;
                const res = func(m[1]);
                i = j + m[0].length;
                return res;
            }
            else return func(str.slice(i));
        };
        const add = s => {
            let j = 0;
            const k = this._parseSemitone(s.slice(j)[0]),
                  m = s.slice(j += Math.abs(k)).match(/^[0-9]+/);
            if(m === null) return;
            i += j + m[0].length;
            output.add(w(Number(m[0])) + k);
        };
        const cmd = s => {
            if(/^add/.test(s)) { // Cadd9
                i += 3;
                if(null !== (tmp = getN())) output.add(w(tmp));
            }
            else if(/^omit/.test(s)) { // Comit3 Cmomit3
                i += 4;
                if(null !== (tmp = getN())) output.delete(w(tmp));
            }
            else if(/^aug/.test(s)) { // C7aug Caug7
                i += 3;
                const _5 = w(5);
                output.delete(_5);
                output.add(w(_5 + 1));
            }
            else if(/^sus/.test(s)) { // Csus2 Csus4
                i += 3;
                if(null !== (tmp = getN())) {
                    output.delete(w(3));
                    output.add(w(tmp));
                }
            }
            else if(/^\//.test(s)) {
                i++;
                if(null !== (tmp = findPitch())) {
                    const min = Math.min(...output),
                          octave = Math.floor(min / 12);
                    let pitch = tmp + octave * 12;
                    if(min < pitch) pitch -= 12;
                    output.add(pitch);
                }
                return null;
            }
            else return null;
        };
        while(true) {
            setBack();
            if(null === bracket(cmd)) break;
        }
        setBack();
        return new Set([...output].map(v => v + pitch));
    }
};
