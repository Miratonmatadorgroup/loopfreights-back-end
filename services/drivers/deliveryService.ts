import {Delivery, IDelivery, IStop} from "../../models/delivery";
import {IDriverLocation} from "../../models/driverLocation";
import {LocationService} from "./locationService";
import {IBaseLocation} from "../../models/interfaces/location";
import {NotificationService} from "../shared/notificationService";
import {
    NotificationGroup,
    NotificationImportance,
    NotificationStrategy,
    NotificationTag
} from "../../models/notification";
import {UserRole} from "../../models/enums/userRole";
import {createError} from "../../utils/response";
import {DeliveryState} from "../../models/enums/deliveryState";
import {IUser} from "../../models/user";
import {DeliveryService as UsersDeliveryService} from "../users/deliveryService";
import moment from "moment";

export class DeliveryService {

    public async acceptDelivery(userId: string, id: string): Promise<IDelivery> {
        let delivery: IDelivery = await this.getDeliveryById(id);
        if (delivery.state !== DeliveryState.PENDING)
            throw createError('Delivery already accepted', 400);
        const driverLocation = await new LocationService().getLocation(userId);
        (driverLocation as any).driver = userId;
        delivery = await Delivery.findByIdAndUpdate(id, {driverLocation, state: DeliveryState.ACCEPTED}, {new: true})
            .populate(DeliveryService.getPopulateFields())
            .lean<IDelivery>().exec();
        const sender: IUser = delivery.sender as IUser;
        const driver: IUser = delivery.driverLocation.userId as IUser;
        await UsersDeliveryService.sendNotificationUpdate(
            delivery._id,
            `Delivery accepted`,
            `Delivery accepted`,
            `${driver.firstName} has accepted your delivery`,
        );
        delivery = await DeliveryService.sendNotificationUpdate(
            delivery._id,
            `Delivery accepted`,
            `Delivery accepted`,
            `Please proceed to pick up from ${sender.firstName}`
        );
        return delivery;
    }

    public async startPickUp(userId: string, id: string): Promise<IDelivery> {
        let delivery: IDelivery = await this.getDeliveryById(id, userId);
        delivery = await Delivery.findByIdAndUpdate(delivery._id, {state: DeliveryState.ACCEPTED}, {new: true})
            .populate(DeliveryService.getPopulateFields())
            .lean<IDelivery>().exec();
        const driver: IUser = delivery.driverLocation.userId as IUser;
        await UsersDeliveryService.sendNotificationUpdate(
            delivery._id,
            `${driver.firstName} is coming to you`,
            `Delivery En-Route`,
            `${driver.firstName} is coming to you`
        );
        delivery = await DeliveryService.sendNotificationUpdate(
            delivery._id,
            `Delivery accepted`,
            `Delivery accepted`,
            `Start your drive to ${delivery.pickUpLocation.address}`
        );
        return delivery;
    }

    public async arrived(userId: string, id: string): Promise<IDelivery> {
        let delivery: IDelivery = await this.getDeliveryById(id, userId);
        const arrivalTime = moment().toDate();
        delivery = await Delivery.findByIdAndUpdate(delivery._id, {arrivalTime}, {new: true})
            .populate(DeliveryService.getPopulateFields())
            .lean<IDelivery>().exec();
        const sender: IUser = delivery.sender as IUser;
        const driver: IUser = delivery.driverLocation.userId as IUser;
        await UsersDeliveryService.sendNotificationUpdate(
            delivery._id,
            `${driver.firstName} has arrived`,
            `Driver has arrived`,
            `Please don't keep ${driver.firstName} waiting`
        );
        delivery = await DeliveryService.sendNotificationUpdate(
            delivery._id,
            `Wait for ${sender.firstName}`,
            `Please wait`,
            `${sender.firstName} should be with you shortly`
        );
        return delivery;
    }

