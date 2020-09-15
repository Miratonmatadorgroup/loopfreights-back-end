import {UserRole} from "../../models/enums/userRole";
import {Earning, IEarning, IEarningByDay, IEarningSummary} from "../../models/earning";
import moment, {Moment} from "moment-timezone";
import {WalletService} from "./walletService";
import {PlatformConfigurationService} from "../admins/platformConfigurationService";
import {DriverType} from "../../models/enums/driverType";
import {IPlatformConfiguration} from "../../models/platformConfiguration";

export class EarningService {

    public async addEarning(userId: string, role: UserRole, type: DriverType, amount: number): Promise<IEarning> {
        const fees = type === DriverType.INTERNAL ? 0 : (await PlatformConfigurationService.getPlatformConfigurations()).externalDriversFee;
        const amountMinusFees = amount - fees;
        const earning = await new Earning({userId, role, amount, fees, amountMinusFees}).save();
        const platformConfiguration: IPlatformConfiguration = await PlatformConfigurationService.getPlatformConfigurations();
        if (platformConfiguration.autoDisburseEarnings && type === DriverType.EXTERNAL) await this.disburseUnPaidEarnings(userId);
        return earning;
    }

    public async getEarnings(userId: string, role): Promise<IEarning[]> {
        return await Earning.find({userId, role})
            .lean<IEarning>()
            .exec();
    }

    public async disburseUnPaidEarnings(userId: string) {
        const earnings: IEarning[] = await Earning.find({userId, disbursed: false})
            .lean<IEarning>()
            .exec();
        const totalUnDisbursedEarnings: number = earnings.reduce((total, currentValue) => {
            total += currentValue.amount
            return total;
        }, 0);
        const totalUnDisbursedEarningFees: number = -Math.abs(earnings.reduce((total, currentValue) => {
            total += currentValue.fees
            return total;
        }, 0));
        const totalToDisburse = totalUnDisbursedEarnings + totalUnDisbursedEarningFees;
        await new WalletService().giveValue(userId, UserRole.DRIVER, totalToDisburse, `Earnings Due`);
        await Earning.updateMany({userId}, {disbursed: true}).lean<IEarning>().exec();
    }

    public async getEarningsByDay(userId: string, role: UserRole, date?: any): Promise<IEarningByDay[]> {
        date = date || moment().toDate();
        const currentMoment = EarningService.createMoment();
        console.log(`$current time: ${currentMoment}`);
        const startOfWeekMoment = EarningService.createMoment().startOf('week').startOf('day');
        const endOfWeekMoment = startOfWeekMoment.clone().endOf('week').endOf('day');
        const groupedEarnings: IEarning[] = await Earning.aggregate()
            .match({
                $and: [{userId}, {role}, {createdAt: {$gte: startOfWeekMoment.toDate()}}, {createdAt: {$lte: endOfWeekMoment.toDate()}}]
            })
            .project({
                userId: '$userId',
                role: '$role',
                amount: '$amount',
                fees: '$fees',
                amountMinusFees: '$amountMinusFees',
                day: {$subtract: [{$dayOfWeek: {date: '$createdAt', timezone: 'Africa/Lagos'}}, 1]},
                week: {$add: [{$week: {date: '$createdAt', timezone: 'Africa/Lagos'}}, 1]},
                createdAt: '$createdAt'
            }).exec();
        console.log('Grouped earnings: ', groupedEarnings);
        return EarningService.groupEarningsByDay(groupedEarnings, currentMoment);
    }

    public async getEarningsSummary(userId: string, role: UserRole): Promise<IEarningSummary[]> {
        const startOfWeekMoment = EarningService.createMoment().startOf('week').startOf('day');
        const endOfWeekMoment = startOfWeekMoment.clone().endOf('week').endOf('day');
        const earnings: IEarning[] = await Earning.find({$and: [{userId}, {role}, {createdAt: {$gte: startOfWeekMoment.toDate()}}, {createdAt: {$lte: endOfWeekMoment.toDate()}}]})
            .lean<IEarning>()
            .exec();
        const totalAmount: number = earnings.reduce((total, currentValue) => {
            total += currentValue.amount;
            return total;
        }, 0);
        const totalFees: number = earnings.reduce((total, currentValue) => {
            total += currentValue.fees;
            return total;
        }, 0);
        const earningSummaries: IEarningSummary[] = [];
        earningSummaries.push({
            title: 'Earning',
            amount: totalAmount
        })
        earningSummaries.push({
            title: 'Fees',
            amount: -totalFees
        });
        return earningSummaries;
    }

    private static groupEarningsByDay(earnings: IEarning[], currentMoment: Moment): IEarningByDay[] {
        const earningsByDay = [] as IEarningByDay[];
        const map: Map<number, IEarning[]> = new Map();
        earnings.forEach(earning => {
            const groupedEarnings = map.get(earning.day) || [];
            groupedEarnings.push(earning);
            map.set(earning.day, groupedEarnings);
        })
        for (let i = 0; i < 7; i++) {
            const dayMoment = this.createMoment().set('day', i);
            const groupedEarnings = map.get(i) || [];
            earningsByDay.push({
                day: i,
                dayName: dayMoment.format('dd'),
                total: groupedEarnings.reduce((total, currentValue) => {
                    total += currentValue.amount;
                    return total;
                }, 0)
            })
        }
        return earningsByDay;
    }

    private static createMoment(): Moment {
        return moment.tz('Africa/Lagos');
    }


}
