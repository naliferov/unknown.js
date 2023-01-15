(async() => {
    let gl = globalThis;
    if (!gl.s) gl.s = {};

    if (typeof window !== 'undefined') {
        gl.f = async id => {
            const j = await (await fetch(`/node?id=${id}`)).text(); //todo make pipe
            return await eval(j)();
        };
        navigator.serviceWorker.register('/sw').then(r => console.log('swRegistered')).catch(err => console.log('swNotRegistered', err))
        require.config({ paths: { 'vs': 'http://localhost:8080/node_modules/monaco-editor/min/vs' }});
        window.MonacoEnvironment = {
            getWorkerUrl: (workerId, label) => {
                return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                    self.MonacoEnvironment = { baseUrl: 'http://localhost:8080/node_modules/monaco-editor/min/' };
                    importScripts('http://localhost:8080/node_modules/monaco-editor/min/vs/base/worker/workerMain.js');`
                )}`;
            }
        };
        (new (await f('d75b3ec3-7f79-4749-b393-757c1836a03e'))).run();
        return;
    }
    if (typeof chrome !== 'undefined') {
        setInterval(() => {
            chrome.tabs.query({active: true}, t => {
                t.forEach(({id, url}) => {
                    url.includes('//www.youtube') || url.includes('//www.facebook') ? chrome.tabs.remove(id) : 0;
                });
            });
            console.log(new Date);
        }, 3000);
        return;
    }

    gl.f = async id => {
        const node = s.st[id]; if (!node) { console.error(`node not found by id [${id}]`); return; }
        try {
            if (!node.__js__) node.__js__ = eval(node.js);
            return node.__js__();
        } catch (e) { console.log(node.js); console.error(e); }
    };
    gl.g = id => {
        let node = s.st[id]; if (!node) return;
        return new Proxy(node, {
            get(t, k) { return t[k] },
            set(t, k, v) {
                t[k] = v;
                s.stup({m: '/k', nodeId: id, k, v});
                if (v === undefined || v === null) delete t[k];
                return true;
            }
        });
    }

    const p = (await import('node:process')).default;
    const cliArgs = (cliArgs => {
        const args = {};
        for (let i = 0; i < cliArgs.length; i++) {
            if (i < 2) continue; //skip node scriptName args

            let arg = cliArgs[i];
            let [k, v] = arg.split('=');
            if (!v) { args[i - 2] = arg; continue; }
            k = k.slice(2); //remove "--" characters
            args[k.trim()] = v.trim();
        }
        return args;
    })(p.argv);

    const fPath = p.argv[1].split('/');
    const selfId = fPath[fPath.length - 1];
    const port = parseInt(cliArgs.port ?? '8080', 10); if (!port) { console.log('cliArgs.port is not defined'); return; }
    const parentUrl = `http://127.0.0.1:${port - 1}`;
    const childUrl = `http://127.0.0.1:${port + 1}`;

    if (!s.netNodes) s.netNodes = {};
    if (!s.localProcs) s.localProcs = {};
    if (!s.updateIds) s.updateIds = {};
    if (!s.httpCustomHandler) s.httpCustomHandler = {};
    if (!s.eventSource) s.eventSource = {};
    if (!s.once) s.once = {}; const once = id => s.once[id] ? 0 : s.once[id] = 1;
    s.connectedRS = null;

    const {intervalProc, netNodeId, execNodeId} = cliArgs;

    if (intervalProc || s.intervalIteration || execNodeId) {
        s.st = await (await fetch(`${parentUrl}/st`)).json();
    } else {
        let fs = (await import('node:fs')).promises;
        s.st = JSON.parse(await fs.readFile('./state/nodes.json'));
    }

    s.self = g('30679c96-97cf-43a5-b6a7-23ffed109181');
    s.Logger = await f('20cb8896-bdf4-4538-a471-79fb684ffb86');
    s.log = new s.Logger;
    s.fs = new (await f('9f0e6908-4f44-49d1-8c8e-10e1b0128858'))(s.log);
    s.f = await f('dc9436fd-bec3-4016-a2f6-f0300f70a905');
    s.OS = await f('a4bc6fd6-649f-4709-8a74-d58523418c29');
    s.httpClient = await f('94a91287-7149-4bbd-9fef-1f1d68f65d70');
    s.EventSource = (await import('eventsource')).default;

    if (intervalProc || s.intervalIteration || execNodeId) {
        if (!s.localProcs.parent) s.localProcs.parent = new s.httpClient(parentUrl);

        if (intervalProc && !s.intervalIteration) {
            s.intervalIteration = 1;

            let can = 1, i, exit;

            const runInterval = () => {
                if (i) return;
                i = setInterval(async () => {
                    if (!can) return; can = 0;
                    try {
                        exit = setTimeout(() => { console.log('exit process after 30 seconds'); p.exit(0); }, 30000);
                        eval(await s.fs.readFile(selfId));
                        clearTimeout(exit);
                    } catch (e) {
                        console.error('try catch', e);
                        clearTimeout(exit);
                    }
                    can = 1;
                }, 2000);
            }
            p.on('unhandledRejection', (e) => {
                console.error('unhandledRejection interval err', e);
                clearInterval(i); i = 0;
                clearTimeout(exit); exit = 0;
                can = 1;
                setTimeout(runInterval, 500);
            });
            runInterval();
            return;
        }

    } else {

        p.on('unhandledRejection', e =>s.log.error(`unhandledRejection:`, e.stack));
        s.localProcs.child = new s.httpClient(childUrl);

        let saving;
        s.triggerDump = () => {
            if (saving) return;
            saving = setTimeout(async () => {
                await s.log.info('dumpNodesToDisc ' + s.f.getTimestamp());
                await s.fs.writeFile('./state/nodes.json', JSON.stringify(s.st));
                saving = 0;
            }, 1000);
        }
        const watchScripts = async () => {
            const watch = await s.fs.watch('scripts');
            for await (const e of watch) {
                if (e.eventType !== 'change') continue;
                const nodeId = e.filename.slice(0, -3);
                if (!s.st[nodeId]) continue;

                const node = s.st[nodeId];
                if (!node) continue;
                console.log('updateFromFS', node.id, node.name);
                const newJS = await s.fs.readFile('scripts/' + e.filename);
                if (node.js === newJS) { console.log('js already updated'); continue; }
                try {
                    const js = eval(newJS); if (js) node.__js__ = js;
                    node.js = newJS;
                    s.triggerDump();
                } catch (e) {
                    log.error(e.toString(), e.stack);
                }
            }
        }
        watchScripts();
        s.logMsgHandler = m => {
            if (!s.connectedRS) return;

            const msg = JSON.stringify({m});
            s.connectedRS.write(`data: ${msg} \n\n`);
        }
        s.log.onMessage(m => s.logMsgHandler(m));

        const parseRqBody = async (rq) => {
            return new Promise((resolve, reject) => {
                let b = [];
                rq.on('data', chunk => b.push(chunk)); rq.on('error', err => reject(err));
                rq.on('end', () => {
                    b = Buffer.concat(b);
                    if (rq.headers['content-type'] === 'application/json') {
                        b = JSON.parse(b.toString());
                    }
                    resolve(b);
                });
            });
        }
        const resolveStatic = async (rq, rs) => {
            const lastPart = rq.pathname.split('/').pop();
            const split = lastPart.split('.');
            if (split.length < 2) return false;

            const extension = split[split.length - 1]; if (!extension) return;
            try {
                const file = await s.fs.readFile('.' + rq.pathname, null);
                const m = {
                    html: 'text/html', js: 'text/javascript', css: 'text/css', map: 'application/json',
                    woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf',
                };
                if (m[extension]) rs.setHeader('Content-Type', m[extension]);
                rs.setHeader('Access-Control-Allow-Origin', '*');
                rs.end(file);
                return true;
            } catch (e) {
                log.info(e.toString(), {path: e.path, syscall: e.syscall});
                return false;
            }
        }
        s.httpCustomHandler.x = async (rq, rs) => {
            const m = {
                'GET:/': async () => rs.s(await f('ed85ee2d-0f01-4707-8541-b7f46e79192e'), 'text/html'),
                'GET:/unknown': async () => rs.s(await s.fs.readFile(selfId)),
                'POST:/unknown': async () => await s.fs.writeFile(selfId, (await parseRqBody(rq)).js),
                'GET:/sw': async () => rs.s(await f('ebac14bb-e6b1-4f6c-95ea-017a44a0cc28'), 'text/javascript'),
                'GET:/pwaManifest': async () => rs.s(await f('fb362554-78e4-44e3-8beb-bf603aa6ef3f'), 'application/json'),
                'GET:/node': () => {
                    if (!rq.query.id) { rs.s('id is empty'); return; }
                    const node = g(rq.query.id);
                    if (node && node.js) rs.s(node.js, 'text/javascript; charset=utf-8');
                    else rs.s('script not found');
                },
                'GET:/consoleMonitor': () => {
                    s.log.info('SSE connected');
                    s.connectedRS = rs;
                    rs.writeHead(200, {'Content-Type': 'text/event-stream', 'Connection': 'keep-alive', 'Cache-Control': 'no-cache'});
                    rs.write(`data: EventSource connected \n\n`);
                    rq.on('close', () => { s.connectedRS = 0; s.log.info('SSE closed'); });
                },
            }
            if (await resolveStatic(rq, rs)) return;
            if (m[rq.mp]) { await m[rq.mp](); return; }
            rs.s('page not found');
        }

        const runIntervalProc = async () => {

            const procLogger = new s.Logger('mp: ');
            procLogger.onMessage(m => s.logMsgHandler(m));
            const os = new s.OS(procLogger);
            os.run(`node ${selfId} --port=${port + 1} --intervalProc=1`, false, false, null, (code) => {
                s.log.error('intervalProc closed......');
                setTimeout(runIntervalProc, 2000);
            });
        }
        runIntervalProc();
    }

    if (!s.u) {
        s.u = 1;
        s.stup = async up => {
            if (!s.intervalIteration && !execNodeId && up.m === '/k' && up.k === 'js' && up.v) {
                await s.fs.writeFile(`scripts/${up.nodeId}.js`, up.v);
            }
            await (await f('03454982-4657-44d0-a21a-bb034392d3a6'))(up, s.netNodes, s.localProcs, s.updateIds, f, s.triggerDump);
        }
        let u = await f('4b60621c-e75a-444a-a36e-f22e7183fc97');
        await u({httpCustomHandler: s.httpCustomHandler, port, selfProcess: p, stUpdateHandler: s.stup, st: s.st});
    }
    if (execNodeId) { console.log(`execNodeId: ${execNodeId}`); await f(execNodeId); return; }
    if (!s.intervalIteration) return;

    //console.log(new Date);
    //if (once('1')) await f('a28c97ba-edc0-4670-8902-cd40eca8d451');

    //localProcs
    let conf = [
        //{name: 'tlEditor', nodeId: 'bcc07804-c1bc-472d-a599-e4f5a3174300'},
        //{name: 'rt', nodeId: '23d3c114-f8a4-4f8f-929b-405da29fa9d0'},
    ];
    for (let i = 0; i < conf.length; i++) {
        const v = conf[i];

        const procPort = port + 1;
        if (!s[v.name]) {
            const c = `node ${selfId} --port=${procPort} --execNodeId=${v.nodeId}`;
            const os = new s.OS(new s.Logger(`${v.name}: `));
            os.run(c, false, false, proc => s[v.name] = proc, code => console.log(`${v.name} stoped`));
            s[v.name] = 1;
        }
         try {
             if (!s.localProcs[v.name]) s.localProcs[v.name] = new s.httpClient(`http://127.0.0.1:${procPort}`);

             const r = await s.localProcs[v.name].get('/ping'); //console.log('http to ' + v.name, r.data);
        } catch (e) {
            console.log(`httpRQ to ${v.name} fails`); 
        }
    }

    //const netNodesLogic = await f('f877c6d7-e52a-48fb-b6f7-cf53c9181cc1');
    //console.log(netNodesLogic);
})();