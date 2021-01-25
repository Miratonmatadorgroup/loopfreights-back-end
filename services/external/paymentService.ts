import {PaystackService} from "../shared/paystackService";
import {IPaystackChargeResponse} from "../../models/interfaces/paystackChargeResponse";
import {createError} from "../../utils/response";

export class PaymentService {

    public async verifyPayment(body: IPaystackChargeResponse) {
        const reference = body?.data?.reference
        console.log('Verifying payment: ', reference);
        if (!reference) throw createError('Reference is required', 400);
        return await new PaystackService().chargeCheckPending(reference)
    }

}