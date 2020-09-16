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
import {IUser, User} from "../../models/user";
import {DeliveryService as UsersDeliveryService} from "../users/deliveryService";
import moment from "moment";
import {GeolocationService} from "../shared/geolocationService";
import {EarningService} from "../shared/earningService";

export class DeliveryService {

    public async getDeliveryRequests(userId: string): Promise<IDelivery[]> {
        return await Delivery.find({state: DeliveryState.PENDING})
            .populate('sender driverLocation.userId stops.receiver')
            .sort({createdAt: 'desc'})
            .lean<IDelivery>().exec();
    }

    public async getActiveDeliveries(userId: string): Promise<IDelivery[]> {
        return await Delivery.find({'driverLocation.userId' : userId, state: {$in: DeliveryService.getActiveDeliveryStates()}})
            .populate('sender driverLocation.userId stops.receiver')
            .sort({createdAt: 'desc'})
            .lean<IDelivery>().exec();
    }

    public async getActiveDeliveriesCount(userId: string): Promise<number> {
        return await Delivery.countDocuments({'driverLocation.userId' : userId, state: {$in: DeliveryService.getActiveDeliveryStates()}})
            .exec();
    }

    public async acceptDelivery(userId: string, id: string): Promise<IDelivery> {
        let delivery: IDelivery = await this.getDeliveryById(id);
        if (delivery.state !== DeliveryState.PENDING)
            throw createError('Delivery already accepted', 400);
        const driverLocation = await new LocationService().getLocation(userId);
        (driverLocation as any).driver = userId;
        const acceptedTime = moment().toDate();
        delivery = await Delivery.findByIdAndUpdate(id, {driverLocation, acceptedTime, state: DeliveryState.ACCEPTED, pathToNextStop: null, etaToNextStop: null}, {new: true})
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
        await DeliveryService.sendNotificationUpdate(
            delivery._id,
            `Delivery accepted`,
            `Delivery accepted`,
            `Please proceed to pick up from ${sender.firstName}`
        );
        return await this.getDeliveryById(id);
    }

    public async startPickUp(userId: string, id: string): Promise<IDelivery> {
        let delivery: IDelivery = await this.getDeliveryById(id);
        delivery = await Delivery.findByIdAndUpdate(delivery._id, {state: DeliveryState.PICKING_UP}, {new: true})
            .populate(DeliveryService.getPopulateFields())
            .lean<IDelivery>().exec();
        const driver: IUser = delivery.driverLocation.userId as IUser;
        await UsersDeliveryService.sendNotificationUpdate(
            delivery._id,
            `${driver.firstName} is coming to you`,
            `Delivery En-Route`,
            `${driver.firstName} is coming to you`
        );
        await DeliveryService.sendNotificationUpdate(
            delivery._id,
            `Pickup started`,
            `Pickup started`,
            `Start your drive to ${delivery.pickUpLocation.address}`
        );
        return await this.getDeliveryById(id);
    }

    public async arrived(userId: string, id: string): Promise<IDelivery> {
        let delivery: IDelivery = await this.getDeliveryById(id);
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
        await DeliveryService.sendNotificationUpdate(
            delivery._id,
            `Wait for ${sender.firstName}`,
            `Please wait`,
            `${sender.firstName} should be with you shortly`
        );
        return await this.getDeliveryById(id);
    }

