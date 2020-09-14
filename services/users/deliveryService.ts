import {Delivery, IDelivery, IStop} from "../../models/delivery";
import {DeliveryState} from "../../models/enums/deliveryState";
import {createError} from "../../utils/response";
import {IUser, User} from "../../models/user";
import {PreferenceService} from "../shared/preferenceService";
import {DeliveryService as HandlerDeliveryService} from "../drivers/deliveryService";
import {EmailNotificationService as AdminEmailNotificationService} from "../admins/emailNotificationService";
import {
    NotificationGroup,
    NotificationImportance,
    NotificationStrategy,
    NotificationTag
} from "../../models/notification";
import {NotificationService} from "../shared/notificationService";
import {UserRole} from "../../models/enums/userRole";
import {IBilling} from "../../models/interfaces/billing";
import {ParcelCategoryService} from "../shared/parcelCategoryService";
import {normalizePhone, stripUpdateFields} from "../../utils/utils";
import {PaymentMethodType} from "../../models/enums/paymentMethod";
import {WalletService} from "../shared/walletService";
import {EmailTemplateId} from "../../models/interfaces/emailTemplatePayload";
import {format} from "currency-formatter";
import {ImageContainer, UploadService} from "../../routes/shared/uploadService";

export class DeliveryService {

    public async getActiveDeliveries(userId: string): Promise<IDelivery[]> {
        return await Delivery.find(Object.assign(
            DeliveryService.getOwnedDeliveryConditions(userId),
            {state: {$in: DeliveryService.getActiveDeliveryStates()}}))
            .populate('sender driverLocation.userId stops.receiver')
            .sort({createdAt: 'desc'})
            .lean<IDelivery>().exec();
    }

    public async getPastDeliveries(userId: string): Promise<IDelivery[]> {
        return await Delivery.find(Object.assign(
            DeliveryService.getOwnedDeliveryConditions(userId),
            {state: {$in: DeliveryService.getCompleteDeliveryStates()}}
        )).populate('sender driverLocation.userId stops.receiver')
            .sort({createdAt: 'desc'})
            .lean<IDelivery>().exec();
    }

    public async getBilling(userId: string, delivery: IDelivery): Promise<IBilling> {
        delivery = await DeliveryService.validateDelivery(delivery);
        const parcelCategoryService = new ParcelCategoryService();
        const preferenceService = new PreferenceService();
        const onPeek = false;
        const paymentMethod = await preferenceService.getPaymentMethodPreference(userId);
        const stops: IStop[] = await Promise.all([].concat(...delivery.stops).map(async (stop: IStop) => {
            (stop as any).price = await parcelCategoryService.getCurrentCategoryPrice(stop.parcel.category, stop.location.zone, onPeek);
            return stop;
        }));
        const totalFare: number = stops.reduce((total, currentValue) => {
            total += (currentValue as any).price;
            return total;
        }, 0);
        return {totalFare, onPeek, paymentMethod};
    }

    public async checkBalance(userId: string, role: UserRole, delivery: IDelivery): Promise<IBilling>  {
        const billing = await this.getBilling(userId, delivery);
        if (billing.paymentMethod.type === PaymentMethodType.WALLET) {
            await new WalletService().takeValue(userId, role, billing.totalFare, 'Payment for delivery', true);
        }
        return billing;
    }

