import {IUser, User} from "../../../models/user";
import {UserRole} from "../../../models/enums/userRole";
import {Delivery} from "../../../models/delivery";
import {DeliveryState} from "../../../models/enums/deliveryState";
import {WalletService} from "../../shared/walletService";
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
import {ITransaction} from "../../../models/transaction";
import {TransactionService} from "../../shared/transactionService";

export class UsersService {

    public async getUsers(): Promise<IUser[]> {
        return await User.find({roles: {$in: UserRole.BASIC} as any})
            .lean<IUser>()
            .sort({createdAt: 'desc'})
            .exec();
    }

    public async getUsersByRole(role: UserRole): Promise<IUser[]> {
        return await User.find({roles: {$in: role} as any})
            .lean<IUser>()
            .sort({createdAt: 'desc'})
            .exec();
    }

    public async getUsersInIds(ids: string[]): Promise<IUser[]> {
        return await User.find({_id: {$in: ids} as any})
            .lean<IUser>()
            .sort({createdAt: 'desc'})
            .exec();
    }

    public async getUser(id: string): Promise<{ user: IUser, transactions: ITransaction[], totalDeliveries: number, walletBalance: number }> {
        const user = await User.findById(id)
            .lean<IUser>()
            .exec();
        const transactions: ITransaction[] = await new TransactionService().getTransactions(id)
        const totalDeliveries: number =  await Delivery.countDocuments({'userLocation.userId' : id, state: DeliveryState.COMPLETE}).exec();
        const walletBalance = (await new WalletService().getWallet(id)).balance
        return {user, transactions, totalDeliveries, walletBalance};
    }

    public async searchUsers(query: string, role: UserRole): Promise<IUser[]> {
        return await User.find({
            roles: {$in: role} as any,
            $or: [
                {firstName: {$regex: query, $options: 'i'}},
                {lastName: {$regex: query, $options: 'i'}},
                {email: {$regex: query, $options: 'i'}},
            ]
        }).lean<IUser>().exec();
    }

    public async messageUser(id: string, body: any): Promise<{ user: IUser, transactions: ITransaction[], totalDeliveries: number, walletBalance: number }> {
        console.log('Sending message to user: ', body)
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
                role: UserRole.BASIC
            }, NotificationStrategy.PUSH_ONLY, true)
        }
        return await this.getUser(id);
    }

}
