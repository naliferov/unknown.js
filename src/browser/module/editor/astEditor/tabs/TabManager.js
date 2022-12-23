//import AstSerializer from "../transform/AstSerializer.js";
import Tab from "./Tab.js";
import JSEditor from "../../jsEditor/JSEditor.js";

export default class TabManager {

    constructor(nodes, localState) {

        this.v = new u.V({class: 'tabManager'});

        this.tabsNamesBlock = new u.V({class: 'tabs'});
        e('>', [this.tabsNamesBlock, this.v]);
        this.tabsContentBlock = new u.V({class: 'tabsContent'});
        e('>', [this.tabsContentBlock, this.v]);

        this.nodes = nodes;

        this.tabs = new Map;
        this.localState = localState;
    }

    getTabByContextNode(node) { return this.tabs.get(node.get('id')); }
    openTab(node) {

        let openedTab = this.tabs.get(node.get('id'));
        if (openedTab && this.activeTab.getContextNodeId() === openedTab.getContextNodeId()) {
            return;
        }
        if (this.activeTab) this.activeTab.deactivate();

        if (openedTab) {
            openedTab.activate();
            this.activeTab = openedTab;
        } else {

            let editor = new JSEditor(node);

            const newTab = new Tab(node.get('name'), node, editor);
            newTab.onClick((e) => this.focusTab(node));
            newTab.onClickClose((e) => {
                e.stopPropagation();
                this.closeTab(newTab)
            });

            e('>', [newTab.getTabName().getV(), this.tabsNamesBlock]);

            this.activeTab = newTab;
            e('>', [this.activeTab.getEditor().getV(), this.tabsContentBlock]);
            newTab.activate();

            this.tabs.set(newTab.getContextNodeId(), newTab);
        }

        this.localState.openTab(this.activeTab.getContextNodeId());
        this.localState.setActiveTabId(this.activeTab.getContextNodeId());
    }

    focusTab(node) {
        const nodeId = node.get('id');
        const tab = this.tabs.get(nodeId);
        if (!tab) { console.log('tabId not found', nodeId); return; }

        if (this.activeTab) {
            if (this.activeTab.getContextNodeId() === tab.getContextNodeId()) {
                return;
            }
            this.activeTab.deactivate();
        }
        this.activeTab = tab;
        tab.activate();
        this.localState.setActiveTabId(tab.getContextNodeId());
    }

    ASTPrevVersion() {
        if (this.activeTab) this.activeTab.getEditor().switchASTToPrevVersion();
    }

    ASTNextVersion() {
        if (this.activeTab) this.activeTab.getEditor().switchASTToNextVersion();
    }

    closeTab(tab) {

        const contextUnitId = tab.getContextNodeId();
        const isActiveTab = this.activeTab && this.activeTab.getContextNodeId() === contextUnitId;

        if (isActiveTab) {
            for (let [_, tab] of this.tabs) {
                if (tab.getContextNodeId() === contextUnitId) continue;
                this.focusTab(tab.getContextNode());
                break;
            }
        }

        this.tabs.delete(contextUnitId);
        tab.close();

        this.localState.closeTab(contextUnitId);
    }

    async onKeyDown(e) {
        if (this.activeTab && this.activeTab.getEditor().onKeyDown) {
            this.activeTab.getEditor().onKeyDown(e);
        }
    }

    async onClick(e) {
        if (this.activeTab && this.activeTab.getEditor().onClick) {
            this.activeTab.getEditor().onClick(e);
        }
    }
    getActiveTab() { return this.activeTab; }
    getV() { return this.v }
}