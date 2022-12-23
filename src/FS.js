import * as fs from 'node:fs';
import * as util from 'node:util';

export default class FS {

    readFileNative = util.promisify(fs.readFile);
    writeFileNative = util.promisify(fs.writeFile);
    renameNative = util.promisify(fs.rename);
    mkdir = util.promisify(fs.mkdir);
    open = util.promisify(fs.open);
    close = util.promisify(fs.close);

    async openFile(path, flags) { return await this.open(path, flags); }
    async closeFile(fd) { return await this.close(fd); }
    async readFile(path, encoding = 'utf8') {
        if (!encoding) return await this.readFileNative(path);
        return await this.readFileNative(path, encoding);
    }
    async writeFile(path, data) { return await this.writeFileNative(path, data); }
    async writeFileIfNotExistsCreate(path, data) {}
    async readFileIfNotExistsCreate(path, defaultValue = '') {
        if (!await this.exists(path)) {
            await this.writeFile(path, defaultValue);
            return defaultValue;
        }
        return await this.readFile(path);
    }
    async mv(oldPath, newPath) { return await this.renameNative(oldPath, newPath); }

    async readJSONIfNotExistsCreate(path) {
        if (!this.exists(path)) {
            await this.writeFile(path, '{}');
            return {};
        }
        return JSON.parse(await this.readFile(path, 'utf8'));
    }
    async watch(path) {
        const p = (await import("node:fs")).promises;
        return p.watch(path);
    }
    async exists(path) {
        try {
            const p = (await import("node:fs")).promises;
            await p.access(path);
            return true;
        } catch (e) {
            //logger.info(e);
            return false;
        }
    }
    async mkDir(path) { return await this.mkdir(path); }
    async readDir(path) {
        return new Promise((resolve) => {
            fs.readdir(path, (err, files) => resolve(files));
        });
    }

    async rm(path) {
        return new Promise((resolve) => {
            fs.rm(path, (error) => resolve(error));
        });
    }

    rmSync(path) { fs.rmSync(path); }
}