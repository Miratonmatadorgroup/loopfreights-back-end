import {Delivery, IDelivery} from "../../../models/delivery";
import {DeliveryState} from "../../../models/enums/deliveryState";

export class DeliveriesService {

    public async getDeliveries(): Promise<IDelivery[]> {
        return await Delivery.find()
            .populate(DeliveriesService.getPopulateFields())
            .sort({createdAt: 'desc'})
            .lean<IDelivery>().exec();
    }

    public async getDelivery(id: string): Promise<IDelivery> {
        return await Delivery.findById(id)
            .populate(DeliveriesService.getPopulateFields())
            .sort({createdAt: 'desc'})
            .lean<IDelivery>().exec();
    }

    private static getPopulateFields(): string {
        return 'sender driverLocation.userId stops.receiver';
    }

}
