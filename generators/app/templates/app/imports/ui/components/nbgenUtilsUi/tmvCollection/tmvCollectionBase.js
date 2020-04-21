import { Mongo } from '../../nbgenMeteor';
import _ from 'underscore';

/**
 * Base class for the list and form controller
 */
export class TmvCollectionBase {
    // returns the subscription
    _getSubscription() {
        return this.subscription || this.options.subscription;      // bindings take precedence
    }

    // returns the collection to use
    _getCollection() {
        let collection = this.collection || this.options.collection;
        if (!collection) {
            collection = Mongo.Collection.get(this.subscription);
        }

        if (_.isString(collection)) {
            collection = Mongo.Collection.get(collection);
        }

        return collection;
    }

    initSubscription(subsName, paramFn, callbacks) {
        if (!paramFn) {
            paramFn = () => [];
        }
        if (!callbacks) {
            callbacks = {
                onStop(err) {
                    if (err) {
                        this.$tmvUiUtils.error(err);
                    }
                }
            }
        }
        return this.subscribe(subsName, paramFn, callbacks);
    }

    getUser() {
        return this.$nbgenIdentityService.user();
    }

    getCurrentUser() {
        return this.$nbgenIdentityService.user();   
    }

    getUserId() {
        return this.$nbgenIdentityService.userId();
    }

    getCurrentUserId() {
        return this.$nbgenIdentityService.userId();
    }

    isInRole(roles) {
        return this.$nbgenIdentityService.isInRole(roles);
    }

    translate(transId, transParams) {
        return this.$translate.instant(transId, transParams);
    }
}