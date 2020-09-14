import {ICard} from "../../models/card";
import {IPaystackChargeResponse} from "../../models/interfaces/paystackChargeResponse";
import {PaystackRoute} from "../../models/enums/paystackRoute";
import {config} from "../../config/config";
import {createError} from "../../utils/response";
import request from "request-promise";
import {IUser} from "../../models/user";
import {AccountService} from "./accountService";
import {TransactionReferenceService} from "./transactionReferenceService";
import {TransactionReason} from "../../models/enums/transactionReason";
import {PaystackChargeStatus} from "../../models/enums/paystackData";
import {WalletService} from "./walletService";
import {UserRole} from "../../models/enums/userRole";
import {CardService} from "./cardService";

export class PaystackService {

    public async chargeCard(userId: string, amount: number, card: ICard, itemId: string, role: UserRole, reason: TransactionReason, saveCard: boolean): Promise<IPaystackChargeResponse> {
        const user: IUser = await new AccountService().getAccount(userId);
        const reference = (await new TransactionReferenceService().addTransactionReference(userId, amount, role, reason, itemId, saveCard)).reference;
        const paystackCard = {
            number: card.number,
            cvv: card.cvv,
            expiry_month: card.expMonth,
            expiry_year: card.expYear,
        };
        const result: IPaystackChargeResponse = await request(PaystackService.createUrl(PaystackRoute.CHARGE), {
            body: {
                email: user.email,
                card: paystackCard,
                reference: reference,
                amount: amount * 100
            },
            method: 'POST',
            json: true,
            headers: PaystackService.getHeaders()
        }).catch(err => {
            throw PaystackService.handleError(err);
        });
        await this.checkTransactionApproved(result);
        return result;
    }

    public async chargeAuthorization(userId: string, amount: number, authorization: string, itemId: string, role: UserRole, reason: TransactionReason): Promise<IPaystackChargeResponse> {
        const user: IUser = await new AccountService().getAccount(userId);
        const reference = (await new TransactionReferenceService().addTransactionReference(userId, amount, role, reason, itemId)).reference;
        const result: IPaystackChargeResponse = await request(PaystackService.createUrl(PaystackRoute.CHARGE), {
            body: {
                email: user.email,
                authorization_code: authorization,
                reference: reference,
                amount: amount * 100
            },
            method: 'POST',
            json: true,
            headers: PaystackService.getHeaders()
        }).catch(err => {
            throw PaystackService.handleError(err);
        });
        await this.checkTransactionApproved(result);
        return result;
    }

    public async chargeSubmitPin(reference: string, pin: string): Promise<IPaystackChargeResponse> {
        const result: IPaystackChargeResponse = await request(PaystackService.createUrl(PaystackRoute.CHARGE, '/submit_pin'), {
            body: {reference, pin},
            method: 'POST',
            json: true,
            headers: PaystackService.getHeaders()
        }).catch(err => {
            throw PaystackService.handleError(err);
        });
        await this.checkTransactionApproved(result);
        return result;
    }

    public async chargeSubmitOtp(reference: string, otp: string): Promise<IPaystackChargeResponse> {
        const result: IPaystackChargeResponse = await request(PaystackService.createUrl(PaystackRoute.CHARGE, '/submit_otp'), {
            body: {reference, otp},
            method: 'POST',
            json: true,
            headers: PaystackService.getHeaders()
        }).catch(err => {
            throw PaystackService.handleError(err);
        });
        await this.checkTransactionApproved(result);
        return result;
    }

    public async chargeSubmitPhone(reference: string, phone: string): Promise<IPaystackChargeResponse> {
        const result: IPaystackChargeResponse = await request(PaystackService.createUrl(PaystackRoute.CHARGE, '/submit_phone'), {
            body: {reference, phone},
            method: 'POST',
            json: true,
            headers: PaystackService.getHeaders()
        }).catch(err => {
            throw PaystackService.handleError(err);
        });
        await this.checkTransactionApproved(result);
        return result;
    }

    public async chargeSubmitBirthday(reference: string, birthday: string): Promise<IPaystackChargeResponse> {
        const result: IPaystackChargeResponse = await request(PaystackService.createUrl(PaystackRoute.CHARGE, '/submit_birthday'), {
            body: {reference, birthday},
            method: 'POST',
            json: true,
            headers: PaystackService.getHeaders()
        }).catch(err => {
            throw PaystackService.handleError(err);
        });
        await this.checkTransactionApproved(result);
        return result;
    }

    public async chargeSubmitAddress(reference: string, address: string, city: string, state: string, zipcode: string): Promise<IPaystackChargeResponse> {
        const result: IPaystackChargeResponse = await request(PaystackService.createUrl(PaystackRoute.CHARGE, '/submit_address'), {
            body: {reference, address, city, state, zipcode},
            method: 'POST',
            json: true,
            headers: PaystackService.getHeaders()
        }).catch(err => {
            throw PaystackService.handleError(err);
        });
        await this.checkTransactionApproved(result);
        return result;
    }

    public async chargeCheckPending(reference: string): Promise<IPaystackChargeResponse> {
        const result: IPaystackChargeResponse = await request(PaystackService.createUrl(PaystackRoute.CHARGE, reference), {
            method: 'GET',
            json: true,
            headers: PaystackService.getHeaders()
        }).catch(err => {
            throw PaystackService.handleError(err);
        });
        await this.checkTransactionApproved(result);
        return result;
    }

    // noinspection JSMethodCanBeStatic
    private async checkTransactionApproved(response: IPaystackChargeResponse) {
        const data = response.data;
        const amount = response.data.amount / 100;
        console.log('Verifying transaction: ', response);
        const transactionReference = await new TransactionReferenceService().getTransactionReference(data.reference);
        if (data.status === PaystackChargeStatus.SUCCESS) {
            if (transactionReference.saveCard) {
                const authorization = data.authorization;
                await new CardService().saveCard(transactionReference.userId, transactionReference.role, authorization.bin, authorization.last4, authorization.brand,
                    authorization.exp_month, authorization.exp_year, authorization.authorization_code, authorization.signature, authorization.reusable);
            }
            switch (transactionReference.reason) {
                case TransactionReason.WALLET_FUNDING:
                    await new WalletService().giveValue(transactionReference.userId, transactionReference.role, amount);
                    break;
            }
        }
    }

    private static handleError(err) {
        const error = err.error;
        console.error('****Original Error message: ', err.message);
        if (!error) throw createError('Payment failed', 500);
        if (!error.data)throw createError(error.message ? error.message : 'Payment failed', 400);
        const data = error.data;
        throw createError(data.message, 400);
    }

    private static getHeaders() {
        return {
            Authorization: `Bearer ${config.paystackAuthorization}`,
            Accept: 'application/json',
        };
    }

    public static createUrl(route: PaystackRoute, path?: string): string {
        if (path && !path.startsWith('/')) path = `/${path}`;
        let url = `https://api.paystack.co/${route}`;
        if (path) url = url.concat(path);
        console.log('Calling paystack: ', url);
        return url;
    }
}
