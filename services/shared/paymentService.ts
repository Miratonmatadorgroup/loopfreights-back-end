import {TransactionReason} from "../../models/enums/transactionReason";
import {IPaystackChargeResponse} from "../../models/interfaces/paystackChargeResponse";
import {PaystackService} from "./paystackService";
import {ICard} from "../../models/card";
import {createError} from "../../utils/response";
import {IWallet} from "../../models/wallet";
import {WalletService} from "./walletService";
import {UserRole} from "../../models/enums/userRole";

export class PaymentService {

    public async chargeKnownReason(userId: string, role: UserRole, body: {amount: number, card: ICard, itemId: string, reason: TransactionReason}): Promise<IPaystackChargeResponse> {
        const amount = body.amount;
        const card = body.card;
        const reason = body.reason;
        const itemId = body.itemId;
        if (!reason) throw createError('Transaction reason is required', 400);
        if (!itemId) throw createError('Item id is required', 400);
        if (!amount) throw createError('Amount is required', 400);
        if (!card) throw createError('Card is required', 400);
        if (!card.number) throw createError('Card number is required', 400);
        if (!card.expYear) throw createError('Card exp year is required', 400);
        if (!card.expMonth) throw createError('Card exp month is required', 400);
        if (!card.cvv) throw createError('Card cvv is required', 400);
        switch (reason) {
            case TransactionReason.WALLET_FUNDING:
                const wallet: IWallet = await new WalletService().getWalletById(userId, itemId);
                return await new PaystackService().chargeCard(userId, amount, card, wallet._id, role, reason);
            default:
                throw createError(`Unknown payment reason '${reason}'`);
        }
    }

    public async submitPin(body: {reference: string, pin: string}): Promise<IPaystackChargeResponse> {
        if (!body.reference) throw createError('Reference is required', 400);
        if (!body.pin) throw createError('Pin is required', 400);
        return await new PaystackService().chargeSubmitPin(body.reference, body.pin);
    }

    public async submitOtp(body: {reference: string, otp: string}): Promise<IPaystackChargeResponse> {
        if (!body.reference) throw createError('Reference is required', 400);
        if (!body.otp) throw createError('Otp is required', 400);
        return await new PaystackService().chargeSubmitOtp(body.reference, body.otp);
    }

    public async submitPhone(body: {reference: string, phone: string}): Promise<IPaystackChargeResponse> {
        if (!body.reference) throw createError('Reference is required', 400);
        if (!body.phone) throw createError('Phone is required', 400);
        return await new PaystackService().chargeSubmitPhone(body.reference, body.phone);
    }

    public async submitBirthday(body: {reference: string, birthday: string}): Promise<IPaystackChargeResponse> {
        if (!body.reference) throw createError('Reference is required', 400);
        if (!body.birthday) throw createError('Phone is required', 400);
        return await new PaystackService().chargeSubmitBirthday(body.reference, body.birthday);
    }

    public async submitAddress(body: {reference: string, address: string, city: string, state: string, zipcode: string}): Promise<IPaystackChargeResponse> {
        if (!body.reference) throw createError('Reference is required', 400);
        if (!body.address) throw createError('Address is required', 400);
        if (!body.city) throw createError('City is required', 400);
        if (!body.state) throw createError('State is required', 400);
        if (!body.zipcode) throw createError('Zip code is required', 400);
        return await new PaystackService().chargeSubmitAddress(body.reference, body.address, body.city, body.state, body.zipcode);
    }

    public async checkStatus(reference: string): Promise<IPaystackChargeResponse> {
        if (!reference) throw createError('Reference is required', 400);
        return await new PaystackService().chargeCheckPending(reference);
    }
}
