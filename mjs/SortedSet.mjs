export class SortedSet extends Map {
    constructor(isDesc = false){
        super();
        this.isDesc = isDesc;
        this.origin = new Element(null);
        this.clear();
    }
    clear(){
        super.clear();
        const {origin} = this;
        origin.connect(origin);
    }
    add(value){
        if(this.has(value)) return;
        const e = new Element(value),
              {origin} = this;
        if(this.size) {
            let now = origin;
            while(true) {
                now = now.next;
                if(now === origin || now.value > value) {
                    now.prev.connect(e).connect(now);
                    break;
                }
            }
        }
        else e.connect(origin).connect(e);
        super.set(value, e);
    }
    delete(value){
        if(!this.has(value)) return;
        const {prev, next} = this.get(value);
        prev.connect(next);
        super.delete(value);
    }
    get min(){
        return this.origin.next.value;
    }
    get max(){
        return this.origin.prev.value;
    }
    [Symbol.iterator](){
        const {origin, isDesc} = this,
              way = isDesc ? 'prev' : 'next';
        let now = origin;
        return {
            next: () => {
                now = now[way];
                if(now === origin) return {done: true};
                else return {done: false, value: now.value};
            }
        };
    }
}
class Element {
    constructor(value){
        this.value = value;
        this.prev = null;
        this.next = null;
    }
    connect(elm){
        elm.prev = this;
        this.next = elm;
        return elm;
    }
}
