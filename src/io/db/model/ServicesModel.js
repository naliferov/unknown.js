import BaseModel from "./BaseModel.js";

export default class ServicesModel extends BaseModel {
    name = 'services';

    async findByGroupsIds(groupsIds) { return await this.collection().find({ groupId: {"$in": groupsIds} }); }
}