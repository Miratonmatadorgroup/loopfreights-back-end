import {IUser, User} from "../../models/user";
import {createError} from "../../utils/response";
import {Types} from "mongoose";
import {UserRole} from "../../models/enums/userRole";
import {IPaymentAccount} from "../../models/interfaces/paymentAccount";
import {PaystackService} from "./paystackService";
import {BankService} from "./bankService";

export class AccountService {

    public async getAccount(userId: string, validate = true): Promise<IUser> {
        const user: IUser = await User.findById(userId).lean<IUser>().exec();
        if (!user && validate)
            throw createError('User not found', 401);
        return user;
    }

    public async editAccount(userId: string, body: any): Promise<IUser> {
        await User.findByIdAndUpdate(userId, body).exec();
        return await this.getAccount(userId);
    }

    public async updatePaymentAccount(userId: string, body: IPaymentAccount): Promise<IUser> {
        const accountResult = await new BankService().resolveAccountNumber(body.accountNumber);
        if (!accountResult?.accountName) throw createError('Unable to resolve account number', 400);
        await User.findByIdAndUpdate(userId, {
            'driverProfile.paymentAccount.accountName': accountResult.accountName,
            'driverProfile.paymentAccount.accountNumber': accountResult.accountNumber,
            'driverProfile.paymentAccount.bankCode': accountResult.bankCode,
            'driverProfile.paymentAccount.bank': 'CloudBank',
        }).exec();
        return await this.getAccount(userId);
    }

    public async validateDriverRequirements(userId: string): Promise<Error | null> {
        return null;
    }
}
