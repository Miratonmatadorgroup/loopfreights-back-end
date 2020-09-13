import {Router} from "express";
import {sendError, sendResponse} from "../../../utils/response";
import {UsersService} from "../../../services/admins/users/usersService";
import {reqAsAny} from "../../../utils/utils";
const app = Router();

app.get('/', (req, res, next) => {
    new UsersService().getUsers().then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
})

app.get('/search', (req, res, next) => {
    new UsersService().searchUsers(reqAsAny(req).query.query).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
});

app.get('/:id', (req, res, next) => {
    new UsersService().getUser(req.params.id).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
})

app.post('/:id/message', (req, res, next) => {
    new UsersService().messageUser(req.params.id, req.body).then(result => {
        sendResponse(res, 200, result);
    }).catch(err => {
        sendError(err, next);
    });
})

module.exports = app
