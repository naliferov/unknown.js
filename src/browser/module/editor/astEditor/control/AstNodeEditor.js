import Inserter from "../nodes/Inserter.js";
import ForConditionPartInternal from "../nodes/conditionAndBody/loop/ForConditionPartInternal.js";
import Id from "../nodes/id/Id.js";
import Keyword from "../nodes/Keyword.js";
import Op from "../nodes/Op.js";
import If from "../nodes/conditionAndBody/if/If.js";
import For from "../nodes/conditionAndBody/loop/For.js";
import Call from "../nodes/conditionAndBody/call/call/Call.js";
import Callable from "../nodes/conditionAndBody/call/callable/Callable.js";
import ArrayChunk from "../nodes/literal/array/ArrayChunk.js";
import ObjectNode from "../nodes/literal/object/ObjectNode.js";
import Literal from "../nodes/literal/Literal.js";
import ArrayItemParts from "../nodes/literal/array/ArrayItemParts.js";
import CallableConditionPartInternal from "../nodes/conditionAndBody/call/callable/CallableConditionPartInternal.js";
import CallConditionPartInternal from "../nodes/conditionAndBody/call/call/CallConditionPartInternal.js";
import SubId from "../nodes/id/SubId.js";
import SubIdContainer from "../nodes/id/SubIdContainer.js";
import Module from "../nodes/module/Module.js";

const MODE_INSERT = 'insert';
const MODE_EDIT = 'edit';

export default class AstNodeEditor {

    resetState() { this.node = null; this.mode = null; }
    isActive() { return this.node && this.mode; }

    createEditNode(fxController) {
        this.node = new Inserter;
        this.mode = MODE_INSERT;
        this.node.iEditTxt();

        this.processNodeInput(this.node, fxController);
        return this.node;
    }

    editNode(node, astEditor) {

        if (node instanceof Id ||
            node instanceof Op ||
            node instanceof Literal
        ) {
            this.mode = MODE_EDIT;
            this.node = node;
            this.node.iEditTxt();
        } else return;

        e('astNodeEditModStart');
        this.processNodeInput(node, astEditor);
    }

    insertNewChunk(newChunk, insertAgain = false, astEditor) {

        const node = this.node;

        e('>after', [newChunk.getV(), node.getV()]);
        astEditor.removeChunk(node);
        astEditor.unmarkAll().mark(newChunk);

        if (insertAgain) {
            const newInserter = this.createEditNode(astEditor);
            const nextChunk = newChunk.getNextChunk();
            if (nextChunk) {
                newChunk.getParentChunk().insertBefore(newInserter, nextChunk);
            } else {
                newChunk.getParentChunk().insert(newInserter);
            }

            astEditor.unmarkAll().mark(newInserter);
            newInserter.focus();
        }
    }

