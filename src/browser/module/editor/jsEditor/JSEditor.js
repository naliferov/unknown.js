import HttpClient from "../../../../HttpClient.js";

export default class JSEditor {

    constructor(node) {
        this.node = node;
        this.v = new u.V({ class:['jsEditor'], id: this.getEditorDOMId()});
        this.isEditorInitiated = false;
    }
    getEditorDOMId() { return 'editor_' + this.node.get('id'); }
    initMonacoEditor() {
        if (this.isEditorInitiated) return;
        this.isEditorInitiated = true;

        this.editor = monaco.editor.create(document.getElementById(this.getEditorDOMId()), {
            value: this.node.get('js'),
            language: 'javascript',
            fontSize: '14px',
            theme: 'vs-light',
        });
        this.editor.getModel().onDidChangeContent(e => {
            const node = this.node;
            const js = this.editor.getValue();

            if (node.get('id') === 'unknown.js') { new HttpClient().post('/unknown', {js}); return; }

            try { eval(js); window.e('JsEvalResult', {error: 0}); }
            catch (e) {
                window.e('JsEvalResult', {error: e});
                return;
            }

            if (node.get('js') === js) return;
            node.set('js', js);
            new HttpClient().post('/k', {nodeId: node.get('id'), k: 'js', v: js});
        });
    }

    show() { this.v.show(); }
    hide() { this.v.hide(); }
    getV() { return this.v; }
    close() { this.v.removeFromDom(); }
}