import {CarriageType, generateIdentifier, ICarriageType} from "../../models/carriageType";
import {createError} from "../../utils/response";
import {ImageContainer, UploadService} from "./uploadService";
import {getUpdateOptions} from "../../utils/utils";

export class CarriageTypeService {

    public async addCarriageType(file: any, body: ICarriageType): Promise<ICarriageType> {
        if (!body.name) throw createError('Carriage type name is required', 400);
        const uploadService = new UploadService();
        if (file) {
            const thumbnail = await uploadService.downsizeImage(file, 50, 100, true);
            body.imageThumbnailUrl = await uploadService.uploadFile(thumbnail, ImageContainer.THUMBNAILS);
            body.imageUrl = await uploadService.uploadFile(file, ImageContainer.IMAGES);
        }
        const identifier = generateIdentifier(body.name)
        const carriageType = await CarriageType.findOneAndUpdate({identifier}, body, getUpdateOptions())
            .lean<ICarriageType>()
            .exec()
        return await this.getCarriageType(carriageType._id)
    }

    public async getCarriageType(id: string): Promise<ICarriageType> {
        const carriageType = await CarriageType.findById(id)
            .lean<ICarriageType>()
            .exec();
        if (!carriageType) throw createError('Carriage type not found', 400);
        return carriageType;
    }

    public async getCarriageTypeByIdentifier(identifier: string): Promise<ICarriageType> {
        const carriageType = await CarriageType.findOne({identifier})
            .lean<ICarriageType>()
            .exec();
        if (!carriageType) throw createError('Carriage type not found', 400);
        return carriageType;
    }

    public async getCarriageTypes(): Promise<ICarriageType[]> {
        return await CarriageType.find()
            .lean<ICarriageType>()
            .exec()
    }

}
