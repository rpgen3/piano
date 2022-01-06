(async () => {
    const {importAll, getScript} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
    await Promise.all([
        'https://code.jquery.com/jquery-3.3.1.min.js'
    ].map(getScript));
    const {$} = window;
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const head = $('<header>').appendTo(html),
          main = $('<main>').appendTo(html),
          foot = $('<footer>').appendTo(html);
    $('<h1>').appendTo(head).text('chord piano');
    const rpgen3 = await importAll([
        'random',
        'input',
        'css',
        'util'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const rpgen4 = await importAll([
        'https://rpgen3.github.io/midi/mjs/piano.mjs',
        [
            'LayeredCanvas',
            'keyboard',
            'resize',
            'chord'
        ].map(v => `https://rpgen3.github.io/piano/mjs/${v}.mjs`),
        [
            'inversion',
            'audioNode',
            'SoundFont_surikov',
            'SoundFont_surikov_list'
        ].map(v => `https://rpgen3.github.io/chord/mjs/${v}.mjs`)
    ].flat());
    const {
        LayeredCanvas,
        keyboard,
        audioNode,
        SoundFont_surikov_list
    } = rpgen4;
    [
        'container',
        'btn'
    ].map(v => `https://rpgen3.github.io/spatialFilter/css/${v}.css`).map(rpgen3.addCSS);
    const fetchList = async url => {
        const res = await fetch(url),
              str = await res.text();
        return str.trim().split('\n');
    };
    const hideTime = 500;
    const addHideArea = (label, parentNode = main) => {
        const html = $('<div>').addClass('container').appendTo(parentNode);
        const input = rpgen3.addInputBool(html, {
            label,
            save: true,
            value: true
        });
        const area = $('<dl>').appendTo(html);
        input.elm.on('change', () => input() ? area.show(hideTime) : area.hide(hideTime)).trigger('change');
        return Object.assign(input, {
            get html(){
                return area;
            }
        });
    };
    const notSelected = 'not selected';
    let SoundFont = rpgen4.SoundFont_surikov,
        sf = null;
    {
        const {html} = addHideArea('load SoundFont');
        const selectFont = rpgen3.addSelect(html, {
            label: 'select SoundFont'
        });
        const selectInstrument = rpgen3.addSelect(html, {
            label: 'select instrument'
        });
        SoundFont_surikov_list.onload(() => {
            selectFont.elm.show(hideTime);
            selectFont.update([notSelected, ...SoundFont_surikov_list.tone.keys()], notSelected);
            selectInstrument.update([notSelected], notSelected);
        });
        selectFont.elm.on('change', async () => {
            const font = selectFont();
            if(font === notSelected) return;
            const map = new Map((
                await fetchList('https://rpgen3.github.io/chord/list/fontName_surikov.txt')
            ).map(v => {
                const a = v.split(' ');
                return [a[0].slice(0, 3), a.slice(1).join(' ')];
            }));
            selectInstrument.update([
                [notSelected, notSelected],
                ...[...SoundFont_surikov_list.tone.get(font).keys()].map(id => {
                    const _id = id.slice(0, 3);
                    return [map.has(_id) ? map.get(_id) : id, id];
                })
            ], notSelected);
        });
        SoundFont_surikov_list.init();
        selectInstrument.elm.on('change', async () => {
            const ins = selectInstrument();
            if(ins === notSelected) return;
            const e = [selectFont, selectInstrument].map(v => v.elm).reduce((p, x) => p.add(x));
            e.prop('disabled', true);
            try {
                const fontName =`${ins}_${selectFont()}`;
                sf = await SoundFont.load({
                    ctx: audioNode.ctx,
                    fontName: `_tone_${fontName}`,
                    url: SoundFont.toURL(fontName)
                });
            }
            catch (err) {
                console.error(err);
                alert(err);
            }
            e.prop('disabled', false);
        });
        const inputVolume = rpgen3.addInputNum(html, {
            label: 'sound volume',
            save: true
        });
        inputVolume.elm.on('input', () => {
            audioNode.note.gain.value = inputVolume() / 100;
        }).trigger('input');
    }
    const selectMode = (() => {
        const {html} = addHideArea('select mode');
        const selectMode = rpgen3.addSelect(html, {
            label: 'piano mode',
            save: true,
            list: {
                'normal piano': true,
                'chord piano': false
            }
        });
        selectMode.elm.on('change', () => {
            cvSymbol.clear();
            const mode = selectMode();
            for(const [i, v] of pianoKeys.entries()) {
                const{x, w, h, isBlack, chord, note} = v,
                      {ctx} = cvSymbol;
                ctx.fillStyle = isBlack ? 'white' : 'black';
                ctx.font = 'bold 20px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(mode ? note : chord, x + w / 2, ...[h, w].map(v => v - 10));
            }
        });
        return selectMode;
    })();
    LayeredCanvas.init($('<div>').appendTo(main));
    const cvWhite = new LayeredCanvas(),
          cvWhiteEffect = new LayeredCanvas(),
          cvBlack = new LayeredCanvas(),
          cvBlackEffect = new LayeredCanvas(),
          cvSymbol = new LayeredCanvas();
    const pianoKeys = (() => {
        class Key {
            constructor(x, w, h, isBlack){
                this.x = x;
                this.w = w;
                this.h = h;
                this.isBlack = isBlack;
                this.pressed = false;
            }
        }
        const keys = [...Array(12 * 2).fill(null)],
              keysLen = 7 * 2,
              key = {w: 60, h: 200},
              keyBlack = {w: 40, h: 100};
        cvWhite.ctx.lineWidth = 4;
        LayeredCanvas.html.find('canvas').prop({
            width:  key.w * keysLen,
            height: key.h
        });
        cvWhite.ctx.beginPath();
        {
            const a = [0, 2, 4, 5, 7, 9, 11],
                  b = [a, a.map(v => v + 12)].flat();
            for(let i = 0; i < keysLen; i++) {
                const {w, h} = key,
                      x = i * w;
                cvWhite.ctx.rect(x, 0, w, h);
                keys[b[i]] = new Key(x, w, h, false);
            }
        }
        cvWhite.ctx.stroke();
        cvBlack.ctx.beginPath();
        {
            const a = [1, 3, 6, 8, 10],
                  b = [a, a.map(v => v + 12)].flat();
            for(let i = 0; i < 2; i++) {
                const {w, h} = keyBlack,
                      _w = i * key.w * 7,
                      space = w - 5;
                for(const [j, v] of a.entries()) {
                    const x = _w + v * space;
                    cvBlack.ctx.rect(x, 0, w, h);
                    keys[b[i * a.length + j]] = new Key(x, w, h, true);
                }
            }
        }
        cvBlack.ctx.fill();
        return keys;
    })();
    const c3 = rpgen4.piano.note2index('C3');
    let disabledChord = false;
    const update = () => {
        requestAnimationFrame(update);
        const isNormalPiano = selectMode();
        for(const [i, v] of pianoKeys.entries()) {
            const {x, w, h, isBlack, pressed, input} = v,
                  isPressed = keyboard.has(input),
                  {ctx} = isBlack ? cvBlackEffect : cvWhiteEffect;
            if(pressed) {
                if(isPressed) continue;
                v.pressed = false;
                ctx.clearRect(x, 0, w, h);
            }
            else {
                if(!isPressed) continue;
                v.pressed = true;
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.fillRect(x, 0, w, h);
                if(isNormalPiano) sf?.play({
                    ctx: audioNode.ctx,
                    destination: audioNode.note,
                    note: rpgen4.piano.note[c3 + i]
                });
            }
        }
        if(isNormalPiano) return;
        const keys = pianoKeys.slice(0, 12),
              chords = pianoKeys.slice(12),
              [key, chord] = [keys, chords].map(v => v.find(v => v.pressed)),
              isUnfulled = !(key && chord);
        if(disabledChord) {
            if(isUnfulled) disabledChord = false;
        }
        else {
            if(isUnfulled) return;
            disabledChord = true;
            playChord(key.chord, chord.chord);
        }
    };
    const getNotesOfChord = (note, chord) => {
        const root = rpgen4.piano.note2index(note);
        return chord.map(v => v + root).map(v => rpgen4.piano.note[v]);
    };
    const playChord = (note, chord, param = {}) => {
        for(const v of getNotesOfChord(rpgen4.chord.parse(`${note}3${chord}`))) sf?.play({
            ctx: audioNode.ctx,
            destination: audioNode.note,
            note: v,
            ...param
        });
    };
    Promise.all([
        'chord',
        'keyboard'
    ].map(v => `https://rpgen3.github.io/piano/list/${v}.txt`).map(fetchList)).then(([a, b]) => {
        for(const [i, v] of rpgen4.piano.keys.entries()) pianoKeys[(i + 9) % 12].chord = v;
        for(const [i, v] of a.entries()) pianoKeys[i + 12].chord = v;
        for(const [i, v] of b.entries()) {
            pianoKeys[i].input = v;
            pianoKeys[i].note = rpgen4.piano.note[c3 + i];
        }
        selectMode.elm.trigger('change');
        update();
    });
    {
        const {html} = addHideArea('auto chord');
        const selectSample = rpgen3.addSelect(html, {
            label: 'sample chord'
        });
        fetchList('https://rpgen3.github.io/piano/list/chordProgression.txt').then(v => {
            selectSample.update([
                [notSelected, notSelected],
                ...v.map(v => {
                    const a = v.split(' ');
                    return [a.slice(0, -1).join(' '), a.slice(-1)[0]];
                })
            ], notSelected);
        });
        selectSample.elm.on('change', () => {
            const v = selectSample();
            if(v !== notSelected) inputChord(v);
        });
        const inputChord = rpgen3.addInputStr(html, {
            label: 'input chord',
            textarea: true,
            save: true
        });
        rpgen4.resize(inputChord.elm.on('keydown', e => e.stopPropagation()));
        const inputBPM = rpgen3.addInputNum(html, {
            label: 'BPM',
            save: true,
            value: 135,
            min: 40,
            max: 400
        });
        const parseChord = () => {
            while(timeline.length) timeline.pop();
            const secBar = 60 / inputBPM() * 4,
                  frontChars = new Set('ABCDEFG=');
            for(const [i, str] of inputChord().split(/[\|\n→]/).entries()) {
                const when = i * secBar,
                      a = [];
                let flag = false;
                for(let i = 0; i < str.length; i++) {
                    const char = str[i];
                    if(!frontChars.has(char)) continue;
                    else if(str[i - 1] === '/') continue;
                    if(!flag) {
                        if(char === '=') continue;
                        else flag = true;
                    }
                    a.push(i);
                }
                if(!a.length) continue;
                const unitTime = secBar / a.length;
                let last = null;
                for(const [i, v] of a.entries()) {
                    const s = str.slice(v, i === a.length - 1 ? str.length : a[i + 1]).replace(/\s+/g,'');
                    console.log(s);
                    if(s[0] === '=') last.duration += unitTime;
                    else {
                        const key = s.slice(0, s[1] === '#' ? 2 : 1),
                              chord = s.slice(key.length);
                        last = {
                            key,
                            chord: chord === '' ? 'M' : chord,
                            when: when + i * unitTime,
                            duration: unitTime
                        };
                        timeline.push(last);
                    }
                }
            }
            const last = timeline[timeline.length - 1];
            endTime = last.when + last.duration;
        };
        const stop = () => {
            clearInterval(intervalId);
            cvWhiteEffect.clear();
            cvBlackEffect.clear();
        };
        rpgen3.addBtn(html, 'stop', stop).addClass('btn');
        rpgen3.addBtn(html, 'play', () => {
            stop();
            parseChord();
            startTime = audioNode.ctx.currentTime - timeline[0].when + coolTime;
            nowIndex = 0;
            intervalId = setInterval(playChordProgression);
        }).addClass('btn');
        const timeline = [],
              planTime = 0.1,
              coolTime = 0.5;
        let startTime = 0,
            endTime = 0,
            nowIndex = 0,
            intervalId = -1;
        const playChordProgression = () => {
            const time = audioNode.ctx.currentTime - startTime;
            if(time > endTime) return stop();
            while(nowIndex < timeline.length){
                const {key, chord, when, duration} = timeline[nowIndex],
                      _when = when - time;
                if(_when > planTime) break;
                nowIndex++;
                if(_when < 0) continue;
                const _key = `${key}3`,
                      _chord = rpgen4.chord[chord];
                playChord(key, _chord, {
                    when: _when,
                    duration
                });
                cvWhiteEffect.clear();
                cvBlackEffect.clear();
                if(selectMode()) {
                    for(const note of getNotesOfChord(_key, _chord)) {
                        const _v = pianoKeys.find(v => v.note === note);
                        const {x, w, h, isBlack} = _v,
                              {ctx} = isBlack ? cvBlackEffect : cvWhiteEffect;
                        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                        ctx.fillRect(x, 0, w, h);
                    }
                }
                else {
                    const _key = pianoKeys.slice(0, 12).find(v => v.chord === key),
                          _chord = pianoKeys.slice(12).find(v => v.chord === chord);
                    for(const v of [_key, _chord]) {
                        if(!v) continue;
                        const {x, w, h, isBlack} = v,
                              {ctx} = isBlack ? cvBlackEffect : cvWhiteEffect;
                        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                        ctx.fillRect(x, 0, w, h);
                    }
                }
            }
        };
    }
})();
