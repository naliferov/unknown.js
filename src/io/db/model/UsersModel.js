import BaseModel from "./BaseModel.js";

export default class UsersModel extends BaseModel {
    name = 'users';
    async getByEmail(email) { return await this.findOne({email}); }
    async getByAuthKey(authKey) { return await this.findOne({authKey}); }
}