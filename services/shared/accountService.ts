import {IUser, User} from "../../models/user";
import {createError} from "../../utils/response";
import {Types} from "mongoose";
import {UserRole} from "../../models/enums/userRole";

export class AccountService {

    public async getAccount(userId: string, validate = true): Promise<IUser> {
        const user: IUser = await User.findById(userId).lean<IUser>().exec();
        if (!user && validate)
            throw createError('User not found', 404);
        return user;
    }

    public async editAccount(userId: string, body: any): Promise<IUser> {
        await User.findByIdAndUpdate(userId, body).exec();
        return await this.getAccount(userId);
    }

    public async validateDriverRequirements(userId: string): Promise<Error | null> {
        return null;
    }
}
