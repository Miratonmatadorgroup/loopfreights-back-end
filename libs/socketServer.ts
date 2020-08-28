import * as WebSocket from "ws";
import {IncomingMessage, Server as HttpServer} from "http";
import {NotificationService} from "../services/shared/notificationService";
import {NotificationGroup, NotificationImportance, NotificationStrategy, NotificationTag} from "../models/notification";
import {SocketEvent} from "../models/defs/socketEvent";
import {SocketData} from "../models/interfaces/socketData";
import {IDriverLocation} from "../models/driverLocation";
import {LocationService} from "../services/drivers/locationService";
import {UserRole} from "../models/enums/userRole";
import {IAuthToken} from "../models/authToken";
import {AuthService} from "../services/auth/authService";
import {AccountService} from "../services/shared/accountService";
import {IUser, IUserProfile} from "../models/user";
import {createError} from "../utils/response";

export class SocketServer {
    public static getWebsocketServer(): WebSocket.Server {
        return this.websocket;
    }
    private static websocket: WebSocket.Server;

    constructor(server: HttpServer) {
        SocketServer.websocket = initWs(server);
        this.listen();
        this.beginPing();
    }

    private listen = () => {
        SocketServer.websocket.on('connection', async (socket: any, request: IRequest) => {
            console.log('Request');
            console.log('**** Socket Type: ', request.role);
            socket.userId = request.userId.toString();
            socket.role = request.role;
            socket.isAlive = true;
            new NotificationService().sendNotification({
                userId: socket.userId,
                ticker: 'Online',
                title: 'Online',
                content: 'Device online',
                group: NotificationGroup.ONLINE,
                tag: NotificationTag.ONLINE,
                importance: NotificationImportance.HIGH,
                role: socket.role
            }, NotificationStrategy.SOCKET_ONLY, false);
            await NotificationService.sendSocketMessage({
                userId: socket.userId,
                tag: SocketEvent.IN_EVENT_OFFLINE,
                payload: {}
            }, socket.role);
            this.listenForSocketEvents(socket);
        });
    }
    private listenForSocketEvents = (socket: any) => {
        socket.on('message', async data => {
            console.log('Socket message: ', data);
            await this.processData(data, socket);
        });

        socket.on('pong', data => {
            console.log('Pong: ', data.toString());
            socket.isAlive = true;
        });
        socket.on('close', async (code, reason) => {
            console.log(`Closed. reason : ${reason}, code: ${code}, id: ${socket.userId}`);
            await this.processData({event: SocketEvent.IN_EVENT_OFFLINE}, socket);
        });
    }
    private beginPing = () => {
        setInterval(function ping() {
            SocketServer.websocket.clients.forEach(function each(socket: any) {
                if (socket.isAlive === false) return socket.terminate();
                socket.isAlive = false;
                socket.ping(function noop() {});
            });
        }, 30000);
    }

    public async processData(data: any, socket: any) {
        const userId = socket.userId;
        const role = socket.role;
        const socketData: SocketData = SocketServer.parseData(data);
        if (!socketData) return;
        console.log('Processing in event: ', socketData.event);
        const locationService = new LocationService();
        switch (socketData.event) {
            case SocketEvent.IN_EVENT_DRIVER_LOCATION:
                if (role !== UserRole.DRIVER) return ;
                const handlerLocation: IDriverLocation = socketData.payloadTo<IDriverLocation>();
                if (!handlerLocation || !handlerLocation.latitude) return console.warn('Invalid location: ', handlerLocation);
                await locationService.addLocation(userId, handlerLocation);
                break;
            case SocketEvent.IN_EVENT_OFFLINE:
                if (socket.type === UserRole.DRIVER)
                    await locationService.removeLocation(socket.userId);
                break;
        }
    }

    public static parseData(data: string): SocketData {
        try {
            const object = JSON.parse(data);
            if (!object.hasOwnProperty('event')) return;
            return new SocketData(object.event, object.notification, object.payload);
        } catch (e) {
            console.error('Error passing socket data: ' + e);
        }
    }

    public static getSocket(userId: string, role: UserRole): WebSocket | undefined {
        const socketServer = SocketServer.websocket;
        if (!socketServer || !userId || !role) return;
        return Array.from(socketServer.clients).filter(client => {
            const socketId: string = (client as any).userId;
            const socketRole: UserRole = (client as any).role;
            return socketId === userId && socketRole === role;
        })[0] as WebSocket;
    }

    public static closeConnection(userId: string, role: UserRole, message: string) {
        const socket = this.getSocket(userId, role);
        if (socket) {
            socket.send(JSON.stringify({event: SocketEvent.IN_EVENT_OFFLINE, payload: {reason: message}}));
            socket.terminate();
        }
    }
}

function initWs(server): WebSocket.Server {
    return new WebSocket.Server({
        server: server,
        clientTracking: true,
        verifyClient: verifyClient
    });
}

async function verifyClient(info, next) {
    try {
        const reqUrl = new URL(`wss://${info.req.headers.host}${info.req.url}`);
        const authorization = info.req.headers.authorization || reqUrl.searchParams.get('token');
        const deviceId = info.req.headers.deviceId || reqUrl.searchParams.get('deviceId');
        const role: UserRole = info.req.headers.role || reqUrl.searchParams.get('role') || UserRole.BASIC;
        console.log(`>>Verifying client. Authorization: ${authorization}, deviceId: ${deviceId}, role: ${role}`);
        if (!authorization || !deviceId) throw createError('Unauthorized', 401);
        const authToken: IAuthToken = await new AuthService().getAuthToken(authorization, deviceId, false);
        console.log('Auth token: ', authToken);
        if (!authToken) throw createError('Unauthorized. Token not found', 401);
        const accountService = new AccountService();
        const user: IUser = await accountService.getAccount(authToken.userId, false);
        if (!user) throw createError('Unauthorized. User not found', 401);
        const profile: IUserProfile = role === UserRole.DRIVER ? user.driverProfile : user.userProfile;
        if (role === UserRole.DRIVER) {
            const error = await accountService.validateDriverRequirements(authToken.userId);
            if (error) throw createError(error.message, 401);
        }
        info.req.userId = authToken.userId;
        info.req.profileId = profile._id;
        info.req.role = role;
        next(true);
    } catch (err) {
        const statusCode = err.statusCode || 400;
        const message = err.message || 'Unauthorized';
        console.error(`>>> Websocket connection error: `, err);
        next(false, statusCode, message, {'X-WebSocket-Reject-Reason': message});
    }
}

export interface IRequest extends IncomingMessage {
    userId: string;
    role: UserRole;
}
