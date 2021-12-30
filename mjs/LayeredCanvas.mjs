export class LayeredCanvas {
    static init(html){
        this.html = html.css({
            position: 'relative',
            display: 'inline-block'
        }).empty().append($('<canvas>'));
    }
    constructor(){
        const {html} = LayeredCanvas;
        this.cv = $('<canvas>').appendTo(html).css({
            position: 'absolute',
            left: 0,
            top: 0
        });
        this.ctx = this.cv.get(0).getContext('2d');
    }
    clear(){
        const {width, height} = this.ctx.canvas;
        this.ctx.clearRect(0, 0, width, height);
    }
}
