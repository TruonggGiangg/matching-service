// utils/validate.js
function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

function coerceNumber(x, fieldName) {
    const n = Number(x);
    if (!Number.isFinite(n)) throw new Error(`Field '${fieldName}' must be a number`);
    return n;
}

function coerceDate(x, fieldName) {
    const d = new Date(x);
    if (!isValidDate(d)) throw new Error(`Field '${fieldName}' must be a valid date`);
    return d;
}

// bắt buộc có field (0 vẫn hợp lệ)
function ensureFields(obj, fields, path = '') {
    const missing = [];
    for (const f of fields) {
        const has = Object.prototype.hasOwnProperty.call(obj, f);
        if (!has || obj[f] === undefined || obj[f] === null) {
            missing.push(path ? `${path}.${f}` : f);
        }
    }
    return missing;
}
module.exports = {
    coerceNumber,
    coerceDate,
    ensureFields
};