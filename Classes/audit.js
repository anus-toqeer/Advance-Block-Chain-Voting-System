export class AuditLog {
    constructor() {
        this.entries = [];
    }

    // In AuditLog.js
record(userId, action) {
    this.entries.push({
        userId,
        action,
        timestamp: new Date().toISOString()   // unambiguous UTC ISO string, e.g. "2026-06-30T14:23:01.123Z"
    });
}

    getAll() {
        return this.entries;
    }
}