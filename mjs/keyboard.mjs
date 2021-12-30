const s = new Set;
$(window)
    .on('keydown keyup', ({key, type}) => (type === 'keydown' ? s.add(key) : s.delete(key), false))
    .on('blur contextmenu mouseleave', () => s.clear());
export const keyboard = s;
