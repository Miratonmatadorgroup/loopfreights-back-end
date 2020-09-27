import {IBank} from "../../models/interfaces/bank";
import {PaystackService} from "./paystackService";
import {createError} from "../../utils/response";

export class BankService {

    public async listBanks(): Promise<IBank[]> {
        return (await new PaystackService().listBanks()).data
    }

    public async resolveAccountNumber(accountNumber: string): Promise<{accountNumber: string, accountName: string, bankCode: string}> {
        const providusBankCode = '101';
        if (!accountNumber) throw createError('Account number is required', 400);
        const accountResult = (await new PaystackService().resolveAccountNumber(accountNumber, providusBankCode)).data;
        return {
            accountNumber: accountResult.account_number,
            accountName: accountResult.account_name,
            bankCode: providusBankCode
        }
    }
}
