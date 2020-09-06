import {User} from "../models/user";
import {UserRole} from "../models/enums/userRole";
import {Delivery, IDelivery} from "../models/delivery";
import moment from "moment-timezone";

export class DashboardService {

    public async loadDashboard(): Promise<{
        totalRiders: number;
        totalUsers: number;
        totalDeliveries: number;
        totalEarnings: number;
        totalDeliveriesThisMonth: number;
        earnings: {name: string, value: number}[]
    }> {
        const totalRiders: number = await User.countDocuments({roles: {$in: UserRole.DRIVER}} as any).exec();
        const totalUsers: number = await User.countDocuments({roles: {$in: UserRole.BASIC}} as any).exec();
        const deliveries: IDelivery[] = await Delivery.find().lean<IDelivery>().exec();
        const totalDeliveries: number = deliveries.length;
        const totalEarnings: number = deliveries.reduce((total, currentValue) => {
            total += currentValue.billing.totalFare
            return total;
        }, 0);
        const currentMonth = moment().get('month') + 1;
        const deliveriesForMonth: IDelivery[] = await Delivery.aggregate<IDelivery>()
            .project({
                month: {$month: "$createdAt"}
            })
            .match({month: currentMonth})
            .exec();
        const totalDeliveriesThisMonth = deliveriesForMonth.length;
        const earnings = await this.groupEarningsThisWeek();
        return {
            totalRiders, totalUsers, totalDeliveries, totalEarnings, totalDeliveriesThisMonth, earnings
        }
    }

    private async groupEarningsThisWeek(): Promise<{name: string, value: number}[]> {
        const earnings: {name: string, value: number}[] = [];
        const date = new Date();
        const startOfWeek = moment.tz(date, 'Africa/Lagos').startOf('day').startOf('week').toDate();
        const endOfWeek = moment.tz(date, 'Africa/Lagos').endOf('day').endOf('week').toDate();
        const deliveries: IDelivery[] = await Delivery.aggregate<IDelivery>()
            .match({
                $and: [
                    {createdAt: {$gte: startOfWeek}},
                    {createdAt: {$lte: endOfWeek}}
                ]
            })
            .project({
                day: {$subtract: [{$dayOfWeek: '$createdAt'}, 1]},
                billing: '$billing'
            }).exec();
        const deliveriesMap: Map<number, IDelivery[]> = new Map<number, IDelivery[]>()
        deliveries.forEach(delivery => {
            const mappedDeliveries: IDelivery[] = deliveriesMap.get((delivery as any).day) || [];
            mappedDeliveries.push(delivery);
            deliveriesMap.set((delivery as any).day, mappedDeliveries)
        });
        for (let i = 0; i <= 6; i ++) {
            const mappedDeliveries: IDelivery[] = deliveriesMap.get(i) || []
            earnings.push({
                name: moment().set('day', i).format('ddd'),
                value: mappedDeliveries.reduce((total, currentValue) => {
                    total += currentValue.billing?.totalFare || 0;
                    return total;
                }, 0)
            })
            console.log('Day: ', i)
        }
        console.log('Deliveries: ', deliveries);
        return earnings;
    }

}
