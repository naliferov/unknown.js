import FS from "../FS.js";

export default class PersistObject {

    constructor(path) {
        this.fs = new FS;
        this.path = path;
        this.obj = {};
    }

    async init() {
        if (this.initiated) return;

        if (await this.fs.exists(this.path)) {
            this.obj = JSON.parse(await this.fs.readFile(this.path));
        } else {
            await this.fs.writeFile(this.path, '{}');
        }
        this.initiated = true;
    }

    async s(k, v) {
        if (!this.initiated) await this.init();
        this.obj[k] = v;
        await this.fs.writeFile(this.path, JSON.stringify(this.obj));
    }

    async g(k) {
        if (!this.initiated) await this.init();
        return this.obj[k];
    }

    async d(k) {
        if (!this.initiated) await this.init();
        delete this.obj[k];
        await this.fs.writeFile(this.path, JSON.stringify(this.obj));
    }
}