    public async requestDelivery(userId: string, role: UserRole, files: {originalname: string, filename: string, imageUri?: string}[], body: IDelivery): Promise<IDelivery> {
        console.log('Files:', files);
        console.log('Body: ', body);
        for (const file of files) {
            file.imageUri = await new UploadService().uploadFile(file, ImageContainer.IMAGES);
        }
        body.pickUpLocation = JSON.parse(body.pickUpLocation as any);
        body.stops = Array.isArray(body.stops) ? body.stops.map(stop => JSON.parse(stop as any)) : [JSON.parse(body.stops)];
        body = await DeliveryService.validateDelivery(body);
        for (const stop of body.stops) {
            stop.parcel.contentUri = (files.filter(file => file.originalname.includes(stop.identifier))[0]).imageUri;
        }
        body.sender = userId;
        body.billing = await this.getBilling(userId, body);
        const billing = body.billing;
        stripUpdateFields(body);
        let delivery = new Delivery(body);
        await delivery.validate();
        if (billing.paymentMethod.type === PaymentMethodType.WALLET) {
            await new WalletService().takeValue(userId, role, billing.totalFare, `Payment for delivery '${delivery.deliveryId}'`, false);
        }
        delivery = await new Delivery(body).save();
        delivery = await this.getDeliveryById(delivery._id);
        HandlerDeliveryService.notifyClosestDriversOfNewDelivery(delivery);
        const sender = delivery.sender as IUser;
        const lastStop: IStop = delivery.stops[delivery.stops.length - 1];
        new AdminEmailNotificationService().sendEmail(
            `New Delivery`,
            `New Delivery`,
            {
                templateId: EmailTemplateId.ADMIN_DELIVERY_UPDATE,
                data: [
                    {
                        key: 'title',
                        value: `${sender.firstName} placed a delivery`
                    },
                    {
                        key: 'pick_up_location',
                        value: delivery.pickUpLocation.address
                    },
                    {
                        key: 'drop_off_location',
                        value: lastStop.location?.address
                    },
                    {
                        key: 'sender',
                        value: sender.firstName
                    },
                    {
                        key: 'parcel',
                        value: lastStop.parcel.title
                    },
                    {
                        key: 'price',
                        value: format(delivery.billing.totalFare, {code: 'NGN'})
                    }
                ]
            }
        )
        return await this.getDeliveryById(delivery._id);
    }

    public async rate(id: string, body: any): Promise<IDelivery> {
        if (!body.rating) throw createError('Rating is required', 400);
        const userRating = body.rating;
        const userComment = body.comment;
        const delivery: IDelivery = await Delivery.findByIdAndUpdate(id, {userRating, userComment}).exec();
        HandlerDeliveryService.assignAverageRating(delivery.driverLocation.userId as string)
        return await this.getDeliveryById(id);
    }

    public async getDeliveryById(id: string, validate = true): Promise<IDelivery> {
        const delivery: IDelivery = await Delivery.findById(id)
            .populate(DeliveryService.getPopulateFields())
            .lean<IDelivery>().exec();
        if (!delivery && validate)
            throw createError('Delivery not found', 400);
        return delivery;
    }

    public static async validateDelivery(delivery: IDelivery): Promise<IDelivery> {
        console.log('Validating: ', JSON.stringify(delivery));
        if (!delivery.pickUpLocation || !delivery.pickUpLocation.latitude || !delivery.pickUpLocation.longitude)
            throw createError('Pick up location is required', 400);
        if (!delivery.stops || delivery.stops.length === 0) throw createError('At least one stop is required', 400);
        delivery.stops = await Promise.all(delivery.stops.map(async (stop, index) => {
            const stopIndex = index + 1;
            if (!stop.rawReceiver?.name) throw createError(`Receiver name has not been set at stop ${stopIndex}`, 400);
            if (!stop.rawReceiver?.phone) throw createError(`Receiver phone has not been set at stop ${stopIndex}`, 400);
            if (!stop.location || !stop.location.latitude || !stop.location.longitude)
                throw createError(`Location has not been set for stop ${stopIndex}`, 400);
            if (!stop.location.zone) throw createError(`Zone has not been set at stop ${stopIndex}`, 400);
            if (!stop.location.zone.zoneClass) throw createError(`Zone class has not been set at stop ${stopIndex}`, 400);
            if (!stop.parcel) throw createError(`Parcel has not been set at stop ${stopIndex}`, 400);
            if (!stop.parcel.title) throw createError(`Parcel title has not been set at stop ${stopIndex}`, 400);
            if (!stop.parcel.category) throw createError(`Parcel category has not been set at stop ${stopIndex}`, 400);
            if (!stop.parcel.quantity || stop.parcel.quantity < 1) throw createError(`Parcel quantity at stop ${stopIndex} cannot be lower than 1`, 400);
            const phone = normalizePhone(stop.rawReceiver.phone);
            const receiver: IUser = await User.findOne({phone}).lean<IUser>().exec();
            if (receiver) stop.receiver = receiver._id;
            return stop;
        }));
        return delivery;
    }

    public static async sendNotificationUpdate(deliveryId: string, ticker: string, title: string, content: string, currentStop?: IStop, group = NotificationGroup.DELIVERIES, tag = NotificationTag.DELIVERY_UPDATE): Promise<IDelivery> {
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
