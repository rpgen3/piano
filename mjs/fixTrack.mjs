export const fixTrack = track => {
    const m = new Map;
    let now = -1;
    for(const [i, v] of track.entries()) {
        const {
            note,
            velocity,
            when
        } = v;
        if(now === when) {
            if(m.has(note) && velocity === 0) {
                const _v = m.get(note);
                v.velocity = _v.velocity;
                _v.velocity = 0;
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