    public async startDropOff(userId: string, id: string): Promise<IDelivery> {
        let delivery: IDelivery = await this.getDeliveryById(id, userId);
        const pendingStop: IStop = DeliveryService.getPendingStop(delivery);
        const dropOffStartTime = moment().toDate();
        delivery = await Delivery.findOneAndUpdate({_id: id, 'stops._id': pendingStop._id}, {
            state: DeliveryState.DROPPING_OFF,
            'stops.$.state': DeliveryState.DROPPING_OFF,
            'stops.$.dropOffStartTime': dropOffStartTime,
        }, {new: true})
            .populate(DeliveryService.getPopulateFields())
            .exec();
        const sender: IUser = delivery.sender as IUser;
        const driver: IUser = delivery.driverLocation.userId as IUser;
        const receiver: IUser = pendingStop.receiver as IUser;
        await UsersDeliveryService.sendNotificationUpdate(
            delivery._id,
            `Driver is delivering`,
            `Driver is delivering`,
            `${driver.firstName} is now delivering to ${pendingStop.rawReceiver.name}`
        );
        delivery = await DeliveryService.sendNotificationUpdate(
            delivery._id,
            `Drop off started`,
            `Drop off started`,
            `Next stop: deliver to ${pendingStop.rawReceiver.name} at ${pendingStop.location.address}`
        );
        if (receiver) {
            await UsersDeliveryService.sendNotificationUpdate(
                delivery._id,
                `You have a delivery coming to you`,
                `You have a delivery coming to you`,
                `${driver.firstName} is bring you a delivery from  ${sender.firstName}`,
                pendingStop
            );
        }
        return delivery;
    }

    public async endDropOff(userId: string, id: string): Promise<IDelivery> {
        let delivery: IDelivery = await this.getDeliveryById(id, userId);
        const currentStop: IStop = DeliveryService.getCurrentStop(delivery);
        const nextStop: IStop = DeliveryService.getPendingStop(delivery, false);
        const dropOffEndTime = moment().toDate();
        delivery = await Delivery.findOneAndUpdate({_id: id, 'stops._id': currentStop._id}, {
            state: DeliveryState.DROPPING_OFF,
            'stops.$.dropOffStartTime': dropOffEndTime,
            'stops.$.state': DeliveryState.AWAITING_SIGNATURE,
        }, {new: true})
            .populate(DeliveryService.getPopulateFields())
            .exec();
        const sender: IUser = delivery.sender as IUser;
        const driver: IUser = delivery.driverLocation.userId as IUser;
        const receiver: IUser = currentStop.receiver as IUser;
        await UsersDeliveryService.sendNotificationUpdate(
            delivery._id,
            `Driver is waiting for confirmation`,
            `Driver is waiting for confirmation`,
            `Please input code (${currentStop.verificationCode}) or send to receiver for confirmation`,
        );
        delivery = await DeliveryService.sendNotificationUpdate(
            delivery._id,
            `Please collect signature`,
            `Please collect signature`,
            `Please present your app to ${currentStop.rawReceiver.name} to input 4 digit confirmation code`
        );
        if (receiver) {
            await UsersDeliveryService.sendNotificationUpdate(
                delivery._id,
                `Please confirm delivery`,
                `Please confirm delivery`,
                `Please input code (${currentStop.verificationCode}) on ${driver.firstName}'s device to confirm delivery`,
                currentStop
            );
        }
        return delivery;
    }

