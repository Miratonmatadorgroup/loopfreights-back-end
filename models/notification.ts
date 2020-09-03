import {model, Model, Schema} from "mongoose";
import {IBaseDocument} from "./interfaces/baseInterface";
import { SocketEvent } from "./defs/socketEvent";
import { UserRole } from "./enums/userRole";

export enum TTL {
    X = 60,
    XX = 1800,
    XXX= 3600
}
export enum NotificationGroup {
    WALLETS = 'wallet_funding',
    CARDS = 'new_card',
    DELIVERIES = 'delivery_request',
    ONLINE = 'online',
}

export enum NotificationTag {
    WALLET_PAYMENT = 'wallet_payment',
    WALLET_FUNDING = 'wallet_funding',
    NEW_CARD = 'new_card',
    DELIVERY_REQUEST = 'delivery_request',
    DELIVERY_UPDATE = 'delivery_update',
    RATE = 'rate',
    ONLINE = 'online',
}

export enum NotificationImportance {
    HIGH = 'high',
    NORMAL = 'normal',
    MIN = 'min',
}

export enum NotificationStrategy {
    PUSH_ONLY = 'push_only',
    SOCKET_ONLY = 'socket_only',
    PUSH_AND_SOCKET = 'push_and_socket'
}

export interface ISocketNotification {
    userId: string;
    content?: string;
    group?: NotificationGroup | SocketEvent;
    tag: NotificationTag | SocketEvent;
    strategy?: NotificationStrategy;
    payload?: any;
}

export interface IFirebaseNotification extends ISocketNotification {
    importance?: NotificationImportance;
    content: string;
    itemId?: string;
    ticker?: string;
    title?: string;
    useSound?: boolean;
    saveNotification?: boolean;
}

export interface INotification extends IFirebaseNotification {
    role?: UserRole;
    seen?: boolean;
    previewImageUri?: string;
    previewImageUriThumbnail?: string;
    payload?: any;
}

export interface INotificationImpl extends INotification, IBaseDocument {

}

const notificationSchema = new Schema({
    userId: {type: Schema.Types.ObjectId, required: true},
    content: {type: String, required: true},
    role: {type: String, required: true},
    tag: {type: String, required: true},
    group: {type: String, required: true},
    importance: {type: String, required: true},
    strategy: {type: String, required: true},
    itemId: {type: String, required: false},
    ticker: {type: String, required: false},
    title: {type: String, required: false},
    seen: {type: Boolean, default: false},
    useSound: {type: Boolean, default: true},
    saveNotification: {type: Boolean, default: false},
    previewImageUri: {type: String, required: false},
    previewImageUriThumbnail: {type: String, required: false},
    payload: {type: Schema.Types.Mixed, required: false},
}, {timestamps: true});

export const Notification: Model<INotificationImpl> = model<INotificationImpl>('notification', notificationSchema);
