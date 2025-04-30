"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printMoney = void 0;
/**
 * Yes, it's real, this helper function prints money for you!
 */
function printMoney(amount) {
    return (amount / 100).toFixed(2);
}
exports.printMoney = printMoney;
