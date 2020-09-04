import {TransactionType} from "../../models/enums/transactionType";
import {UserRole} from "../../models/enums/userRole";
import {ITransaction, Transaction} from "../../models/transaction";
import {createError} from "../../utils/response";
import {PaymentMethodType} from "../../models/enums/paymentMethod";

export class TransactionService {

    public async addTransaction(type: TransactionType, paymentType: PaymentMethodType, role: UserRole,  userId: string, itemId: string, amount: number, description: string): Promise<ITransaction> {
        return await new Transaction({
            type, role, paymentType, userId, itemId, amount, description
        }).save();
    }

    public async getTransactions(userId: string, type?: TransactionType, paymentType?: PaymentMethodType): Promise<ITransaction[]> {
        const conditions = type ? {userId, type, paymentType} : {userId, paymentType};
        return await Transaction.find(conditions).lean<ITransaction>().sort({createdAt: 'desc'}).exec();
    }

    public async getTransaction(id: string, validate = true): Promise<ITransaction> {
        const transaction: ITransaction = await Transaction.findById(id).lean<ITransaction>().exec();
        if (!transaction && validate)
            throw createError('Transaction not found', 400);
        return transaction;
    }
}
