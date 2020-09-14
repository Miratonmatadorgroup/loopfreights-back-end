import {IWallet, Wallet} from "../../models/wallet";
import {getUpdateOptions} from "../../utils/utils";
import {createError, ErrorStatus} from "../../utils/response";
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

    public async takeValue(userId: string, role: UserRole, amount: number, description: string, dryRun = false): Promise<IWallet> {
        if (!amount) throw createError('Amount is required', 400);
        let wallet: IWallet = await WalletService.ensureHasWallet(userId);
        const amountFromBonus = wallet.bonusBalance === 0 ? 0 : wallet.bonusBalance >= amount ? amount : wallet.bonusBalance;
        const amountLeftAfterBonus = amount - amountFromBonus;
        console.log(`>>>> Amount: ${amount}, from bonus: ${amountFromBonus}, from main: ${amountLeftAfterBonus}`)
        if (wallet.balance < amountLeftAfterBonus)
            throw createError(`You don't have up to ${format(amount, {code: 'NGN'})} in your main wallet or bonus wallet`, 400, ErrorStatus.INSUFFICIENT_BALANCE_IN_WALLET);
        if (!dryRun) {
            wallet = await Wallet.findByIdAndUpdate(wallet._id, {$inc: {balance: -amountLeftAfterBonus, bonusBalance: -amountFromBonus}}).lean<IWallet>().exec();
            if (amountLeftAfterBonus > 0)
                await new TransactionService().addTransaction(TransactionType.DEBIT, PaymentMethodType.WALLET, role, userId,
                    wallet._id, amountLeftAfterBonus, description);
            if (amountFromBonus > 0)
                await new TransactionService().addTransaction(TransactionType.DEBIT, PaymentMethodType.WALLET, role, userId,
                    wallet._id, amountFromBonus, `Deduction from bonus wallet: ${description}`);
        }
        return await WalletService.ensureHasWallet(userId);
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

    public async giveValue(userId: string, role: UserRole, amount: number, description?: string): Promise<IWallet> {
        description = description || `Wallet Funding`;
        const walletId: string = (await WalletService.ensureHasWallet(userId))._id;
        await WalletService.ensureHasWallet(userId);
        const wallet = await Wallet.findByIdAndUpdate(walletId, {$inc: {balance: amount}}).lean<IWallet>().exec();
        await new TransactionService().addTransaction(TransactionType.CREDIT, PaymentMethodType.WALLET, role, userId, walletId, amount, description);
        new NotificationService().sendNotification({
            userId: userId,
            role: role,
            ticker: 'Wallet funded',
            title: 'Wallet funded',
            content: `Your wallet has been funded with ${format(amount, {code: 'NGN'})}`,
            tag: NotificationTag.WALLET_FUNDING,
            group: NotificationGroup.WALLETS,
            importance: NotificationImportance.HIGH,
            itemId: walletId
        }, NotificationStrategy.PUSH_ONLY, false);
        return wallet;
    }

    public async giveBonusValue(userId: string, role: UserRole, amount: number, description?: string): Promise<IWallet> {
        description = description || 'Bonus wallet funding';
        const walletId: string = (await WalletService.ensureHasWallet(userId))._id;
        const wallet = await Wallet.findByIdAndUpdate(walletId, {$inc: {bonusBalance: amount}}).lean<IWallet>().exec();
        await new TransactionService().addTransaction(TransactionType.CREDIT, PaymentMethodType.WALLET, role, userId, walletId, amount, description);
        new NotificationService().sendNotification({
            userId: userId,
            role: role,
            ticker: 'Bonus wallet funded',
            title: 'Bonus wallet funded',
            content: `Your bonus wallet has been funded with ${format(amount, {code: 'NGN'})}: ${description}`,
            tag: NotificationTag.WALLET_FUNDING,
            group: NotificationGroup.WALLETS,
            importance: NotificationImportance.HIGH,
            itemId: walletId
        }, NotificationStrategy.PUSH_ONLY, true);
        return wallet;
    }

}
