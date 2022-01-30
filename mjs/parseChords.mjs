import {toHan} from 'https://rpgen3.github.io/mylib/export/hankaku.mjs';
export const parseChords = (str, bpm = 120) => {
    const output = [],
          secBar = 60 / bpm * 4,
          frontChars = new Set('ABCDEFG_=%N'); // N === N.C.
    let idx = 0,
        last = null;
    for(const line of toHan(str).split('\n').map(v => v.trim())) {
        if(!line.length || /^#/.test(line)) continue;
        for(const str of line.split(/[\|lｌ→]/)) {
            if(!str.length) continue;
            const when = idx++ * secBar,
                  a = [];
            for(let i = 0; i < str.length; i++) {
                const char = str[i],
                      prev = str[i - 1],
                      prev2 = str.slice(i - 2, i);
                if(!frontChars.has(char)) continue;
                else if(prev === '/' || prev2 === 'on') continue;
                else if(prev2 === 'N.' && char === 'C') continue;
                a.push(i);
            }
            if(!a.length) continue;
            const divide = 2 ** Math.ceil(Math.log2(a.length)),
                  unitTime = secBar / divide;
            for(const [i, v] of a.entries()) {
                const s = str.slice(v, i === a.length - 1 ? str.length : a[i + 1]).replace(/\s+/g,''),
                      c = s[0];
                if(c === '_' || c === 'N') {
                    last = null;
                    continue;
                }
                else if(c === '=') {
                    last.duration += unitTime;
                    continue;
                }
                const _when = when + i * unitTime;
                if(c === '%') {
                    if(last === null) continue;
                    last = {...last};
                    last.when = _when;
                    last.duration = unitTime;
                }
                else {
                    const key = s.slice(0, s[1] === '#' ? 2 : 1),
                          chord = s.slice(key.length).replaceAll(/[\s・]/g, '');
                    last = {
                        key,
                        chord,
                        when: _when,
                        duration: unitTime
                    };
                }
                output.push(last);
            }
            if(last !== null && divide > a.length) last.duration = unitTime * (divide - a.length);
        }
    }
    return output;
};
