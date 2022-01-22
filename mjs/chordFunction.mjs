import {parse} from 'https://rpgen3.github.io/piano/mjs/parse.mjs';
const keys = 'CDEFGAB',
      m = new Map([...'ⅠⅡⅢⅣⅤⅥⅦ'].map((v, i) => [v, i])),
      _3m7 = 'Ⅲm7',
      _6m7 = 'Ⅵm7';
const list = {
    t: [ // tonic
        'Ⅰ△7',
        [_3m7, _6m7]
    ],
    d: [ // dominant
        'Ⅴ7',
        'Ⅶm7(b5)',
        _3m7
    ],
    s: [ //  subdominant
        'Ⅳ△7',
        'Ⅱm7',
        _6m7
    ]
};
const _parse = str => ({
    name: str,
    value: parse(keys[m.get(str[0])] + str.slice(1)).value
});
for(const k in list) {
    const a = list[k];
    for(const [i, v] of a.entries()) {
        if(Array.isArray(v)) for(const [i, _v] of v.entries()) v[i] = _parse(_v);
        else a[i] = _parse(v);
    }
}
export const chordFunction = list;
