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
            'keyboard'
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
    SoundFont_surikov_list.init();
    {
        const {html} = addHideArea('play piano');
        const selectMode = rpgen3.addSelect(html, {
            label: 'piano mode',
            save: true,
            list: {
                'chord piano': true,
                'normal piano': false
            }
        });
        selectMode.elm.on('change', () => {
            cvSymbol.clear();
            if(!selectMode()) return;
            for(const key of pianoKeys) {
                1;
            }
        });
        setTimeout(() => selectMode.elm.trigger('change'));
    }
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
              key = {w: 50, h: 200},
              keyBlack = {w: 30, h: 100};
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
                      space = w - 1;
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
    const playChord = (note, chord, inversion) => {
        audioNode.init();
        const root = rpgen4.piano.note2index(note),
              a = rpgen4.inversion(chord, inversion).map(v => v + root).map(v => rpgen4.piano.note[v]);
        for(const v of a) sf?.play({
            ctx: audioNode.ctx,
            destination: audioNode.note,
            note: v
        });
    };
    const update = () => {
        requestAnimationFrame(update);
        for(const [i, v] of pianoKeys.entries()) {
            const {x, w, h, isBlack, pressed, key} = v,
                  isPressed = keyboard.has(key),
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
            }
        }
    };
    fetchList('https://rpgen3.github.io/piano/list/keys.txt').then(list => {
        for(const [i, v] of pianoKeys.entries()) v.key = list[i];
        update();
    });
})();
