import {ITransactionReference, TransactionReference} from "../../models/transactionReference";
import {TransactionReason} from "../../models/enums/transactionReason";
import {getUpdateOptions} from "../../utils/utils";
import {generate} from "voucher-code-generator";
import {createError} from "../../utils/response";
import {UserRole} from "../../models/enums/userRole";

export class TransactionReferenceService {

    public async addTransactionReference(userId: string, amount: number, role: UserRole, reason: TransactionReason, itemId?: string, saveCard = false, reference?: string): Promise<ITransactionReference> {
        reference = reference || TransactionReferenceService.generateReferenceNumber();
        return  await TransactionReference
            .findOneAndUpdate({userId, reason, itemId}, {amount, itemId, role, reason, reference, saveCard}, getUpdateOptions())
            .lean<ITransactionReference>()
            .exec();
    }

    public async getTransactionReference(reference: string, validate = true): Promise<ITransactionReference> {
        const transactionReference: ITransactionReference = await TransactionReference.findOne({reference})
            .lean<ITransactionReference>()
            .exec();
        if (!transactionReference && validate)
            throw createError(`Transaction reference not found`, 400);
        return transactionReference;
    }

    public async markReferenceUsed(reference: string, used: boolean): Promise<ITransactionReference> {
        await TransactionReference.findOneAndUpdate({reference}, {used}).exec();
        return  await this.getTransactionReference(reference);
    }

    public static generateReferenceNumber(): string {
        return generate({prefix: 'ref-', pattern: '####-####-####', charset: '1234567890abcdefghijklmnopqrstuvwxyz', count: 1})[0];
    }

}
