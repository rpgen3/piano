export const fixTrack = track => {
    const m = new Map;
    let now = -1;
    for(const [i, v] of track.entries()) {
        const {
            pitch,
            velocity,
            when
        } = v;
        if(now === when) {
            if(m.has(pitch) && velocity === 0) {
                const _v = m.get(pitch);
                v.velocity = _v.velocity;
                _v.velocity = 0;
            }
        }
        else {
            now = when;
            m.clear();
        }
        m.set(pitch, v);
    }
    return track;
};
