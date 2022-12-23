import {cloneObject, uuid} from "../../../F.js";
import OutlinerNode from "./OutlinerNode.js";
import HttpClient from "../../../HttpClient.js";
import Node from "../../../type/Node.js"

export default class NodesPanel {

    constructor() { this.v = new u.V({class: 'nodes'}); }
    getV() { return this.v; }

    async init() {
        const nodes = (await (new HttpClient).get('/st')).data;

        const rootNode = new Node;
        rootNode.set('nodes', nodes);

        const outlinerRootNode = new OutlinerNode(rootNode, true);
        outlinerRootNode.removeSubNodesShift();
        outlinerRootNode.markAsRootNode();

        this.outLinerRootNode = outlinerRootNode;
        e('>', [outlinerRootNode, this.getV()]);

        const js = (await (new HttpClient).get('/unknown')).data;
        const outlinerXNode = new OutlinerNode(new Node({id: 'unknown', name: 'unknown', js}));
        e('>', [outlinerXNode.getV(), outlinerRootNode.getNodesV()]);

        const render = (outlinerNode, isRootNode) => {

            const node = outlinerNode.getContextNode();
            const subNodes = node.get('nodes');
            if (!node.get('open') && !isRootNode) outlinerNode.getNodesV().hide();

            for (let i in subNodes) {
                const newNode = new Node(subNodes[i]);
                const newOutlinerNode = new OutlinerNode(newNode);
                e('>', [newOutlinerNode.getV(), outlinerNode.getNodesV()]);

                window.nodesPool.set(newNode.get('id'), newNode);
                window.outlinerPool.set(newOutlinerNode.getDomId(), newOutlinerNode);
            }
        }
        render(outlinerRootNode, true);
    }

    isEmpty() { return this.outLinerRootNode.isEmpty()}
    getNodeById(id) { return window.nodesPool.get(id); }
    getOutlinerNodeById(id) { return window.outlinerPool.get(id); }

    async handleKeyDown(e) {

        if (!e.target.classList.contains('dataUnit')) return;

        const outlinerNode = this.getOutlinerNodeById(e.target.getAttribute('outliner_node_id'));
        if (!outlinerNode) { console.log('outlinerNode not found'); return; }

        const node = outlinerNode.getContextNode();
        if (node.get('id') === 'x.js') return;

        const k = e.key;
        const ctrl = e.ctrlKey || e.metaKey;

        if (k === 'Enter') {
            e.preventDefault();
            this.copy(outlinerNode);
        } else if (k === 'Tab') {
            e.preventDefault();
            // if (e.shiftKey) {
            //     const parent = outlinerNode.getParent();
            //     window.e('>after', [outlinerNode.getV(), parent.getV()]);
            // } else if (outlinerNode.prev()) {
            //     window.e('>', [outlinerNode.getV(), outlinerNode.prev().getNodesV()]);
            // }

        } /*else if (ctrl && k === 'ArrowUp' && outlinerNode.prev()) {
            window.e('>after', [outlinerNode.prev().getV(), outlinerNode.getV()]);
        } else if (ctrl && k === 'ArrowDown' && outlinerNode.next()) {
            window.e('>after', [outlinerNode.getV(), outlinerNode.next().getV()]);
        } */else if (ctrl && k === 'v') {
            setTimeout(() => {
                outlinerNode.updateNameInContextNode();
                this.save();
            }, 200);
            return;
        } else {
            return;
        }

        e.target.focus();
        await this.save();
    }

    async handleKeyUp(e) {

        if (!e.target.classList.contains('dataUnit')) return;

        const ignoreKeys = ['Enter', 'Tab', 'Control', 'Meta', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
        if (new Set(ignoreKeys).has(e.key)) return;

        const outlinerNode = this.getOutlinerNodeById(e.target.getAttribute('outliner_node_id'));
        const node = outlinerNode.getContextNode();
        if (node.get('id') === 'x.js') return;
        node.set('name', e.target.innerText);

        if (e.target.innerText.length === 0) {

            const calcSubUnits = (nodesArr) => {
                let c = 0;
                for (let i = 0; i < nodesArr.length; i++) {
                    c++;
                    const node = nodesArr[i];
                    if (node.get) c += node.get('nodes') ? calcSubUnits(node.get('nodes')) : 0;
                    else c += node.nodes ? node.nodes.length : 0;
                }
                return c;
            }
            const totalNodes = node.get('nodes') ? calcSubUnits(node.get('nodes')) : 0;
            if (totalNodes > 5) {
                if (confirm(`Really want to delete element with [${totalNodes}] nodes?`)) this.delete(outlinerNode);
            } else {
                this.delete(outlinerNode);
            }

        } else {
            await new HttpClient().post('/k', {nodeId: node.get('id'), k: 'name', v: node.get('name')});
        }
    }

    async handleDblClick(e) {

        if (e.target.classList.contains('dataUnit')) {
            let node = this.getOutlinerNodeById(e.target.getAttribute('outliner_node_id')).getContextNode();
            window.e('openNode', {node});
            return;
        }
        if (!e.target.classList.contains('openClose')) return;

        await this.save();
    }

    copy(outlinerNode) {
        let nodeData = cloneObject(outlinerNode.getContextNode().getData());
        nodeData.id = uuid();
        if (nodeData.name) nodeData.name += '_copy';
        delete nodeData.nodes;

        const newNode = new Node(nodeData);
        const newOutlinerNode = new OutlinerNode(newNode);

        e('>after', [newOutlinerNode.getV(), outlinerNode.getV()]);
        window.outlinerPool.set(newOutlinerNode.getDomId(), newOutlinerNode);
        (new HttpClient).post('/cn', {node: newNode.getData()});

        setTimeout(() => newOutlinerNode.focus(), 100);
    }

    create(outlinerNode) {
        const newNode = new Node({id: uuid(), name: 'New node'});
        const newOutlinerNode = new OutlinerNode(newNode);
        e('>', [newOutlinerNode.getV(), outlinerNode.getNodesV()]);
        window.outlinerPool.set(newOutlinerNode.getDomId(), newOutlinerNode);
    }

    delete(outlinerNode) {

        const rqParams = {
            nodeId: outlinerNode.getContextNode().get('id'),
        };

        const parent = outlinerNode.getParent();
        if (!parent.isRoot) rqParams.parentNodeId = parent.getContextNode().get('id');

        const subNodes = parent.getNodesV().getChildren();

        for (let i = 0; i < subNodes.length; i++) {
            if (subNodes[i].id === outlinerNode.getDomId()) {
                rqParams.nodeIndex = i; break;
            }
        }
        (new HttpClient).post('/dn', rqParams);

        window.nodesPool.delete(outlinerNode.getContextNode().get('id'));
        window.outlinerPool.delete(outlinerNode.getDomId());
        outlinerNode.getV().removeFromDom();
    }

    async save() {

        const getNodesData = (outlinerNode) => {

            const r = [];

            for (let outlinerNodeDom of outlinerNode.getNodesV().getDOM().children) {

                const outlinerNode = window.outlinerPool.get(outlinerNodeDom.getAttribute('id'));
                const node = outlinerNode.getContextNode();

                let data = {id: node.get('id'), name: node.get('name')};
                if (node.get('open')) data.open = true;

                const subNodes = getNodesData(outlinerNode);
                if (subNodes.length > 0) data.nodes = subNodes;
                if (node.get('AST')) data.AST = node.get('AST');
                if (node.get('txt')) data.txt = node.get('txt');
                if (node.get('js')) data.js = node.get('js');

                r.push(data);
            }
            return r;
        }
    }
}