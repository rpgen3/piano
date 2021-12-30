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
            'resize'
        ].map(v => `https://rpgen3.github.io/piano/mjs/${v}.mjs`),
        [
            'chord',
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
            playChord(key.chord + 3, rpgen4.chord[chord.chord]);
        }
    };
    const playChord = (note, chord) => {
        const root = rpgen4.piano.note2index(note),
              a = chord.map(v => v + root).map(v => rpgen4.piano.note[v]);
        for(const v of a) sf?.play({
            ctx: audioNode.ctx,
            destination: audioNode.note,
            note: v
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
    (() => {
        const {html} = addHideArea('auto chord');
        const selectSample = rpgen3.addSelect(html, {
            label: 'sample chord'
        });
        selectSample.elm.on('change', () => {
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
        $('<dd>').appendTo(html);
        rpgen3.addBtn(html, 'play', () => {
            // coding now...
        }).addClass('btn');
    })();
})();
