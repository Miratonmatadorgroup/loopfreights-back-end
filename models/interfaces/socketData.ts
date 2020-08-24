import {SocketEvent} from "../defs/socketEvent";
import {INotification} from "../notification";

export interface ISocketData {
    event: SocketEvent;
    payload?: any;
    notification?: INotification;
    payloadTo: <T>(payload: any) => T;
}

export class SocketData implements ISocketData {

    public event: SocketEvent;
    public notification: INotification;
    public payload: any;

    constructor(event: SocketEvent, notification: INotification, payload: any) {
        this.event = event;
        this.notification = notification;
        this.payload = payload;
    }

    public payloadTo<T>(): T {
        return this.payload as T;
    }
}
