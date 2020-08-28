import {NextFunction, Request, Response} from "express";
import {StatusCodeError} from "request-promise/errors";

const sendResponse = (res: Response, statusCode: number, result: any, message?: string): void => {
    result = result || {statusCode: 204, status: 'success'};
    if (typeof result !== 'object') result = result.toObject();
    result = {data: result};
    result.statusCode = result.statusCode || statusCode;
    result.status = ErrorStatus.SUCCESS;
    result.messsage = message;
    res.header('Cache-Control', 'no-cache,no-supplier,must-revalidate');
    res.status(result.statusCode || statusCode || 200);
    res.json(result);
    console.log('Sending response\n::::\n:::\n::');
};

const sendError = (err: Error, next: NextFunction) => {
    const error: any = new Error(err ? err.message : "A server error just occurred");
    error.statusCode = err && (err as any).statusCode ? (err as any).statusCode : 500;
    next(error);
};

const createError = (message?: string, statusCode?: number, status?: ErrorStatus): Error => {
    const error: any = new Error(message || 'An unknown error has occurred');
    error.statusCode = statusCode || 500;
    error.status = status || ErrorStatus.FAILED;
    return error;
};

const createStatusCodeError = (err, statusCode?: number): Error => {
    // console.error('Creating status code error: ', err);
    if (err instanceof StatusCodeError)
        return createError(err.error.message, statusCode || err.error.statusCode);
    else
        return createError(err.message, statusCode || err.statusCode);
};

export enum ErrorStatus {
    SUCCESS = 'success',
    FAILED = 'failed',
    INSUFFICIENT_BALANCE_IN_WALLET = 'insufficient_balance_in_wallet'
}

export {sendResponse, sendError, createError, createStatusCodeError};
