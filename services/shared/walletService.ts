import {IWallet, Wallet} from "../../models/wallet";
import {getUpdateOptions} from "../../utils/utils";
import {createError} from "../../utils/response";
import {TransactionReason} from "../../models/enums/transactionReason";
import {PaymentService} from "./paymentService";
import {NotificationService} from "./notificationService";
import {format} from "currency-formatter";
import {
    NotificationGroup,
    NotificationImportance,
    NotificationStrategy,
    NotificationTag
} from "../../models/notification";
import {UserRole} from "../../models/enums/userRole";
import {TransactionService} from "./transactionService";
import {TransactionType} from "../../models/enums/transactionType";
import {PaymentMethodType} from "../../models/enums/paymentMethod";

export class WalletService {

    public async getWallet(userId: string): Promise<IWallet> {
        return await WalletService.ensureHasWallet(userId);
    }

    public async fundWallet(userId: string, role: UserRole, body): Promise<any> {
        if (!body.amount) throw createError('Amount is required', 400);
        const wallet: IWallet = await WalletService.ensureHasWallet(userId);
        return new PaymentService().chargeKnownReason(userId, role, {
            amount: body.amount,
            card: body.card,
            itemId: wallet._id,
            reason: TransactionReason.WALLET_FUNDING
        });
    }

    public async getWalletById(userId: string, walletId: string, validate = true): Promise<IWallet> {
        console.log(`Getting wallet. userId: ${userId}, walletId: ${walletId}`);
        const wallet: IWallet = await Wallet.findOne({_id: walletId, userId}).lean<IWallet>().exec();
        if (!wallet && validate) throw createError('Wallet not found', 400);
        return wallet;
    }

    private static async ensureHasWallet(userId: string): Promise<IWallet> {
        return await Wallet.findOneAndUpdate({userId}, {}, getUpdateOptions()).lean<IWallet>().exec();
    }

    public async giveValue(userId: string, role: UserRole, walletId: string, amount: number): Promise<IWallet> {
        await WalletService.ensureHasWallet(userId);
        new NotificationService().sendNotification({
            userId: userId,
            role: role,
            ticker: 'Wallet funded',
            title: 'Wallet funded',
            content: `Your wallet has been funded with ${format(amount, {code: 'NGN'})}`,
            tag: NotificationTag.WALLET_FUNDING,
            group: NotificationGroup.WALLET_FUNDING,
            importance: NotificationImportance.HIGH,
            itemId: walletId
        }, NotificationStrategy.PUSH_ONLY, false);
        await new TransactionService().addTransaction(TransactionType.CREDIT, PaymentMethodType.WALLET, role, userId, walletId, amount, `Wallet Funding`);
        return await Wallet.findByIdAndUpdate(walletId, {$inc: {balance: amount}}).lean<IWallet>().exec();
    }

}
