import {IUser, User} from "../../../models/user";
import {UserRole} from "../../../models/enums/userRole";
import {IDriverDocument} from "../../../models/document";
import {DriverDocumentService} from "../../drivers/driverDocumentService";
import {Delivery} from "../../../models/delivery";
import {DeliveryState} from "../../../models/enums/deliveryState";
import {WalletService} from "../../shared/walletService";
import {SocketServer} from "../../../libs/socketServer";
import {createError} from "../../../utils/response";
import {EmailService} from "../../shared/emailService";
import {EmailTemplateId} from "../../../models/interfaces/emailTemplatePayload";
import {NotificationService} from "../../shared/notificationService";
import {
    NotificationGroup,
    NotificationImportance,
    NotificationStrategy,
    NotificationTag
} from "../../../models/notification";
import {Types} from "mongoose";

export class DriversService {

    public async getDrivers(): Promise<IUser[]> {
        return await User.find({roles: {$in: UserRole.DRIVER} as any})
            .sort({createdAt: 'desc'})
            .lean<IUser>().exec();
    }

    public async getDriver(id: string): Promise<{ user: IUser, documents: IDriverDocument[], totalDeliveries: number, walletBalance: number }> {
        const user = await User.findById(id)
            .lean<IUser>()
            .exec();
        const documentsHolder = (await new DriverDocumentService().getDocuments(id))
        const documents: IDriverDocument[] = documentsHolder.requiredDocuments.map(document => {
            const uploadedDocument = documentsHolder.documents.filter(d => d.type === document.type)[0] || {}
            return Object.assign(document, uploadedDocument);
        });
        const totalDeliveries: number =  await Delivery.countDocuments({'driverLocation.userId' : id, state: DeliveryState.COMPLETE}).exec();
        const walletBalance = (await new WalletService().getWallet(id)).balance
        return {user, documents, totalDeliveries, walletBalance};
    }

    public async disableDriver(id: string, body: any): Promise<{ user: IUser, documents: IDriverDocument[], totalDeliveries: number, walletBalance: number }> {
        const reason = body.reason
        if (!reason) throw createError('Reason is required', 400);
        const user: IUser = await User.findByIdAndUpdate(id, {
            'driverProfile.enabled': false,
            'driverProfile.message': reason,
        }, {new: true}).lean<IUser>().exec();
        new EmailService().sendEmail(user.email,
            'Account disabled',
            'Your account has been disabled',
            {
                templateId: EmailTemplateId.DRIVER_ACCOUNT_DISABLED,
                data: [
                    {
                        key: 'name',
                        value: user.firstName
                    },
                    {
                        key: 'email',
                        value: user.email
                    },
                    {
                        key: 'reason',
                        value: reason
                    }
                ]
            }
        )
        new NotificationService().sendNotification({
            userId: id,
            ticker: 'Account Disabled',
            title: 'Account Disabled',
            content: reason,
            tag: NotificationTag.ACCOUNT_UPDATE,
            group: NotificationGroup.ACCOUNT_UPDATE,
            importance: NotificationImportance.HIGH,
            itemId: new Types.ObjectId().toHexString(),
            role: UserRole.DRIVER
        }, NotificationStrategy.PUSH_ONLY, true)
        SocketServer.closeConnection(id, UserRole.DRIVER, reason)
        return await this.getDriver(id);
    }

    public async enableDriver(id: string): Promise<{ user: IUser, documents: IDriverDocument[], totalDeliveries: number, walletBalance: number }> {
        const user: IUser = await User.findByIdAndUpdate(id, {
            'driverProfile.enabled': true,
        }, {new: true}).lean<IUser>().exec();
        new EmailService().sendEmail(user.email,
            'Account enabled',
            'Your account has enabled',
            {
                templateId: EmailTemplateId.DRIVER_ACCOUNT_ENABLED,
                data: [
                    {
                        key: 'name',
                        value: user.firstName
                    },
                    {
                        key: 'email',
                        value: user.email
                    }
                ]
            }
        )
        new NotificationService().sendNotification({
            userId: id,
            ticker: 'Account Enabled',
            title: 'Account Enabled',
            content: 'Your rider account has been enabled',
            tag: NotificationTag.ACCOUNT_UPDATE,
            group: NotificationGroup.ACCOUNT_UPDATE,
            importance: NotificationImportance.HIGH,
            itemId: new Types.ObjectId().toHexString(),
            role: UserRole.DRIVER
        }, NotificationStrategy.PUSH_ONLY, true)
        return await this.getDriver(id);
    }

    public async messageDriver(id: string, body: any): Promise<{ user: IUser, documents: IDriverDocument[], totalDeliveries: number, walletBalance: number }> {
        console.log('Sending message to driver: ', body)
        if (!body.message) throw createError('Message is required', 400);
        const title = body.title || 'New message from us'
        const user: IUser = await User.findById(id).lean<IUser>().exec();
        if (body.sendEmail) {
            new EmailService().sendEmail(user.email,
                title,
                body.message,
                {
                    templateId: EmailTemplateId.USER_MESSAGE,
                    data: [
                        {
                            key: 'name',
                            value: user.firstName
                        },
                        {
                            key: 'message',
                            value: body.message
                        }
                    ]
                }
            )
        }
        if (body.sendPush) {
            new NotificationService().sendNotification({
                userId: id,
                ticker: title,
                title: title,
                content: body.message,
                tag: NotificationTag.USER_MESSAGE,
                group: NotificationGroup.USER_MESSAGE,
                importance: NotificationImportance.HIGH,
                itemId: new Types.ObjectId().toHexString(),
                role: UserRole.DRIVER
            }, NotificationStrategy.PUSH_ONLY, true)
        }
        return await this.getDriver(id);
    }
}
