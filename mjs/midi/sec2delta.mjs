export const sec2delta = ({sec, bpm = 120, div = 0x01E0}) => sec * bpm * div / 60;
export const delta2sec = ({delta, bpm = 120, div = 0x01E0}) => delta / bpm / div * 60;
