export default class Logger {

    constructor(prefix = '') { this.prefix = prefix; }

    onMessage(handler) { this.handler = handler; }
    logDateTime() { this.logDateTime = true; }

    // async enableLoggingToFile(logFile) {
    //     this.file = await this.fs.openFile(logFile, 'a');
    //     await this.fs.writeFile(this.file, '\n')
    // }
    // async disableLoggingToFile() { await this.fs.closeFile(this.file); }

    async log(msg, object) {
        const isMsgObject = typeof msg === 'object';
        let logMsg = '';

        if (isMsgObject) {
            logMsg = msg;
        } else {
            logMsg = this.prefix + (msg.toString ? msg.toString() : msg);
        }

        object ? console.log(logMsg, object) : console.log(logMsg);
        if (this.handler) this.handler(logMsg, object);
    }
    async info(msg, object = null) { await this.log(msg, object); }
    async error(msg, object = null) { await this.log(msg, object); }
}