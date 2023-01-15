export default class TabName {

    constructor(name, contextNode) {
        this.v = new s.V({class: 'tab'});

        this.name = new s.V({class: 'tabName', txt: name});
        e('>', [this.name, this.v]);

        this.closeBtn = new s.V({class: 'tabCloseBtn'});
        e('>', [this.closeBtn, this.v]);

        this.contextNodeId = contextNode.get('id');
    }
    hightLightErr() { this.v.addClass('error'); }
    unHightlightErr() { this.v.removeClass('error'); }

    getContextNodeId() { return this.contextNodeId; }
    activate() { this.v.addClass('active'); }
    deactivate() { this.v.removeClass('active'); }
    onTabClick(fn) { this.v.on('click', (e) => fn(e)); }
    onTabCloseClick(fn) { this.closeBtn.on('click', (e) => fn(e)); }
    close() { this.v.removeFromDom(); }
    getV() { return this.v; }
}