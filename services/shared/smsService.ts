import {config} from "../../config/config";
import request from "request-promise";

export class SmsService {

    public sendSms(phone: string, text: string) {
        new Promise(async (accept, reject) => {
            try {
                const url = `https://api.textng.xyz/sendsms?phone=${phone}&message=${text}&key=${config.textNgKey}&sender=LoopInfo`
                const result = await request(url)
                accept(result);
            } catch (e) {
                reject(e)
            }
        }).catch(err => {
            console.error('Sms send error: ', err);
        })
    }

}