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
import {DriverType} from "../../../models/enums/driverType";
import {EarningService} from "../../shared/earningService";
import {IEarning} from "../../../models/earning";
import {IWallet} from "../../../models/wallet";

export class DriversService {

    public async getDrivers(type?: string): Promise<IUser[]> {
        const conditions = {roles: {$in: UserRole.DRIVER}} as any;
        console.log('Type: ', type);
        if (type !== 'all') {
            Object.assign(conditions, {
                'driverProfile.type': type
            });
        }
        console.log('Getting drivers. Conditions: ', conditions);
        return await User.find(conditions)
            .sort({createdAt: 'desc'})
            .lean<IUser>().exec();
    }

    public async getDriver(id: string): Promise<IDriverDetails> {
        const user = await User.findById(id)
            .lean<IUser>()
            .exec();
        const documentsHolder = (await new DriverDocumentService().getDocuments(id))
        const documents: IDriverDocument[] = documentsHolder.requiredDocuments.map(document => {
            const uploadedDocument = documentsHolder.documents.filter(d => d.type === document.type)[0] || {}
            return Object.assign(document, uploadedDocument);
        });
        const totalDeliveries: number =  await Delivery.countDocuments({'driverLocation.userId' : id, state: DeliveryState.COMPLETE}).exec();
        const wallet: IWallet = (await new WalletService().getWallet(id));
        const walletBalance = wallet.balance;
        const bonusWalletBalance = wallet.bonusBalance;
        const driverEarnings: IEarning[] = await new EarningService().getEarnings(id, UserRole.DRIVER);
        const totalEarnings: number = driverEarnings.reduce((total, currentValue) => {
            total += currentValue.amount
            return total;
        }, 0);
        const unDisbursedEarnings: IEarning[] = driverEarnings.filter(earning => !earning.disbursed)
        const totalUnDisbursedEarnings: number = unDisbursedEarnings.reduce((total, currentValue) => {
                total += currentValue.amount
                return total;
            }, 0);
        const totalUnDisbursedEarningFees: number = -Math.abs(unDisbursedEarnings.reduce((total, currentValue) => {
            total += currentValue.fees
            return total;
        }, 0));
        return {user, documents, totalDeliveries, walletBalance, bonusWalletBalance, totalEarnings, totalUnDisbursedEarnings, totalUnDisbursedEarningFees};
    }

    public async disableDriver(id: string, body: any): Promise<IDriverDetails> {
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

    public async enableDriver(id: string): Promise<IDriverDetails> {
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

    public async messageDriver(id: string, body: any): Promise<IDriverDetails> {
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

    public async disburseUnPaidEarnings(id: string): Promise<IDriverDetails> {
        await new EarningService().disburseUnPaidEarnings(id);
        return await this.getDriver(id);
    }
}

export interface IDriverDetails {
    user: IUser;
    documents: IDriverDocument[]
    totalDeliveries: number;
    walletBalance: number;
    bonusWalletBalance: number;
    totalEarnings: number;
    totalUnDisbursedEarnings: number;
    totalUnDisbursedEarningFees: number;
}
