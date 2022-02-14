export const toMIDI = ({tracks, bpm = 120, div = 0x01E0}) => {
    const arr = [];
    headerChunks(arr, tracks, bpm, div);
    trackChunks(arr, a => { // Tempo Track
        a.push(...deltaTime(0));
        a.push(0xFF, 0x51, 0x03, ...to3byte(6E7 / bpm));
    });
    for(const [i, track] of tracks.entries()) trackChunks(arr, a => {
        let now = 0;
        for(const {note, flag, when} of track) {
            a.push(...deltaTime(sec2delta(when - now, bpm, div)));
            a.push(0x90, note, flag ? 0x7F : i);
            now = when;
        }
    });
    return URL.createObjectURL(new Blob([new Uint8Array(arr).buffer], {type: 'audio/midi'}));
};
const to2byte = n => [(n & 0xff00) >> 8, n & 0xff],
      to3byte = n => [(n & 0xff0000) >> 16, ...to2byte(n)],
      to4byte = n => [(n & 0xff000000) >> 24, ...to3byte(n)];
const headerChunks = (arr, tracks, bpm, div) => {
    arr.push(0x4D, 0x54, 0x68, 0x64); // チャンクタイプ(4byte)
    arr.push(...to4byte(6)); // データ長(4byte)
    for(const v of [
        1, // Format Type 0 or 1 (or 2)
        tracks.length + 1,
        div
    ]) arr.push(...to2byte(v));
};
const trackChunks = (arr, func) => {
    arr.push(0x4D, 0x54, 0x72, 0x6B); // チャンクタイプ(4byte)
    const a = [];
    func(a);
    a.push(...deltaTime(0));
    a.push(0xFF, 0x2F, 0x00); // トラックチャンクの終わりを示す
    arr.push(...to4byte(a.length)); // データ長(4byte)
    while(a.length) arr.push(a.shift());
};
const sec2delta = (sec, bpm, div) => Math.round(sec * bpm * div / 60);
const deltaTime = n => { // 可変長数値表現
    if(n === 0) return [0];
    const arr = [];
    let i = 0;
    while(n) {
        const _7bit = n & 0x7F;
        n >>= 7;
        arr.unshift(_7bit | (i++ ? 0x80 : 0));
    }
    return arr;
};
