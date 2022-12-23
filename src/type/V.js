export default class V {

    constructor(data) { this.data = data || {}; }
    getId() { return this.dom.id; }

    on(eventName, callback) { this.getDOM().addEventListener(eventName, callback); }
    off(eventName, callback) { this.getDOM().removeEventListener(eventName, callback); }
    getValue() { return this.getDOM().value; }
    getVal() { return this.getValue(); }

    setDOM(dom) { this.dom = dom; }
    getDOM() {
        if (this.dom) return this.dom;

        this.dom = document.createElement(this.data.tagName || 'div');

        if (this.data.style) {
            for (let key in this.data.style) this.dom.style[key] = this.data.style[key];
        }

        if (this.data.id) this.dom.id = this.data.id;
        if (this.data.class) {
            if (Array.isArray(this.data.class)) {
                this.dom.className = this.data.class.join(' ');
            } else {
                this.dom.className = this.data.class;
            }
        }
        if (this.data.txt) this.dom.innerText = this.data.txt;
        if (this.data.value) this.dom.value = this.data.value;

        return this.dom;
    }

    getTxt() { return this.getDOM().innerText; }
    setTxt(txt) { this.getDOM().innerText = txt; }

    setAttr(k, v) {
        this.getDOM().setAttribute(k, v);
        return this;
    }
    removeAttr(k) { this.getDOM().removeAttribute(k); }
    getAttr(k) { return this.getDOM().getAttribute(k); }
    getHtml() { return this.getDOM().innerHTML; }
    setStyles(data) { for (let k in data) this.getDOM().style[k] = data[k]; }

    addShift() {
        let dom = this.dom;
        let x = dom.style.left ? parseInt(dom.style.left.replace('px', ''), 10) : 0
        let newX = (x + 100) + 'px';

        this.data.style.left = newX;
        dom.style.left = newX;
    }
    setCoords(x = 0, y = 0) {

        if (!this.data.style) this.data.style = {};

        if (x) {
            this.data.style.left = x + 'px';
            this.dom.style.left = x + 'px';
        }
        if (y) {
            this.data.style.top = y + 'px';
            this.dom.style.top = y + 'px';
        }
    }
    setSizes(width, height) {
        if (width) this.dom.style.width = width + 'px';
        if (height) this.dom.style.height = height + 'px';
    }
    getSizes() { return this.dom.getBoundingClientRect() }
    getSizesAbsolute() {
        let sizes = this.dom.getBoundingClientRect();
        let scrollX = window.scrollX;
        let scrollY = window.scrollY;

        return {
            bottom: sizes.bottom + scrollY,
            height: sizes.height,
            left: sizes.left + scrollX,
            right: sizes.right + scrollX,
            top: sizes.top + scrollY,
            width: sizes.width,
            x: sizes.x + scrollX,
            y: sizes.y + scrollY,
        }
    }
    getChildren() { return this.dom.children }
    getChildrenCount() { return this.dom.children.length }
    select() {
        this.dom.style.border = '2px solid black';
        this.dom.style.padding = '4px';
    }
    unselect() {
        this.dom.style.border = '1px solid black';
        this.dom.style.padding = '5px';
    }
    addClass(className) { this.getDOM().classList.add(className); }
    hasClass(className) { return this.dom.classList.contains(className); }
    removeClass(className) { this.getDOM().classList.remove(className); }
    isShowed() { return !this.isHidden(); }
    isHidden() { return this.dom.classList.contains('hidden'); }
    toggleDisplay() { this.getDOM().classList.toggle('hidden'); }
    show() { this.getDOM().classList.remove('hidden'); }
    hide() { this.getDOM().classList.add('hidden'); }
    visibilityHide() { this.getDOM().classList.add('visibilityHidden'); }
    isChecked() { return this.getDOM().checked; }
    removeFromDom() { this.dom.parentNode.removeChild(this.dom); }
    toggleEdit() {
        if (this.dom.contentEditable === 'true') {
            this.dom.removeAttribute('contentEditable');
            this.data.txt = this.dom.innerText;

            return false;
        } else {
            this.dom.contentEditable = 'true';
            this.dom.focus();

            return true;
        }
    }
    iEditMod() { this.getDOM().contentEditable = 'true' }
    oEditMode() { this.getDOM().contentEditable = 'false' }
    focus() { this.getDOM().focus(); }
    clear() { this.getDOM().innerHTML = ''; }

    parentDOM() { return this.getDOM().parentNode; }
    nextDOM() { return this.getDOM().nextSibling; }
    prevDOM() { return this.getDOM().previousSibling; }
    scrollDown() {
        const dom = this.getDOM();
        dom.scrollTop = dom.scrollHeight;
    }
}