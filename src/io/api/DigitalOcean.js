import HttpClient from "../../HttpClient.js";

export default class DigitalOcean {

    constructor(apiToken) {
        this.httpClient = new HttpClient;
        this.apiToken = apiToken;
    }

    async rq(meth, params = {}, httpMethod = 'get') {
        const resp = await this.httpClient[httpMethod](`https://api.digitalocean.com/v2/${meth}`, params, {
            'Authorization': 'Bearer ' + this.apiToken,
        });
        return resp.data;
    }
    async regions() { return await this.rq('regions') }
    async sizes() { return await this.rq('sizes') }
    async images() { return await this.rq('images') }
    async sshKeys() { return await this.rq('account/keys') }
    async createDroplet() {
        return this.rq('droplets', {
            name: 'repl-js1',
            region: 'fra1',
            size: 's-1vcpu-512mb-10gb',
            image: 'ubuntu-22-04-x64',
            ssh_keys: [25974858],
        }, 'post');
    }
}