    public async startDropOff(userId: string, id: string): Promise<IDelivery> {
        let delivery: IDelivery = await this.getDeliveryById(id);
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
        await DeliveryService.sendNotificationUpdate(
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
        return await this.getDeliveryById(id);
    }

    public async endDropOff(userId: string, id: string): Promise<IDelivery> {
        let delivery: IDelivery = await this.getDeliveryById(id);
        const currentStop: IStop = DeliveryService.getCurrentStop(delivery);
        const nextStop: IStop = DeliveryService.getPendingStop(delivery, false);
        const dropOffEndTime = moment().toDate();
        delivery = await Delivery.findOneAndUpdate({_id: id, 'stops._id': currentStop._id}, {
            state: DeliveryState.DROPPING_OFF,
            'stops.$.dropOffEndTime': dropOffEndTime,
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
        await DeliveryService.sendNotificationUpdate(
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
        return await this.getDeliveryById(id);
    }

    public async confirmDelivery(userId: string, id: string, body: any) {
        const verificationCode = body.verificationCode;
        if (!verificationCode) throw createError('Verification code is required', 400);
        let delivery: IDelivery = await this.getDeliveryById(id);
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
            await DeliveryService.sendNotificationUpdate(
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
            await UsersDeliveryService.sendNotificationUpdate(
                delivery._id,
                `Please rate your rider`,
                `Please rate your rider`,
                `Your feedback is very important to us`,
                currentStop,
                NotificationGroup.DELIVERIES,
                NotificationTag.RATE
            );
            await DeliveryService.sendNotificationUpdate(
                delivery._id,
                `Delivery confirmed`,
                `Delivery confirmed`,
                `Thank you for your service`
            );
            // Add Driver Earnings
            await new EarningService().addEarning(driver._id, UserRole.DRIVER, driver.driverProfile.type, delivery.billing.totalFare);
        }
        if (receiver) {
            await UsersDeliveryService.sendNotificationUpdate(
                delivery._id,
                `Delivery confirmed`,
                `Delivery confirmed`,
                `Thank you for using LoopFreights`,
                currentStop
            );
        }
        return await this.getDeliveryById(id);
    }

    public async rate(id: string, body: any): Promise<IDelivery> {
        if (!body.rating) throw createError('Rating is required', 400);
        const riderRating = body.rating;
        const riderComment = body.comment;
        const delivery: IDelivery = await Delivery.findByIdAndUpdate(id, {riderRating, riderComment}).exec();
        UsersDeliveryService.assignAverageRating(delivery.sender as string)
        return await this.getDeliveryById(id);
    }

    private static async sendNotificationUpdate(deliveryId: string, ticker: string, title: string, content: string, group = NotificationGroup.DELIVERIES, tag = NotificationTag.DELIVERY_UPDATE): Promise<IDelivery> {
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

    public async getDeliveryById(id: string, validate = true): Promise<IDelivery> {
        const delivery: IDelivery = await Delivery.findById(id)
            .populate(DeliveryService.getPopulateFields())
            .lean<IDelivery>().exec();
        if (!delivery && validate)
            throw createError('Delivery not found', 404);
        return delivery;
    }

    public async getPastDeliveries(userId: string): Promise<IDelivery[]> {
        return await Delivery.find({
            'driverLocation.userId': userId,
            state: {$in: DeliveryService.getCompleteDeliveryStates()}
        }).populate('sender driverLocation.userId stops.receiver')
            .sort({createdAt: 'desc'})
            .lean<IDelivery>().exec();
    }

    public static updateDeliveriesEta(driverLocation: IDriverLocation) {
        new Promise(async (accept, reject) => {
            try {
                const deliveries: IDelivery[] = await Delivery.find({
                    'driverLocation.userId': driverLocation.userId,
                    state: {$in: DeliveryService.getHandlingDeliveryStates()}
                })
                    .populate('sender driverLocation.userId stops.receiver')
                    .sort({createdAt: 'desc'})
                    .lean<IDelivery>().exec();
                const geoLocationService = new GeolocationService();
                for (const delivery of deliveries) {
                    const stopLocation: IBaseLocation = DeliveryService.getCurrentStopLocation(delivery);
                    if (!stopLocation) continue;
                    const distanceMatrix = await geoLocationService.getDistanceMatrix(
                        driverLocation.latitude,
                        driverLocation.longitude,
                        [stopLocation]
                    );
                    const placeRoutes = await geoLocationService.getDirections(
                        driverLocation.latitude,
                        driverLocation.longitude,
                        stopLocation.latitude,
                        stopLocation.longitude
                    );
                    const etaToNextStop = distanceMatrix[0]?.elements[0]?.duration?.text;
                    const pathToNextStop = placeRoutes[0]?.overview_polyline?.points;
                    console.log('Duration in seconds: ', etaToNextStop, pathToNextStop);
                    if (!etaToNextStop) continue;
                    const updatedDelivery = await Delivery.findByIdAndUpdate(delivery._id, {driverLocation, etaToNextStop, pathToNextStop}, {new: true})
                        .populate(DeliveryService.getPopulateFields())
                        .sort({createdAt: 'desc'})
                        .lean<IDelivery>().exec();
                    const driver: IUser = delivery.driverLocation?.userId as IUser;
                    const sender: IUser = delivery.sender as IUser;
                    const receiver: IUser = this.getCurrentStop(delivery)?.receiver as IUser;
                    new NotificationService().sendNotification({
                        userId: driver._id,
                        role: UserRole.DRIVER,
                        ticker: 'Delivery update',
                        title: 'Delivery update',
                        content: 'Delivery update',
                        group: NotificationGroup.DELIVERIES,
                        tag: NotificationTag.DELIVERY_UPDATE,
                        itemId: delivery._id,
                        payload: updatedDelivery,
                        importance: NotificationImportance.HIGH
                    }, NotificationStrategy.SOCKET_ONLY, false);
                    new NotificationService().sendNotification({
                        userId: sender._id,
                        role: UserRole.BASIC,
                        ticker: 'Delivery update',
                        title: 'Delivery update',
                        content: 'Delivery update',
                        group: NotificationGroup.DELIVERIES,
                        tag: NotificationTag.DELIVERY_UPDATE,
                        itemId: delivery._id,
                        payload: updatedDelivery,
                        importance: NotificationImportance.HIGH
                    }, NotificationStrategy.SOCKET_ONLY, false);
                    if (receiver) {
                        new NotificationService().sendNotification({
                            userId: receiver._id,
                            role: UserRole.BASIC,
                            ticker: 'Delivery update',
                            title: 'Delivery update',
                            content: 'Delivery update',
                            group: NotificationGroup.DELIVERIES,
                            tag: NotificationTag.DELIVERY_UPDATE,
                            itemId: delivery._id,
                            payload: updatedDelivery,
                            importance: NotificationImportance.HIGH
                        }, NotificationStrategy.SOCKET_ONLY, false);
                    }
                }
                accept();
            } catch (e) {
                reject(e);
            }
        }).catch(err => console.error('Error updating deliveries eta: ', err));
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

    private static getCurrentStopLocation(delivery: IDelivery): IBaseLocation | null {
        switch (delivery.state) {
            case DeliveryState.ACCEPTED: return delivery.pickUpLocation;
            case DeliveryState.PICKING_UP: return delivery.pickUpLocation;
            case DeliveryState.DROPPING_OFF: {
                const currentStop = DeliveryService.getCurrentStop(delivery);
                return currentStop?.location;
            }
            case DeliveryState.AWAITING_SIGNATURE: {
                const currentStop = DeliveryService.getCurrentStop(delivery);
                return currentStop?.location;
            }
        }
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
                        group: NotificationGroup.DELIVERIES,
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

    public static assignAverageRating(driverId: string) {
        new Promise(async (accept, reject) => {
            try {
                console.log('Assigning average rating: ', driverId);
                const deliveries: IDelivery[] = await Delivery.find({'driverLocation.userId': driverId}).lean<IDelivery>().exec();
                const totalDeliveries: number = deliveries.length
                const totalRating: number = deliveries.reduce((total, currentValue) => {
                    total += currentValue.userRating
                    return total;
                }, 0);
                const average = totalRating / totalDeliveries;
                await User.findByIdAndUpdate(driverId, {
                    'driverProfile.averageRating': average,
                    'driverProfile.totalRating': totalRating,
                }).exec();
            } catch (e) {
                reject(e);
            }
        }).catch(err => {
            console.error('Error applying average rating');
        })
    }

    private static getPopulateFields(): string {
        return 'sender driverLocation.userId stops.receiver';
    }

    public static getCompleteDeliveryStates(): DeliveryState[] {
        return [
            DeliveryState.COMPLETE,
            DeliveryState.CANCELLED
        ];
    }

    public static getActiveDeliveryStates(): DeliveryState[] {
        return [
            DeliveryState.PENDING,
            DeliveryState.ACCEPTED,
            DeliveryState.PICKING_UP,
            DeliveryState.DROPPING_OFF
        ];
    }

    public static getHandlingDeliveryStates(): DeliveryState[] {
        return [
            DeliveryState.PICKING_UP,
            DeliveryState.DROPPING_OFF
        ];
    }
}
