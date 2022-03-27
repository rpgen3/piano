export const sec2delta = (sec, bpm = 120, div = 0x01E0) => Math.round(sec * bpm * div / 60);
export const delta2sec = (delta, bpm = 120, div = 0x01E0) => Math.round(delta / bpm / div * 60);
