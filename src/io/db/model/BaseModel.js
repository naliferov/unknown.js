export default class BaseModel {

    name;
    mongoManager;

    constructor(mongoManager) { this.mongoManager = mongoManager; }
    collection() { return this.mongoManager.getDb().collection(this.name); }
    async insertOne(doc) { return await this.collection().insertOne(doc); }
    async updateOne(query, update) { return await this.collection().updateOne(query, update); }
    async find(query) {
        const cursor = await this.collection().find(query);
        return await cursor.toArray();
    }
    async findByIds(ids) {
        const c = await this.collection().find({_id: {'$in': ids}});
        return await c.toArray();
    }
    async findOne(query) { return await this.collection().findOne(query); }
    async deleteManyBy(field, ids) { return await this.collection().deleteMany({ [field]: {'$in': ids} }); }
    async deleteOneBy(field, value) { return await this.collection().deleteOne({ [field]: value }); }
    async getRandomDoc() { return await this.collection().aggregate([{ $sample: { size: 1 } }]); }
}