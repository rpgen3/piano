const elm = $('<textarea>').appendTo('body'),
      minW = elm.width(),
      minH = elm.height();
elm.remove();
export const resize = elm => {
    const f = () => myFunc(elm);
    f();
    $(window).on('resize', f);
    elm.on('keyup click change', f);
    return elm;
};
const fontSize = 16;
const myFunc = elm => {
    const ar = elm.val().split('\n'),
          parent = elm.parent();
    elm.css({
        fontSize,
        width: Math.max(minW, Math.min(elm.parent().width(), fontSize * Math.max(...ar.map(v => v.length)))),
        height: Math.max(minH, Math.min($(window).height(), fontSize * ar.length))
    });
};
