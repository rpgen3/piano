onst s = new Set;
$(window)
    .on('keydown', ({key}) => (s.add(key), false))
    .on('keyup', ({key}) => (s.delete(key), false))
    .on('blur contextmenu mouseleave', () => s.clear());
export const keyboard = s;
