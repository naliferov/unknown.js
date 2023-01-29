globalThis.s ??= {};
(async() => {
    let f
    s.pa = async (...args) => {
        let r;
        for (let i = 0; i < args.length; i++) r = await eval(`async () => ${args[i]}`) ();
        return r;
    }
    s.execJS = id => {
        const n = s.st[id]; if (!n) { console.error(`node not found by id [${id}]`); return; }
        try {
            if (!n.__js__) n.__js__ = eval(n.js);
            return n.__js__();
        } catch (e) { console.log(n.id); console.error(e); }
    }

    if (typeof window !== 'undefined') {
        f = async (id, forceRequest) => {
            if (forceRequest) return s.pa(`fetch('/node?id=${id}')`, 'r.text()', 'eval(r)()');
            return s.execJS(id);
        }
        s.st = await (await fetch('/st')).json();
        (new (await f('d75b3ec3-7f79-4749-b393-757c1836a03e'))).run();
        return;
    }
    f = async id => s.execJS(id);

    s.p = (await import('node:process')).default;
    s.p.cliArgs = (cliArgs => {
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
    })(s.p.argv);
    const selfId = s.p.argv[1].split('/').at(-1);
    const port = parseInt(s.p.cliArgs.port ?? '8080', 10); if (port === undefined) { console.log('cliArgs.port is not defined'); return; }
    const parentUrl = `http://127.0.0.1:${port - 1}`;
    const childUrl = `http://127.0.0.1:${port + 1}`;

    s.slicers ??= {};
    s.httpSlicer ??= {};
    s.intervalChildProcess ??= null;
    s.netNodes ??= {};
    s.netProcs ??= {};
    s.updateIds ??= {};
    s.eventSource ??= {};
    s.connectedRS = null;
    s.onceDB ??= {};
    s.once = id => s.once[id] ? 0 : s.once[id] = 1;

    const {netNodeId, DE, procManager, procNodeId} = s.p.cliArgs;

    if (DE) s.st = await s.pa('import("node:fs")', 'r.promises', 'r.readFile("./state/nodes.json")', 'JSON.parse(r)');
    else s.st = await (await fetch(`${parentUrl}/st`)).json();

    s.isMainNode = netNodeId === 'main';
    s.Logger = await f('20cb8896-bdf4-4538-a471-79fb684ffb86');
    s.log = new s.Logger;
    s.fs = new (await f('9f0e6908-4f44-49d1-8c8e-10e1b0128858'))(s.log);
    s.f = await f('dc9436fd-bec3-4016-a2f6-f0300f70a905');
    s.OS = await f('a4bc6fd6-649f-4709-8a74-d58523418c29');
    s.httpClient = await f('94a91287-7149-4bbd-9fef-1f1d68f65d70');
    s.EventSource = (await import('eventsource')).default;

    if (DE) {
        s.p.on('unhandledRejection', e => s.log.error(`unhandledRejection:`, e.stack));
        s.netProcs.child = new s.httpClient(childUrl);

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
                    s.log.error(e.toString(), e.stack);
                }
            }
        }
        if (s.isMainNode) watchScripts();
        s.logMsgHandler = m => {
            if (!s.connectedRS) return;

            const msg = JSON.stringify({m});
            s.connectedRS.write(`data: ${msg} \n\n`);
        }
        s.log.onMessage(m => s.logMsgHandler(m));

        const parseRqBody = async rq => {
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
                s.log.info(e.toString(), {path: e.path, syscall: e.syscall});
                return false;
            }
        }
        s.httpSlicer.x = async (rq, rs) => {
            const m = {
                'GET:/': async () => rs.s(await f('ed85ee2d-0f01-4707-8541-b7f46e79192e'), 'text/html'),
                'GET:/unknown': async () => rs.s(await s.fs.readFile(selfId)),
                'GET:/sw': async () => rs.s(await f('ebac14bb-e6b1-4f6c-95ea-017a44a0cc28'), 'text/javascript'),
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
            if (s.isMainNode) m['POST:/unknown'] = async () => await s.fs.writeFile(selfId, (await parseRqBody(rq)).js);

            if (await resolveStatic(rq, rs)) return;
            if (m[rq.mp]) { await m[rq.mp](); return; }
            rs.s('page not found');
        }
        const runProcManager = async () => {
            const procLogger = (new s.Logger('pm: ')).onMessage(m => s.logMsgHandler(m));
            const os = new s.OS(procLogger);
            os.run(`./node ${selfId} --port=${port + 1} --netNodeId=${netNodeId} --procManager=1`, false, false, proc => {
                s.intervalChildProcess = proc;
            }, code => {
                s.log.error('procManager closed...... with code: ' + code);
                setTimeout(runProcManager, 2000);
            });
        }
        //runProcManager();

    } else {
        if (!s.netProcs.parent) s.netProcs.parent = new s.httpClient(parentUrl);
        if (procManager && !s.intervalIteration) {
            s.intervalIteration = 1;
            let can = 1, i;

            const runInterval = () => {
                if (i) return;
                i = setInterval(async () => {
                    if (!can) return; can = 0;
                    try { eval(await s.fs.readFile(selfId)); }
                    catch (e) { console.error('try catch', e); }
                    can = 1;
                }, 2000);
            }
            s.p.on('unhandledRejection', e => {
                console.error('unhandledRejection interval err', e);
                clearInterval(i); i = 0;
                can = 1;
                setTimeout(runInterval, 500);
            });
            runInterval();
            return;
        }
    }

    if (!s.server) {
        s.stup = async up => {
            if (DE && s.isMainNode && up.m === '/k' && up.k === 'js' && up.v) {
                await s.fs.writeFile(`scripts/${up.nodeId}.js`, up.v);
            }
            await (await f('03454982-4657-44d0-a21a-bb034392d3a6'))(up, s.updateIds, s.netNodes, s.netProcs, f, s.triggerDump);
        }
        s.server = (await import('node:http')).createServer(async (rq, rs) => {
            (await f('4b60621c-e75a-444a-a36e-f22e7183fc97'))({
                rq, rs, httpHandler: s.httpSlicer, stup: s.stup, st: s.st, updatePermit: s.isMainNode
            });
        });
        s.server.listen(port, () => console.log(`httpServer start port: ${port}`));
    }

    if (!s.intervalIteration) return;
    if (procNodeId) { console.log(`procNodeId: ${procNodeId}`); await f(procNodeId); return; }

    const netNodesLogic = await f('f877c6d7-e52a-48fb-b6f7-cf53c9181cc1');
    await netNodesLogic(netNodeId);
})();