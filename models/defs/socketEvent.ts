export enum SocketEvent {
    IN_EVENT_DRIVER_LOCATION = 'location',
    IN_EVENT_OFFLINE = 'offline',
    OUT_EVENT_ONLINE = 'online',
    OUT_EVENT_HANDLER_LOCATION_ACK = 'location_ack',
    OUT_EVENT_REQUEST_QUE = 'request_que',
    OUT_EVENT_DELIVERY_REQUEST = 'delivery_request',
    OUT_EVENT_DELIVERY_REQUEST_TIMEOUT = 'delivery_request_timeout',
    OUT_EVENT_DELIVERY_REQUEST_CONTACTING_HANDLER = 'delivery_request_contacting_handler',
    OUT_EVENT_DELIVERY_UPDATE = 'delivery_update',
    OUT_EVENT_DELIVERY_PAYMENT_SUCCESS = 'delivery_payment_success',
    OUT_EVENT_DELIVERY_PAYMENT_CHANGE = 'delivery_payment_change',
    OUT_EVENT_DELIVERY_PAYMENT_ERROR = 'delivery_payment_error',
}
