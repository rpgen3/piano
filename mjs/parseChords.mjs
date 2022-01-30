import {toHan} from 'https://rpgen3.github.io/mylib/export/hankaku.mjs';
export const parseChords = (str, bpm = 120) => {
    const output = [],
          secBar = 60 / bpm * 4,
          frontChars = new Set('ABCDEFG_=%N'); // N === N.C.
    let idx = 0,
        prev = null;
    for(const line of toHan(str).split('\n').map(v => v.trim())) {
        if(!line.length || /^#/.test(line)) continue;
        for(const str of line.split(/[\|lｌ→]/)) {
            if(!str.length) continue;
            const when = idx++ * secBar,
                  a = [];
            let flag = false;
            for(let i = 0; i < str.length; i++) {
                const char = str[i],
                      prev = str[i - 1],
                      prev2 = str.slice(i - 2, i);
                if(!frontChars.has(char)) continue;
                else if(prev === '/' || prev2 === 'on') continue;
                else if(prev === '.' && char === 'C') continue;
                if(!flag) {
                    if(char === '_' || char === '=' || char === '%') continue;
                    else flag = true;
                }
                a.push(i);
            }
            if(!a.length) continue;
            const unitTime = secBar / a.length;
            for(const [i, v] of a.entries()) {
                const s = str.slice(v, i === a.length - 1 ? str.length : a[i + 1]).replace(/\s+/g,''),
                      c = s[0];
                if(c === '_' || c === 'N') continue;
                else if(c === '=') {
                    prev.duration += unitTime;
                    continue;
                }
                const _when = when + i * unitTime;
                if(c === '%') {
                    prev = {...prev};
                    prev.when = _when;
                }
                else {
                    const key = s.slice(0, s[1] === '#' ? 2 : 1),
                          chord = s.slice(key.length).replaceAll(/[\s・]/g, '');
                    prev = {
                        key,
                        chord,
                        when: _when,
                        duration: unitTime
                    };
                }
                output.push(prev);
            }
        }
    }
    return output;
};