    processNodeInput(node, astEditor) {

        let isCaretOnLastChar = false;

        const keyDown = (e) => {

            const key = e.key;

            const offset = document.getSelection().focusOffset;
            const text = this.node.getTxt();
            isCaretOnLastChar = offset && text.trim().length > 0 && text.length === offset;

            if (key === 'Escape') {

                const prevChunk = node.getPrevChunk();
                const parentChunk = node.getParentChunk();
                let chunk;

                if (this.mode === MODE_INSERT) {

                    astEditor.removeChunk(node);
                    chunk = prevChunk ? prevChunk: parentChunk;

                    if (parentChunk instanceof ForConditionPartInternal) {

                        const forConditionPart = parentChunk.getParentChunk();
                        const prevForConditionPart = forConditionPart.getPrevChunk();
                        const nextForConditionPart = forConditionPart.getNextChunk();

                        if (parentChunk.isEmpty()) {

                            const For = forConditionPart.getParentChunk().getParentChunk();
                            astEditor.removeChunk(forConditionPart);

                            if (For.getCondition().isEmpty()) {
                                chunk = For;
                            } else {
                                chunk = prevForConditionPart ? prevForConditionPart.getLastChunk() : nextForConditionPart.getFirstChunk();
                            }

                        } else if (prevChunk) {
                            chunk = prevChunk;
                        } else {
                            chunk = forConditionPart;
                        }

                    } else if (parentChunk instanceof CallConditionPartInternal) {
                        if (parentChunk.isEmpty()) {
                            const callConditionPart = parentChunk.getParentChunk();
                            const callCondition = callConditionPart.getParentChunk();
                            astEditor.removeChunk(callConditionPart);

                            //todo can instead search for prev or next callConditionPart
                            chunk = callCondition.getParentChunk();
                        }
                    }
                    else if (parentChunk instanceof CallableConditionPartInternal) {
                        if (parentChunk.isEmpty()) {
                            const callableConditionPart = parentChunk.getParentChunk();
                            const callableCondition = callableConditionPart.getParentChunk();
                            astEditor.removeChunk(callableConditionPart);
                            chunk = callableCondition;
                        }
                    } else if (parentChunk instanceof ArrayItemParts) {

                        const arrayItem = parentChunk.getParentChunk();
                        const prevArrayItem = arrayItem.getPrevChunk();
                        const nextArrayItem = arrayItem.getNextChunk();
                        const arrayBody = arrayItem.getParentChunk();

                        if (parentChunk.isEmpty()) {
                            astEditor.removeChunk(arrayItem);

                            if (arrayBody.isEmpty()) {
                                chunk = arrayBody.getParentChunk();
                            } else {
                                if (prevArrayItem) chunk = prevArrayItem;
                                if (nextArrayItem) chunk = nextArrayItem;
                            }

                        } else if (prevChunk) {
                            chunk = prevChunk;
                        } else {
                            chunk = arrayItem;
                        }
                    } else if (parentChunk instanceof SubIdContainer) {
                        if (parentChunk.isEmpty()) {
                            const subId = parentChunk.getParentChunk();
                            chunk = subId.getPrevChunk() ?? subId.getNextChunk();
                            astEditor.removeChunk(subId);
                        }
                    }

                    if (chunk && !(chunk instanceof Module)) {
                        astEditor.unmarkAll().mark(chunk);
                    }

                } else if (this.mode === MODE_EDIT) {
                    node.oEditTxt();
                    node.iKeydownDisable(keyDown);
                    node.iKeyupDisable(keyUp);
                    astEditor.save();
                }

                this.resetState();
                setTimeout(() => window.e('astNodeEditModStop'), 200);
            } else if (key === 'Enter') {

                e.preventDefault();

                if (this.mode === MODE_INSERT) {
                    const chunk = this.getNewASTNodeByTxt(this.node.getTxt());
                    if (chunk) this.insertNewChunk(chunk, false, astEditor);
                    if (chunk instanceof Op && chunk.getTxt() === '!') chunk.hideSpaces();

                    const parent = chunk.getParentChunk();
                    if (chunk instanceof Id && parent && parent.getParentChunk() instanceof SubId) {
                        astEditor.unmarkAll().mark(parent.getParentChunk());
                    }

                } else if (this.mode === MODE_EDIT) {

                    const newNode = this.getNewASTNodeByTxt(node.getTxt());
                    if (
                        (newNode.constructor.name !== node.constructor.name) ||
                        (newNode instanceof Literal && node instanceof Literal && newNode.getType() !== node.getType())
                    ) {
                        window.e('>before', [newNode.getV(), node.getV()]);
                        astEditor.removeChunk(node);
                        astEditor.unmarkAll().mark(newNode);
                    } else {
                        node.oEditTxt();
                        node.iKeydownDisable(keyDown);
                        node.iKeyupDisable(keyUp);
                    }
                }

                this.resetState();
                setTimeout(() => window.e('astNodeEditModStop'), 200);
                astEditor.save();
            }
        };
        const keyUp = (e) => {
            const isArrowRight = e.key === 'ArrowRight';
            const isSpace = e.key === ' ';
            if (isCaretOnLastChar && (isArrowRight || isSpace)) {
                const chunk = this.getNewASTNodeByTxt(this.node.getTxt());
                if (chunk) this.insertNewChunk(chunk, true, astEditor);
            }
        }

        node.iKeydownEnable(keyDown);
        node.iKeyupEnable(keyUp);
    }

    getNewASTNodeByTxt(t) {

        if (!t.length) return;
        t = t.trim();

        if (t === 'return') return new Keyword('return');
        if (t === '=') return new Op('=');
        if (t === '==') return new Op('==');
        if (t === '===') return new Op('===');
        if (t === '!') return new Op('!');
        if (t === '+') return new Op('+');
        if (t === '++') return new Op('++');
        if (t === '-') return new Op('-');
        if (t === '--') return new Op('--');
        if (t === '*') return new Op('*');
        if (t === '/') return new Op('/');
        if (t === '>') return new Op('>');
        if (t === '>=') return new Op('>=');
        if (t === '<') return new Op('<');
        if (t === '<=') return new Op('<=');

        if (t === 'if') return new If();
        if (t === 'for') return new For();
        if (t === '(') return new Call();
        if (t === '=>') return new Callable();
        if (t === '[') return new ArrayChunk();
        if (t === '{') return new ObjectNode();

        const num = Number(t);
        if (!isNaN(num)) return new Literal(t, 'number');
        if (t[0] === "'") return new Literal(t, 'string');

        return new Id(t);
    }

}