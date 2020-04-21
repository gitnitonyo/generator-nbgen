/**
 * Handles uploading of files
 */
/* globals WebApp */
import { Meteor } from '../common';
import { Accounts } from '../common';
import { Roles } from '../common';
import { appRoles, COLLECTION_GROUP_FIELD, COLLECTION_OWNER_FIELD, getActiveGroup } from '../../common/app.roles';

import { UploadedFiles } from './collection.js';

import multer from 'multer';
import bodyParser from 'body-parser';

import _ from 'underscore';

const upload = multer();
const retrieveUrl = Meteor.absoluteUrl() + 'files/get';

Meteor.methods({
    'uploadedFiles.removeItem': removeItem
});

/**
 * Returns a constructed URL based on the specified doc object
 */
export function getRetrieveUrl(doc) {
    const file = doc.file;
    const fileName = encodeURIComponent(file.originalname);
    const docId = encodeURIComponent(doc._id);
    return `${retrieveUrl}/${fileName}?docId=${docId}`;
}

function removeItem(docId) {
    const doc = UploadedFiles.findOne(docId);
    if (doc && (doc[COLLECTION_OWNER_FIELD] === this.userId || doc[COLLECTION_GROUP_FIELD] === getActiveGroup(this.userId))) {
        UploadedFiles.remove({_id: docId});
    }
}

Meteor.startup(() => {
    WebApp.connectHandlers.use(bodyParser.json())   // for handling json type
    WebApp.connectHandlers.use(bodyParser.urlencoded({extended: true})) // for handling form type

    // for processing user
    WebApp.connectHandlers.use(Meteor.bindEnvironment(processUser));

    // for handling upload
    WebApp.connectHandlers.use(upload.any())

    // handle postback URL
    WebApp.connectHandlers.use('/', Meteor.bindEnvironment(_commonRequestProcess));
    WebApp.connectHandlers.use('/files/upload', Meteor.bindEnvironment(uploadHandler));
    WebApp.connectHandlers.use('/files/get', Meteor.bindEnvironment(getHandler));
    WebApp.connectHandlers.use('/files/download', Meteor.bindEnvironment(downloadHandler));
})

function _sendInvalidRequest(res) {
    res.writeHead(400, {"Content-Type": "application/json"});
    res.end(JSON.stringify({message: 'Invalid Request'}));
}

function _sendUnauthorized(res) {
    res.writeHead(401, {"Content-type": "application/json"});
    res.end(JSON.stringify({message: "Unauthorized"}));
}

function _commonRequestProcess(req, res, next) {
    // const protocol = req.headers['x-forwarded-proto'];
    // const host = req.headers['host'];
    // if (protocol && host) {
    //     const clientUrl = `${protocol}://${host}/`;
    //     const meteorUrl = Meteor.absoluteUrl();
    //     if (clientUrl !== meteorUrl) {
    //         // redirect to the ROOT_URL defined in the app
    //         res.writeHead(302, {
    //             location: meteorUrl,
    //         });
    //         res.end();
    //         return;
    //     }
    // }
    next();
}

function processUser(req, res, next) {
    const loginToken = req.headers['x-auth-token'] || (req.query && req.query._sessionId) || (req.body && req.body._sessionId);

    if (loginToken) {
        const hashedToken = Accounts._hashLoginToken(loginToken);
        req._currentUser = Meteor.users.findOne({'services.resume.loginTokens.hashedToken': hashedToken});
    } else {
        let _userId = (req.query && req.query._user)
        req._currentUser = Meteor.users.findOne({'_id': _userId});
    }

    next();
}

function _handlePreflight(res) {
    const allowedHeaders = "X-Requested-With, content-type, Accept, " +
        "Authorization, x-user-id, x-auth-token, content-length, x-total-count, link, " +
        "location range content-range accept-ranges  content-disposition";

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", allowedHeaders);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Expose-Headers", allowedHeaders)
}

