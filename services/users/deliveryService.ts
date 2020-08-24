import {Delivery, IDelivery, IStop} from "../../models/delivery";
import {DeliveryState} from "../../models/enums/deliveryState";
import {createError} from "../../utils/response";
import {IUser, User} from "../../models/user";
import {PreferenceService} from "../shared/preferenceService";
import {DeliveryService as HandlerDeliveryService} from "../drivers/deliveryService";
import {
    NotificationGroup,
    NotificationImportance,
    NotificationStrategy,
    NotificationTag
} from "../../models/notification";
import {NotificationService} from "../shared/notificationService";
import {UserRole} from "../../models/enums/userRole";

export class DeliveryService {

    public async getActiveDeliveries(userId: string): Promise<IDelivery[]> {
        return await Delivery.find(Object.assign(
            DeliveryService.getOwnedDeliveryConditions(userId),
            {state: {$in: DeliveryService.getActiveDeliveryStates()}}
        )).populate('sender driverLocation.userId stops.receiver').lean<IDelivery>().exec();
    }

    public async getPastDeliveries(userId: string): Promise<IDelivery[]> {
        return await Delivery.find(Object.assign(
            DeliveryService.getOwnedDeliveryConditions(userId),
            {state: {$in: DeliveryService.getCompleteDeliveryStates()}}
        )).populate('sender driverLocation.userId stops.receiver').lean<IDelivery>().exec();
    }

    public async requestDelivery(userId: string, body: IDelivery): Promise<IDelivery> {
        body.sender = userId;
        if (!body.pickUpLocation || !body.pickUpLocation.latitude || !body.pickUpLocation.longitude)
            throw createError('Pick up location is required', 400);
        if (!body.stops || body.stops.length === 0) throw createError('At least one stop is required', 400);
        body.stops = await Promise.all(body.stops.map(async (stop, index) => {
            const stopIndex = index + 1;
            if (!(stop as any).receiverName) throw createError(`Receiver name has not been set at stop ${stopIndex}`, 400);
            if (!(stop as any).receiverEmail) throw createError(`Receiver email has not been set at stop ${stopIndex}`, 400);
            if (!stop.location || !stop.location.latitude || !stop.location.longitude)
                throw createError(`Location has not been set for stop ${stopIndex}`, 400);
            const name = (stop as any).receiverName;
            const email = (stop as any).receiverEmail;
            const receiver: IUser = await User.findOne({email}).lean<IUser>().exec();
            stop.rawReceiver = {name, email};
            if (receiver) stop.receiver = receiver._id;
            return stop;
        }));
        const preferenceService = new PreferenceService();
        body.billing = {
            paymentMethod: await preferenceService.getPaymentMethodPreference(userId),
            baseFare: 0,
            paid: false,
            priceForKm: 0,
            pricePerKm: 0
        };
        const delivery: IDelivery = await new Delivery(body).save();
        HandlerDeliveryService.notifyClosestDriversOfNewDelivery(delivery);
        return await this.getDeliveryById(delivery._id);
    }

    public async getDeliveryById(id: string, validate = true): Promise<IDelivery> {
        const delivery: IDelivery = await Delivery.findById(id)
            .populate(DeliveryService.getPopulateFields())
            .lean<IDelivery>().exec();
        if (!delivery && validate)
            throw createError('Delivery not found', 400);
        return delivery;
    }

    public static async sendNotificationUpdate(deliveryId: string, ticker: string, title: string, content: string, currentStop?: IStop, group = NotificationGroup.DELIVERY_UPDATE, tag = NotificationTag.DELIVERY_UPDATE): Promise<IDelivery> {
        const deliveryService = new DeliveryService();
        const delivery: IDelivery = await deliveryService.getDeliveryById(deliveryId);
        const sender: IUser = delivery.sender as IUser;
        let userId: string;
        if (currentStop) {
            const receiver = currentStop.receiver as IUser;
            if (receiver) userId = receiver._id;
            await Delivery.findOneAndUpdate({_id: deliveryId, 'stops._id': currentStop._id}, {
                'stops.$.lastMessageToReceiver': content
            }).exec();
        } else {
            userId = sender._id;
            await Delivery.findByIdAndUpdate(deliveryId, {lastMessageToSender: content}).lean<IDelivery>().exec();
        }
        if (!userId) {
            console.warn(`Cannot send delivery notification to basic user: ${userId}, for receiver: ${userId}`);
            return delivery;
        }
        new NotificationService().sendNotification({
            userId: userId,
            role: UserRole.BASIC,
            ticker: ticker,
            title: title,
            content: content,
            group: group,
            tag: tag,
            itemId: delivery._id,
            importance: NotificationImportance.HIGH
        }, NotificationStrategy.PUSH_ONLY, false);
        return delivery;
    }

    private static getCurrentStop(delivery: IDelivery): IStop | null {
        const stops: IStop[] = delivery.stops;
        const currentStop = stops.filter(stop => stop.state === DeliveryState.DROPPING_OFF)[0];
        return currentStop != null ? currentStop : stops[delivery.stops.length - 1];
    }

    private static getCurrentReceiver(delivery: IDelivery): IUser | undefined {
        const currentStop = this.getPendingStop(delivery);
        return currentStop?.receiver as IUser;
    }

    private static getPendingStop(delivery: IDelivery, validate = true): IStop | null {
        const stops: IStop[] = delivery.stops;
        const pendingStop = stops.filter(stop => stop.state === DeliveryState.PENDING)[0];
        if (!pendingStop && validate)
            throw createError('Stop not found or already active', 400);
        return pendingStop;
    }

    public static getOwnedDeliveryConditions(userId: string) {
        return {
            $or: [
                {sender: userId}, {'stops.receiver': userId},
            ]
        };
    }

    public static getActiveDeliveryStates(): DeliveryState[] {
        return [
            DeliveryState.PENDING,
            DeliveryState.ACCEPTED,
            DeliveryState.PICKING_UP,
            DeliveryState.DROPPING_OFF
        ];
    }

    public static getCompleteDeliveryStates(): DeliveryState[] {
        return [
            DeliveryState.COMPLETE,
            DeliveryState.CANCELLED
        ];
    }

    private static getPopulateFields(): string {
        return 'sender driverLocation.userId stops.receiver';
    }
}
