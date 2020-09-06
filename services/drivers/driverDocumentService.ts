import {DriverDocument, IDriverDocument} from "../../models/document";
import {DriverDocumentType} from "../../models/enums/driverDocumentType";
import {getUpdateOptions} from "../../utils/utils";
import {createError} from "../../utils/response";
import {ImageContainer, UploadService} from "../../routes/shared/uploadService";
import {User} from "../../models/user";
import {SocketServer} from "../../libs/socketServer";
import {UserRole} from "../../models/enums/userRole";

export class DriverDocumentService {

    public async getDocuments(userId: string): Promise<{documents: IDriverDocument[], requiredDocuments: IDriverDocument[]}> {
        const documents: IDriverDocument[] = await DriverDocument.find({userId}).lean<IDriverDocument>().exec();
        const requiredDocuments: IDriverDocument[] = await DriverDocumentService.getRequiredDocuments();
        return {documents, requiredDocuments};
    }

    public async addDocument(userId: string, file: any, body: IDriverDocument): Promise<IDriverDocument> {
        console.log(`Adding document: `, body);
        if (!Object.values(DriverDocumentType).includes(body.type))
            throw createError(`Unsupported document type: '${body.type}'`, 400);
        if (!body.type) throw createError(`Document type is required`, 400);
        const requiresImage = DriverDocumentService.doesDocumentRequireImage(body.type);
        const requiresContent = DriverDocumentService.doesDocumentRequireContent(body.type);
        const name = DriverDocumentService.getDocumentName(body.type);
        if (requiresImage && !file) {
            const document: IDriverDocument = await DriverDocument.findOne({userId, type: body.type}).lean<IDriverDocument>().exec();
            if (!document || !document.imageUri) throw createError('File is required', 400);
        }
        if (requiresContent && !body.content) {
            throw createError('Document content is required', 400);
        }
        const uploadService = new UploadService();
        if (file) {
            const thumbnail = await uploadService.downsizeImage(file, 50, 100, true);
            body.imageUriThumbnail = await uploadService.uploadFile(thumbnail, ImageContainer.THUMBNAILS);
            body.imageUri = await uploadService.uploadFile(file, ImageContainer.IMAGES);
            if (body.type === DriverDocumentType.FULL_PICTURE)
                await this.updateProfileImage(userId, body.imageUri, body.imageUri);
        }
        await this.disableAccountWithReason(userId, 'Your documents have been received. Your account will be reviewed and activated')
        return await DriverDocument.findOneAndUpdate({userId, type: body.type}, Object.assign(body, {name, requiresImage, requiresContent}), getUpdateOptions()).lean<IDriverDocument>().exec();
    }

    public async updateProfileImage(userId, profileImage: string, profileImageThumbnail) {
        await User.findByIdAndUpdate(userId, {
            'driverProfile.profileImage' : profileImage,
            'driverProfile.profileImageThumbnail' : profileImageThumbnail,
        }).exec();
    }

    public async disableAccountWithReason(userId, reason: string) {
        await User.findByIdAndUpdate(userId, {
            'driverProfile.enabled' : false,
            'driverProfile.message' : reason,
        }).exec();
        SocketServer.closeConnection(userId, UserRole.DRIVER, reason)
    }

    public static async getRequiredDocuments(): Promise<IDriverDocument[]> {
        const documents: IDriverDocument[] = []
        for (const type of Object.values(DriverDocumentType)) {
            const name = this.getDocumentName(type);
            const requiresImage = DriverDocumentService.doesDocumentRequireImage(type);
            const requiresContent = DriverDocumentService.doesDocumentRequireContent(type);
            documents.push({type, name, requiresImage, requiresContent} as IDriverDocument);
        }
        return documents;
    }

    public static getDocumentName(type: DriverDocumentType): string {
        switch (type) {
            case DriverDocumentType.DRIVER_LICENCE: return 'Driver License';
            case DriverDocumentType.FULL_PICTURE: return 'Full picture';
            case DriverDocumentType.HOME_ADDRESS: return 'Home Address';
            case DriverDocumentType.PHONE_NUMBER__OF_NEXT_OF_KIN: return 'Phone number of next of kin';
        }
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
