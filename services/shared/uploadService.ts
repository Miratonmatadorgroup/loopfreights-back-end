import multer from 'multer';
import {generate} from "voucher-code-generator";
import {createError} from "../../utils/response";
import {config} from "../../config/config";
import moment from "moment";
import Jimp from 'jimp';
import {S3} from "aws-sdk";

const fs = require('fs');
const os = require('os');
const path = require('path');
const s3 = new S3({
    credentials: {
        secretAccessKey: config.awsAccessKey,
        accessKeyId: config.awsAccessKeyId,
    }
});

export enum ImageContainer {
    IMAGES = 'loops-images',
    THUMBNAILS = 'loops-image-thumbnails'
}

export class UploadService {

    public async downsizeImage(file, width, quality = 100, blur): Promise<{
        path: string, originalname: string, filename: string, mimetype: string, destination: string, size: number
    }> {
        try {
            const filePath = "./" + file.destination + "/" + "resized_" + file.originalname;
            const imageFile = await Jimp.read(file.path);
            const image = imageFile.resize(width, Jimp.AUTO)
                .quality(quality);
            if (blur) image.blur(2);
            await image.writeAsync(filePath);
            const stats = fs.statSync(filePath);
            return {
                originalname: file.originalname,
                path: filePath,
                filename: "resized_" + file.filename,
                mimetype: file.mimetype,
                destination: file.destination,
                size: stats.size
            };
        } catch (e) {
            throw createError('Error while downsizing file', 500);
        }
    }

    public async uploadFile(file, container: ImageContainer): Promise<string> {
        if (!file) throw createError('File missing', 400);
        console.log(`Aws access key: ${config.awsAccessKey}, aws access key id: ${config.awsAccessKeyId}`);
        await s3.createBucket({Bucket: container, ACL: 'public-read'}).promise();
        const fileStream = fs.createReadStream(file.path);
        const uploadResult = await s3.upload({
            Bucket: container,
            Key: file.originalname,
            Body: fileStream,
            ContentType: file.mimetype,
            ACL: 'public-read'
        }).promise();
        UploadService.removeFile(file.path);
        return uploadResult.Location;
    }

    public static getTempFolder(): string {
        let uploadDirectory = os.tmpdir();
        const tempDirectoryExists = fs.existsSync(uploadDirectory);
        console.log('Temp directory exists? ', tempDirectoryExists);
        if (tempDirectoryExists) {
            console.log('Temp directory: ', uploadDirectory);
            uploadDirectory = uploadDirectory.toString();
            if (uploadDirectory.includes(':')) uploadDirectory = uploadDirectory.split(':')[1];
        } else {
            uploadDirectory = 'uploads/';
            if (!fs.existsSync(uploadDirectory))
                fs.mkdirSync(uploadDirectory);
        }
        console.log('Upload directory: ', uploadDirectory);
        return uploadDirectory;
    }

    public static removeFile(filePath: string) {
        fs.unlinkSync(filePath);
    }
}

export const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, UploadService.getTempFolder());
        },
        filename: (req, file: any, callback) => {
            const fileParts = file.originalname.split('.');
            const fileExtension = "." + fileParts[fileParts.length - 1];
            file.extension = fileExtension;
            // let name =  new Date().toString().replace(/\s+/g, '-').toLowerCase()+fileExtension;
            const name = moment(new Date()).format("YYYY-MM-DD--HH:mm:ss").replace(/[\W_]+/g, "-").toLowerCase() + generate({
                charset: '0123456789',
                length: 4,
                count: 1
            })[0] + fileExtension;
            callback(null, name);
        }
    })
});