    public async confirmDelivery(userId: string, id: string, body: any) {
        const verificationCode = body.verificationCode;
        if (!verificationCode) throw createError('Verification code is required', 400);
        let delivery: IDelivery = await this.getDeliveryById(id, userId);
        const currentStop: IStop = DeliveryService.getCurrentStop(delivery);
        if (verificationCode !== currentStop.verificationCode)
            throw createError('Incorrect confirmation code', 400);
        const nextStop: IStop = DeliveryService.getPendingStop(delivery, false);
        delivery = await Delivery.findOneAndUpdate({_id: id, 'stops._id': currentStop._id}, {
            state: nextStop != null ? DeliveryState.DROPPING_OFF : DeliveryState.COMPLETE,
            'stops.$.state': DeliveryState.COMPLETE,
        }, {new: true})
            .populate(DeliveryService.getPopulateFields())
            .exec();
        const sender: IUser = delivery.sender as IUser;
        const driver: IUser = delivery.driverLocation.userId as IUser;
        const receiver: IUser = currentStop.receiver as IUser;
        if (nextStop != null) {
            await UsersDeliveryService.sendNotificationUpdate(
                delivery._id,
                `Delivery confirmed`,
                `Delivery confirmed`,
                `Delivery to ${currentStop.rawReceiver.name} has been confirmed. ${driver.firstName} will deliver to ${nextStop.rawReceiver.name} next`
            );
            delivery = await DeliveryService.sendNotificationUpdate(
                delivery._id,
                `Delivery confirmed`,
                `Delivery confirmed`,
                `Please proceed to deliver to ${nextStop.rawReceiver.name}`
            );
        } else {
            await UsersDeliveryService.sendNotificationUpdate(
                delivery._id,
                `Delivery confirmed`,
                `Delivery confirmed`,
                `Thank you for using LoopFreights`
            );
            delivery = await DeliveryService.sendNotificationUpdate(
                delivery._id,
                `Delivery confirmed`,
                `Delivery confirmed`,
                `Thank you for your service`
            );
        }
        if (receiver) {
            await UsersDeliveryService.sendNotificationUpdate(
                receiver._id,
                `Delivery confirmed`,
                `Delivery confirmed`,
                `Thank you for using LoopFreights`,
                currentStop
            );
        }
        return delivery;
    }

    private static async sendNotificationUpdate(deliveryId: string, ticker: string, title: string, content: string, group = NotificationGroup.DELIVERY_UPDATE, tag = NotificationTag.DELIVERY_UPDATE): Promise<IDelivery> {
        const delivery: IDelivery = await Delivery.findByIdAndUpdate(deliveryId, {lastMessageToDriver: content})
            .populate(DeliveryService.getPopulateFields())
            .lean<IDelivery>().exec();
        const user: IUser = delivery.driverLocation.userId as IUser;
        new NotificationService().sendNotification({
            userId: user._id,
            role: UserRole.DRIVER,
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

    public async getDeliveryById(id: string, driverId?: string, validate = true): Promise<IDelivery> {
        const query = driverId ? {_id: id, 'driverLocation.userId': driverId} : {_id: id};
        const delivery: IDelivery = await Delivery.findOne(query)
            .populate(DeliveryService.getPopulateFields())
            .lean<IDelivery>().exec();
        if (!delivery && validate)
            throw createError('Delivery not found', 404);
        return delivery;
    }

    private static getPendingStop(delivery: IDelivery, validate = true): IStop | null {
        const stops: IStop[] = delivery.stops;
        const pendingStop = stops.filter(stop => stop.state === DeliveryState.PENDING)[0];
        if (!pendingStop && validate)
            throw createError('Stop not found or already active', 400);
        return pendingStop;
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

    public static notifyClosestDriversOfNewDelivery(delivery: IDelivery) {
        new Promise(async (accept, reject) => {
            try {
                const pickupLocation: IBaseLocation = delivery.pickUpLocation;
                const notificationService = new NotificationService();
                const driverLocations: IDriverLocation[] = await new LocationService().getClosestDriversTo(pickupLocation.latitude, pickupLocation.longitude);
                console.log('Driver locations: ', driverLocations.length);
                for (const driverLocation of driverLocations) {
                    notificationService.sendNotification({
                        userId: driverLocation.userId as string,
                        role: UserRole.DRIVER,
                        ticker: `Delivery request`,
                        title: `Delivery request`,
                        content: `New delivery request around ${pickupLocation.address}`,
                        group: NotificationGroup.DELIVERY_REQUEST,
                        tag: NotificationTag.DELIVERY_REQUEST,
                        importance: NotificationImportance.HIGH,
                        useSound: true
                    }, NotificationStrategy.PUSH_ONLY, false);
                }
            } catch (e) {
                reject(e);
            }
        }).catch(err => {
            console.error('Error notifying drivers of new delivery: ', err);
        });
    }

    private static getPopulateFields(): string {
        return 'sender driverLocation.userId stops.receiver';
    }
}
