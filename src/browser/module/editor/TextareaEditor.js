import V from "../../../type/V.js";

export default class TextareaEditor {

    constructor(node) {
        let txt = node.get('txt') ?? '';

        this.v = new V({ tagName: 'textarea', class:['textareaEditor'], value: txt});
        this.v.on('keyup', (event) => {
            const newValue = event.target.value;
            if (txt === newValue) return;
            txt = newValue;
            node.set('txt', txt);
            e('nodeChange');
        });
    }
    show() { this.v.show(); }
    hide() { this.v.hide(); }
    getV() { return this.v; }
    close() { this.v.removeFromDom(); }
}