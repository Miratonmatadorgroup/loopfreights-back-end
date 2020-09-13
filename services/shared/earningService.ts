import {UserRole} from "../../models/enums/userRole";
import {Earning, IEarning, IEarningByDay} from "../../models/earning";
import moment, {Moment} from "moment-timezone";

export class EarningService {

    public async addEarning(userId: string, role: UserRole, amount: number, fees = 0): Promise<IEarning> {
        const amountMinusFees = amount - fees;
        return await new Earning({userId, role, amount, fees, amountMinusFees}).save();
    }

    public async getEarnings(userId: string): Promise<IEarning[]> {
        return await Earning.find({userId})
            .lean<IEarning>()
            .exec();
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
        return EarningService.groupEarningsByDay(groupedEarnings, currentMoment);
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
