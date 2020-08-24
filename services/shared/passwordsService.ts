import {IPassword, Password} from "../../models/password";
import {compareSync, hashSync} from "bcryptjs";
import {getUpdateOptions} from "../../utils/utils";

export class PasswordsService {

    public async addPassword(userId: string, password: string): Promise<IPassword> {
        return await Password.findOneAndUpdate({userId}, {
            password: hashSync(password, 8)
        }, getUpdateOptions()).lean<IPassword>().exec();
    }

    public async getPassword(userId: string): Promise<string> {
        const password: IPassword = await Password.findOne({userId}).lean<IPassword>().exec();
        return password ? password.password : null;
    }

    public async checkPassword(userId: string, passwordAttempt): Promise<boolean> {
        const password: string = await this.getPassword(userId);
        return password && compareSync(passwordAttempt, password);
    }
}
