import {IWeightClass, WeightClass} from "../../models/weightClass";
import {createError} from "../../utils/response";
import {CarriageTypeService} from "./carriageTypeService";

export class WeightClassService {

    public async getWeightClasses(): Promise<IWeightClass[]> {
        return await WeightClass.find()
            .lean<IWeightClass>()
            .exec()
    }

    public async addWeightClass(body: IWeightClass): Promise<IWeightClass> {
        if (!body.name) throw createError('Name is required', 400)
        if (!body.weight) throw createError('Weight is required', 400)
        if (!body.carriageTypeIdentifier) throw createError('Carriage type identifier is required', 400)
        if (!body.baseFare) throw createError('Base fare is required', 400)
        if (!body.pricePerKm) throw createError('Price per km is required', 400)
        if (!body.pricePerKm) throw createError('Price per km is required', 400)
        await new CarriageTypeService().getCarriageTypeByIdentifier(body.carriageTypeIdentifier)
        const weightClass = await new WeightClass(body).save()
        return await this.getWeightClass(weightClass._id)
    }

    public async getWeightClass(id: string): Promise<IWeightClass> {
        const weightClass = await WeightClass.findById(id)
            .lean<IWeightClass>()
            .exec()
        if (!weightClass) throw createError('Weight class not found', 400)
        return weightClass
    }

    public async getWeightClassByWeight(weight: number): Promise<IWeightClass> {
        if (!weight) throw createError('Weight is required', 400)
        console.log('Getting weight class by weight: ', weight)
        const weightClass = await WeightClass.findOne({weight: {$gte: weight}})
            .lean<IWeightClass>()
            .exec()
        if (!weightClass) throw createError('Sorry we cannot ship items of this weight', 400)
        return weightClass;
    }
}
