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
import {IBilling, IBillingItem} from "../../models/interfaces/billing";
import {normalizePhone, stripUpdateFields} from "../../utils/utils";
import {PaymentMethodType} from "../../models/enums/paymentMethod";
import {WalletService} from "../shared/walletService";
import {EmailTemplateId} from "../../models/interfaces/emailTemplatePayload";
import {format} from "currency-formatter";
import {ImageContainer, UploadService} from "../shared/uploadService";
import util from 'util';
import {GeolocationService} from "../shared/geolocationService";
import convert from "convert-units";
import {WeightClassService} from "../shared/weightClassService";
import {CarriageTypeService} from "../shared/carriageTypeService";

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
        const pickUpLocation = delivery.pickUpLocation;
        const stops = delivery.stops
        const totalWeight = stops.reduce((total, currentValue) => {
            total += currentValue.parcel.weight
            return total;
        }, 0)
        console.log('Total weight: ', totalWeight)
        const geolocationService = new GeolocationService()
        const distanceMatrix = (await geolocationService.getDistanceMatrix(pickUpLocation.latitude, pickUpLocation.longitude, stops.map(stop => stop.location)))[0]
        const distanceInMeters = distanceMatrix?.elements[0]?.distance?.value
        const totalTime = distanceMatrix?.elements[0]?.duration?.value
        const totalDistance = convert(distanceInMeters).from('m').to('km')
        console.log('Distance matrix: ', util.inspect(distanceMatrix, true, 5, true))
        console.log(`>>> Distance in meters: ${distanceInMeters}, distance in kilometers: ${totalDistance}`)
        const weightClass = await new WeightClassService().getWeightClassByWeight(totalWeight)
        const carriageType = await new CarriageTypeService().getCarriageTypeByIdentifier(weightClass.carriageTypeIdentifier)
        const priceForDistance = weightClass.pricePerKm * totalDistance
        const priceForWeight = totalWeight * weightClass.pricePerKg
        const priceForTime = 0;
        const preferenceService = new PreferenceService();
        const paymentMethod = await preferenceService.getPaymentMethodPreference(userId);

        const currencyFormatOptions: { code: string } = {code: 'NGN'}

        const items: IBillingItem[] = [
            {
                title: 'Base Fare',
                value: weightClass.baseFare,
                valueText: format(weightClass.baseFare, currencyFormatOptions)
            },
            {
                title: 'Booking Fare',
                value: weightClass.bookingFee,
                valueText: format(weightClass.bookingFee, currencyFormatOptions)
            },
            {
                title: 'Distance',
                value: priceForDistance,
                valueText: format(priceForDistance, currencyFormatOptions)
            },
            {
                title: 'Weight',
                value: priceForWeight,
                valueText: format(priceForWeight, currencyFormatOptions)
            },
            {
                title: 'Time',
                value: priceForTime,
                valueText: format(priceForTime, currencyFormatOptions)
            }
        ]
        const totalFare: number = items.reduce((total: number, currentValue) => {
            total += currentValue.value
            return total
        }, 0)
        const totalFareText = format(totalFare, currencyFormatOptions)

        return {
            totalFare,
            totalFareText,
            items,
            carriageType,
            weightClass,
            paymentMethod
        };
    }

    public async checkBalance(userId: string, role: UserRole, delivery: IDelivery): Promise<IBilling> {
        const billing = await this.getBilling(userId, delivery);
        if (billing.paymentMethod.type === PaymentMethodType.WALLET) {
            await new WalletService().takeValue(userId, role, billing.totalFare, 'Payment for delivery', true);
        }
        return billing;
    }

    public async requestDelivery(userId: string, role: UserRole, files: { originalname: string, filename: string, imageUri?: string }[], body: IDelivery): Promise<IDelivery> {
        console.log('Files:', files);
        console.log('Body: ', util.inspect(body, true, 5, true));
        body.pickUpLocation = JSON.parse(body.pickUpLocation as any);
        body.stops = Array.isArray(body.stops) ? body.stops.map(stop => JSON.parse(stop as any)) : [JSON.parse(body.stops)];
        body = await DeliveryService.validateDelivery(body);
        for (const file of files) {
            file.imageUri = await new UploadService().uploadFile(file, ImageContainer.IMAGES);
        }
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
                        value: lastStop.parcel.description
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
        console.log('Validating: ', delivery);
        if (!delivery.pickUpLocation || !delivery.pickUpLocation.latitude || !delivery.pickUpLocation.longitude)
            throw createError('Pick up location is required', 400);
        if (!delivery.stops || delivery.stops.length === 0) throw createError('At least one stop is required', 400);
        delivery.stops = await Promise.all(delivery.stops.map(async (stop, index) => {
            console.log('Checking stop: ', stop);
            const stopIndex = index + 1;
            if (!stop.identifier) throw createError('Stop identifier is required', 400);
            if (!stop.rawReceiver?.name) throw createError(`Receiver name has not been set at stop ${stopIndex}`, 400);
            if (!stop.rawReceiver?.phone) throw createError(`Receiver phone has not been set at stop ${stopIndex}`, 400);
            if (!stop.location || !stop.location.latitude || !stop.location.longitude)
                throw createError(`Location has not been set for stop ${stopIndex}`, 400);
            // if (!stop.location.zone) throw createError(`Zone has not been set at stop ${stopIndex}`, 400);
            // if (!stop.location.zone.zoneClass) throw createError(`Zone class has not been set at stop ${stopIndex}`, 400);
            if (!stop.parcel) throw createError(`Parcel has not been set at stop ${stopIndex}`, 400);
            if (!stop.parcel.description) throw createError(`Parcel description has not been set at stop ${stopIndex}`, 400);
            if (!stop.parcel.quantity || stop.parcel.quantity < 1) throw createError(`Parcel quantity at stop ${stopIndex} cannot be lower than 1`, 400);
            if (!stop.parcel.weight || stop.parcel.weight < 1) throw createError(`Parcel weight at stop ${stopIndex} cannot be lower than 1`, 400);
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

    public static assignAverageRating(userId: string) {
        new Promise(async (accept, reject) => {
            try {
                console.log('Assigning average rating: ', userId);
                const deliveries: IDelivery[] = await Delivery.find({sender: userId}).lean<IDelivery>().exec();
                const totalDeliveries: number = deliveries.length
                const totalRating: number = deliveries.reduce((total, currentValue) => {
                    total += currentValue.userRating
                    return total;
                }, 0);
                const average = totalRating / totalDeliveries;
                await User.findByIdAndUpdate(userId, {
                    'userProfile.averageRating': average,
                    'userProfile.totalRating': totalRating,
                }).exec();
            } catch (e) {
                reject(e);
            }
        }).catch(err => {
            console.error('Error applying average rating');
        })
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
