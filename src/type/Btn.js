import V from "./V.js";

export default class Btn extends V {
    constructor(txt, style) {
        super({class: 'btn', txt, style});
    }
}