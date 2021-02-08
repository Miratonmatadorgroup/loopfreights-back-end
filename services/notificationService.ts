import {createError} from "../utils/response";
import {NotificationService as SharedNotificationService} from "./shared/notificationService";
import {INotification} from "../models/notification";

export class NotificationService {

    public async sendNotificationToToken(body: any) {
        if (!body.fcmToken) throw createError('Fcm token required', 400);
        const content = body.content || 'No content'
        await SharedNotificationService.sendFirebaseMessage({
            title: 'title',
            content: content,
            ticker: 'ticker',
            tag: 'tag',
            group: 'group'
        } as unknown as INotification, [body.fcmToken])
    }

}