function _retrieveHandler(req, res, next, download) {
    if (req.method === 'OPTIONS') {
        // preflight request
        _handlePreflight(res);
        res.end();
        return;
    }

    _handlePreflight(res);

    if (req.method !== 'GET') {
        // only post is allowed
        _sendInvalidRequest(res);
        return;
    }

    if (!req._currentUser) {
        _sendUnauthorized(res);
        return;
    }

    // check if document id specified as parameter
    // get the document id
    const docId = req.query.docId;
    if (!docId) {
        _sendInvalidRequest(res);
        return;
    }

    // retrieve
    const doc = UploadedFiles.findOne(docId);
    if (!doc) {
        _sendInvalidRequest(res);
        return;
    }

    // TODO: check if user is allowed to access this document
    // by checking ownership and group
    let docOwner = doc[COLLECTION_OWNER_FIELD];
    let docGroup = doc[COLLECTION_GROUP_FIELD];
    let activeGroup = getActiveGroup(req._currentUser);
    if (!Roles.userIsInRole(req._currentUser, [appRoles.SUPER_ADMIN], Roles.GLOBAL_GROUP) &&
        (docOwner && docOwner !== req._currentUser._id) &&
        (docGroup && docGroup !== activeGroup)) {
        // allow if there's a group
        _sendUnauthorized(res);
        return;
    }

    let file = doc.file;
    if (req.query.preview === 'yes' && doc.preview) {
        file = doc.preview;
    }

    let range = req.headers.range || '';    // check if there's range header specified
    let total = file.size;
    let start = 0;
    let contentType = file.mimetype;
    let end = total - 1;
    let headers = { }, statusCode = 200;
    if (range) {
        let parts = range.replace(/bytes=/, "").split("-");
        let partialstart = parts[0];
        let partialend = parts[1];

        start = parseInt(partialstart, 10);
        end = partialend ? parseInt(partialend, 10) : total - 1;

        headers = {
            "Content-Type": contentType,
            "Content-Range": "bytes " + start + "-" + end + "/" + total,
            "Accept-Ranges": "bytes",
        };
        statusCode = 206;
    } else {
        headers = {
            "Content-Type": contentType,
            "Accept-Ranges": "bytes",
        };
    }

    const buffer = Buffer.from(file.buffer).slice(start, end+1);

    headers["Access-Control-Allow-Origin"] = "*";
    headers["Content-Length"] = buffer.length;

    if (download) {
        // it's a download
        headers["Content-Disposition"] = `attachment; filename="${file.originalname}"`;
    }
    res.writeHead(statusCode, headers);
    res.write(buffer, () => res.end());
}

function getHandler(req, res, next) {   // eslint-disable-line
    return _retrieveHandler.call(this, req, res, next);
}

function downloadHandler(req, res, next) {  // eslint-disable-line
    return _retrieveHandler.call(this, req, res, next, true);
}

function uploadHandler(req, res, next) {    // eslint-disable-line
    if (req.method === 'OPTIONS') {
        // preflight request
        _handlePreflight(res);
        res.end();
        return;
    }

    _handlePreflight(res);

    if (req.method !== 'POST') {
        // only post is allowed
        _sendInvalidRequest(res);
        return;
    }

    if (!req._currentUser) {
        _sendUnauthorized(res);
        return;
    }

    // req.files contains files which we're uploaded
    res.writeHead(200, {
        "Content-type": "application/json",
        "Access-Control-Allow-Origin": "*",
    });
    if (req.files && req.files.length > 0) {
        // only save 1 file
        const file = req.files[0];
        const doc = { };
        if (_.isObject(req.body)) {
            _.each(req.body, (value, key) => {
                doc[key] = value;
            })
        }
        doc.file = file;
        if (req.files.length > 1 && req.files[1].fieldname === 'preview') {
            doc.preview = req.files[1];
        }
        doc.type = 'upload';
        if (req._currentUser) {
            doc[COLLECTION_OWNER_FIELD] = req._currentUser._id;
            doc[COLLECTION_GROUP_FIELD] = getActiveGroup(req._currentUser._id);
        }
        doc.includedData = req.body || { };
        const docId = UploadedFiles.insert(doc);
        res.end(JSON.stringify({docId, filename: file.originalname, mimetype: file.mimetype, size: file.size}));
    } else {
        // just ignore if no files were uploaded
        res.end(JSON.stringify({}));
    }
}
