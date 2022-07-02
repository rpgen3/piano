export const getTempos = midi => {
    const result = new Map;
    for(const {event} of midi.track) {
        let currentTime = 0;
        for(const {deltaTime, type, metaType, data} of event) {
            currentTime += deltaTime;
            if(type === 0xFF && metaType === 0x51) result.set(currentTime, data);
        }
    }
    if(result.size) return result;
    else throw 'BPM is none.';
};
export const toggleTempoAndBpm = tempoOrBpm => 6E7 / tempoOrBpm;
