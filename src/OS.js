import {spawn, exec} from 'node:child_process';

export default class OS {
    constructor(logger) { this.logger = logger; }

    async run(cmd, detached = false, shell = false, childCallback = null, closeCallback = null) {

        let args = cmd.split(' ');
        let firstArg = args.shift();

        const proc = spawn(firstArg, args, {shell, detached});
        if (childCallback) await childCallback(proc);

        proc.stdout.on('data', (data) => this.logger.info(data.toString().trim()));
        proc.stderr.on('data', (data) => this.logger.error(data.toString().trim()));
        proc.on('error', (err) => this.logger.info(err.toString()));
        proc.on('close', (code) => {
            this.logger.info('Process close:', {code})
            if (closeCallback) closeCallback(code);
        });
    }

    async ex(cmd) {
        return new Promise((resolve, reject) => {
            exec(cmd, (err, stdout, stderr) => resolve({err, stdout, stderr}));
        });
    }
}