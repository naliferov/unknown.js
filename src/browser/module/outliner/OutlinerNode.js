import {uuid} from "../../../F.js";

export default class OutlinerNode {

    constructor(node, isRoot) {
        this.node = node;

        this.domId = uuid();
        window.outlinerPool.set(this.domId, this);
        this.v = new s.V({id: this.domId, class: ['node']});

        if (!isRoot) {
            const container = new s.V({class: ['nodeContainer', 'flex']});
            e('>', [container, this.v]);

            this.dataV = new s.V({class: 'dataUnit', txt: node.get('name')});
            this.dataV.setAttr('outliner_node_id', this.domId);
            this.dataV.toggleEdit();
            e('>', [this.dataV, container]);

            const id = new s.V({txt: 'ID', style: {marginLeft: '10px'}});
            id.on('click', () => navigator.clipboard.writeText(node.get('id')));
            e('>', [id, container]);
        }

        this.nodesV = new s.V({class: ['subNodes', 'shift']});
        e('>', [this.nodesV, this.v]);
    }
    updateNameInContextNode() { this.getContextNode().set('name', this.dataV.getTxt().trim()) }
    getDomId() { return this.domId }
    isEmpty() { return !this.nodesV.getDOM().children.length }
    isInRoot() { return this.getParent().isRoot }
    markAsRootNode() { this.isRoot = true }
    getParent() { return window.outlinerPool.get(this.v.parentDOM().parentNode.id) }
    next() {
        const next = this.v.getDOM().nextSibling;
        return next ? window.outlinerPool.get(next.id) : null;
    }
    prev() {
        const previous = this.v.getDOM().previousSibling;
        return previous ? window.outlinerPool.get(previous.id) : null;
    }
    getContextNode() { return this.node }
    getV() { return this.v }
    getNodesV() { return this.nodesV}
    removeSubNodesShift() { this.nodesV.removeClass('shift'); }
    focus() { this.dataV.focus(); }
}