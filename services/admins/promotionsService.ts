import {IPromotion, Promotion} from "../../models/promotion";
import {createError} from "../../utils/response";
import {UserSegment} from "../../models/enums/userSegment";
import {UsersService} from "./users/usersService";
import {UserRole} from "../../models/enums/userRole";
import {WalletService} from "../shared/walletService";
import {stripUpdateFields} from "../../utils/utils";

export class PromotionsService {

    public async createPromotion(body: IPromotion): Promise<IPromotion> {
        if (!body.title) throw createError('Promotion title is required', 400);
        if (!body.description) throw createError('Promotion description is required', 400);
        if (!body.value) throw createError('Promotion value is required', 400);
        if (!body.userSegment) throw createError('Promotion user segment is required', 400);
        stripUpdateFields(body);
        const usersService = new UsersService();
        switch (body.userSegment) {
            case UserSegment.DRIVERS:
                body.participants = (await usersService.getUsersByRole(UserRole.DRIVER)).map(user => user._id);
                body.role = UserRole.DRIVER;
                break;
            case UserSegment.USERS:
                body.participants = (await usersService.getUsersByRole(UserRole.BASIC)).map(user => user._id);
                body.role = UserRole.BASIC;
                break;
            default:
                if (!body.participants || body.participants.length === 0) throw createError('Promotion participants required', 400);
                if (!body.role) throw createError('Role is required', 400);
                body.participants = (await usersService.getUsersInIds(body.participants)).map(user => user._id);
                break;
        }
        const promotion = await new Promotion(body).save();
        this.distributePromotion(promotion);
        return promotion;
    }

    public distributePromotion(promotion: IPromotion) {
        new Promise(async (resolve) => {
            const walletService = new WalletService();
            for (const participant of promotion.participants) {
                await walletService.giveBonusValue(participant, promotion.role, promotion.value, promotion.description);
            }
            resolve(null);
        }).catch(err => {
            console.error('Error distributing promotion: ', err);
        })
    }

    public async getPromotions(): Promise<IPromotion[]> {
        return await Promotion.find()
            .populate('participants')
            .lean<IPromotion>()
            .sort({createdAt: 'desc'})
            .exec();
    }
}
