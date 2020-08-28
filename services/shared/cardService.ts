import {Card, ICard} from "../../models/card";
import {getUpdateOptions} from "../../utils/utils";
import {createError} from "../../utils/response";
import {NotificationService} from "./notificationService";
import {
    NotificationGroup,
    NotificationImportance,
    NotificationStrategy,
    NotificationTag
} from "../../models/notification";
import {UserRole} from "../../models/enums/userRole";

export class CardService {

    public async saveCard(userId: string, role: UserRole, bin: string, last4: string, brand: string, expMonth: string, expYear: string, authorization: string, signature: string, reusable: boolean): Promise<ICard> {
        const cardExisted = await this.getCardByLast4(userId, last4, false) != null;
        const card: ICard = await Card.findOneAndUpdate({userId, last4}, {expMonth, expYear, brand, authorization, signature, reusable},
            getUpdateOptions()).lean<ICard>().exec();
        if (!cardExisted) {
            new NotificationService().sendNotification({
                userId: userId,
                role: role,
                ticker: 'New card added',
                title: 'New card added',
                content: `A new card ending in ${card.last4} has been added to your account`,
                tag: NotificationTag.NEW_CARD,
                group: NotificationGroup.CARDS,
                itemId: card._id
            }, NotificationStrategy.PUSH_ONLY);
        }
        return card;
    }

    public async getCardByLast4(userId: string, last4: string, validate = true): Promise<ICard> {
        const card: ICard = await Card.findOne({userId, last4}).lean<ICard>().exec();
        if (!card && validate) throw createError('Card not found', 400);
        return card;
    }

    public async getCards(userId: string): Promise<ICard[]> {
        return await Card.find({userId}).lean<ICard>().exec();
    }

    public async getCard(userId: string, cardId: string, validate = true): Promise<ICard> {
        const card: ICard = await Card.findById(cardId).lean<ICard>().exec();
        if (!card) throw createError('Card not found', 400);
        return card;
    }
}
