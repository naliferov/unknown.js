export default class HttpClient {

    constructor(baseURL = '', headers = {}) {
        if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
        if (baseURL) this.baseURL = baseURL;
    }

    async rq(method, url, params, headers, options = {}) {
        let timeoutId;
        const controller = new AbortController();
        if (options.timeout) timeoutId = setTimeout(() => controller.abort(), options.timeout);

        if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';


        const fetchParams = {method, headers, signal: controller.signal};

        if (method === 'POST') {
            fetchParams.body = headers['Content-Type'] === 'application/json' ? JSON.stringify(params) : this.strParams(params);
        } else {
            if (Object.keys(params).length > 0) url += '?' + new URLSearchParams(params);
        }

        const response = await fetch(this.baseURL ? this.baseURL + url : url, fetchParams);

        if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }


        let res = { statusCode: response.status, headers: response.headers };
        if (options.blob) res.data = await response.blob();
        else {
            const contentType = response.headers.get('content-type') ?? '';
            res.data = contentType.startsWith('application/json') ? await response.json() : await response.text();
        }
        return res;
    }

    async get(url, params = {}, headers = {}, options = {}) { return await this.rq('GET', url, params, headers, options); }
    async post(url, params = {}, headers = {}, options = {}) { return await this.rq('POST', url, params, headers, options); }
    async delete(url, params = {}, headers = {}, options = {}) { return await this.rq('DELETE', url, params, headers, options); }

    strParams(params) {
        let str = '';
        for (let i in params) str = str + i + '=' + params[i] + '&';
        if (str.length > 0) return str.substring(0, str.length - 1);
        return str
    }
}