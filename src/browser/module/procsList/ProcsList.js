import V from "../../../type/V.js";
import Btn from "../../../type/Btn.js";

export default class ProcsList {

    constructor(v, nodes) {
        this.v = v;
        this.nodes = nodes;
    }

    async show() {
        //const http = new HttpClient;

        let procsByGroupId = {}; //groupId is the same as nodeId
        let procs = (await http.get('/proc/list')).data;
        if (!procs.length) return;

        procs.forEach(proc => {
            if (!procsByGroupId[proc.groupId]) procsByGroupId[proc.groupId] = [];
            procsByGroupId[proc.groupId].push(proc);
        });

        const {data} = await http.get('/service', {groupsIds: Object.keys(procsByGroupId)});
        const services = keyBy(data.services, 'groupId');

        for (let groupId in procsByGroupId) {

            const node = this.nodes.getNodeById(groupId);
            if (!node) { console.error(`Node not found with id: ${groupId}`); return; }

            const procGroupContainer = new V({class: ['procGroup']});
            e('>', [procGroupContainer, this.v]);


            const r1 = new V({class: ['flex', 'gap', 'alignCenter']});
            e('>', [r1, procGroupContainer]);
            e('>', [new V({txt: 'service: '}), r1]);
            const serviceName = services[groupId] ? services[groupId].name : 'undefined';
            const inp = new V({tagName: 'input', value: serviceName, style: {height: '14px'}});
            e('>', [inp, r1]);
            inp.on('keyup', async e => {
                const name = inp.getValue(); if (!name) return;
                const {data} = await http.post('/service', {groupId, name});
                console.log(data);
            });


            const r2 = new V({class: ['flex', 'gap', 'alignCenter']});
            e('>', [r2, procGroupContainer]);
            e('>', [new V({txt: 'group: ' + node.get('name')}), r2]);
            const stopGroupBtn = new Btn('stopGroup');
            e('>', [stopGroupBtn, r2]);
            stopGroupBtn.on('click', async e => {
                const procsIds = procs.map(proc => proc._id);
                const r = await window.e('procStop', {procsIds});

                if (r.deletedProcsIds && r.deletedProcsIds.length === procsIds.length) {
                    await http.delete('/service', {groupId});
                    procGroupContainer.removeFromDom();
                }
            });


            const procsTable = new V({tagName: 'table'});
            e('>', [procsTable, procGroupContainer]);

            procsByGroupId[groupId].forEach((proc) => {
                const tr = new V({tagName: 'tr'});
                e('>', [tr, procsTable]);
                e('>', [new V({tagName: 'td', txt: proc.port}), tr]);

                let btn = new V({tagName: 'td', class: 'btn', txt: 'stop'});
                e('>', [btn, tr]);
                btn.on('click', async () => {
                    const r = await e('procStop', {procsIds: [proc._id]});
                    console.log(r);

                    tr.removeFromDom();
                    if (procsTable.getChildrenCount() === 0) procGroupContainer.removeFromDom();
                });

                btn = new V({tagName: 'td', class: 'btn', txt: 'log'});
                e('>', [btn, tr]);
            });
        }
    }
}