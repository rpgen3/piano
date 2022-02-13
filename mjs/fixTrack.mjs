export const fixTrack = track => {
    const m = new Map;
    let now = -1;
    for(const [i, v] of track.entries()) {
        const {note, flag, when} = v;
        if(now === when) {
            if(m.has(note) && flag === false) {
                m.get(note).flag = false;
                v.flag = true;
            }
        }
        else {
            now = when;
            m.clear();
        }
        m.set(note, v);
    }
    return track;
};
