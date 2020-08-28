import {DriverDocument, IDriverDocument} from "../../models/document";
import {DriverDocumentType} from "../../models/enums/driverDocumentType";
import {getUpdateOptions} from "../../utils/utils";
import {createError} from "../../utils/response";
import {ImageContainer, UploadService} from "../../routes/shared/uploadService";

export class DriverDocumentService {

    public async getDocuments(userId: string): Promise<IDriverDocument[]> {
        return await DriverDocumentService.ensureHasDocuments(userId);
    }

    public async addDocument(userId: string, file: any, body: IDriverDocument): Promise<IDriverDocument> {
        if (!Object.values(DriverDocumentType).includes(body.type))
            throw createError(`Unsupported document type: '${body.type}'`, 400);
        await DriverDocumentService.ensureHasDocuments(userId);
        if (!body.type) throw createError(`Document type is required`, 400);
        if (DriverDocumentService.doesDocumentRequireImage(body.type) && !file) {
            const document: IDriverDocument = await DriverDocument.findOne({userId, type: body.type}).lean<IDriverDocument>().exec();
            if (!document || !document.imageUri) throw createError('File is required', 400);
        }
        if (DriverDocumentService.doesDocumentRequireContent(body.type) && !body.content) {
            throw createError('Document type is required', 400);
        }
        const uploadService = new UploadService();
        if (file) {
            const thumbnail = await uploadService.downsizeImage(file, 50, 100, true);
            body.imageUriThumbnail = await uploadService.uploadFile(thumbnail, ImageContainer.THUMBNAILS);
            body.imageUri = await uploadService.uploadFile(file, ImageContainer.IMAGES);
        }
        return await DriverDocument.findOneAndUpdate({userId, type: body.type}, body, getUpdateOptions()).lean<IDriverDocument>().exec();
    }

    public static async ensureHasDocuments(userId: string): Promise<IDriverDocument[]> {
        for (const type of Object.values(DriverDocumentType)) {
            const requiresImage = DriverDocumentService.doesDocumentRequireImage(type);
            await DriverDocument.findOneAndUpdate({userId, type}, {requiresImage}, getUpdateOptions()).exec();
        }
        return await DriverDocument.find({userId}).lean<IDriverDocument>().exec();
    }

    public static doesDocumentRequireImage(type: DriverDocumentType) {
        return type === DriverDocumentType.DRIVER_LICENCE
            || type === DriverDocumentType.FULL_PICTURE;
    }

    public static doesDocumentRequireContent(type: DriverDocumentType) {
        return type === DriverDocumentType.HOME_ADDRESS
        || type === DriverDocumentType.PHONE_NUMBER__OF_NEXT_OF_KIN;
    }

}
