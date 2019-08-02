import { createLocalMongoCollection } from '/imports/common/mongo.utils.js';

export const fromEmail = 'system@littleneeds.com.my';

export const phoneRegExp = "/^([0-9\(\)\/\+ \-\.]*)$/";
export const tinRegExp = "/^[0-9]{12,12}$/";
export const numberUpperCaseOnlyExp = "/^[A-Za-z0-9-]*$/"
export const UNExp = "/^[A-Za-z0-9 \.,:;#\*()\\\/]*$/"
export const IdNoExp = "/^[A-Za-z0-9]*$/"
export const PezaIdNoExp = "/^[A-Za-z0-9\-]*$/"
export const SSSIdNoExp = "/^[0-9]*$/"
export const BusinesNameExp = "/^[A-Za-z0-9 \/'.\-]*$/"
export const PositionExp = "/^[A-Za-z0-9 \/',.\-]*$/"
export const AdressExp = "/^[A-Za-z0-9 /,.\-]*$/"
export const RefNumExp = "/^[A-Za-z0-9\-,./]*$/"
export const AreaOfResponsibilityExp = "/^[A-Za-z0-9 /,.\-]*$/"


// for autofilling TIN fields
export const tinPatternMatches = [/^[0-9]{3,3}$/, /^[0-9]{3,3}\-[0-9]{3,3}$/, /^[0-9]{3,3}\-[0-9]{3,3}\-[0-9]{3,3}$/];

export const cashAdvanceStatus = {
    DRAFT: 'Draft',  // Clearance Agent
    SUBMITTED: 'Submitted',  // Clearance Agent
    APPROVED: 'Request Approved',  // Manager
    DISAPPROVED: 'Request Disapproved', // Manager
    READY_FOR_PICKUP: 'Ready for Pickup', // Cashier
    CASH_RELEASED: 'Cash Released', // Cashier
    LIQUIDATED: 'Liquidated', // Clearance Agent
    LIQUIDATION_APPROVED: 'Liquidation Approved', // Manager
    LIQUIDATION_DISAPPROVED: 'Liquidation Disapproved', //Manager
    FOR_REPLENISHMENT: 'For Replenishment', //Cashier
    CASH_REPLENISHED: "Cash Replenished",
    CLOSED: 'Closed' //Cashier

}

export const ORG_TYPES = [{
    _id: "BR",
    description: "Broker",
}, {
    _id: "AR",
    description: "Airline",
}, {
    _id: "SL",
    description: "Shipping Line"
}, {
    _id: "FC",
    description: "Forwarder / Consolidator"
}];

export const OrgTypes = createLocalMongoCollection(ORG_TYPES, 'OrgTypes');
