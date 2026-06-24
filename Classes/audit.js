export class AuditLog {
    constructor() {
        this.entries = [];
    }

    record(userId, action) {
        this.entries.push({
            timestamp: new Date().toISOString(),
            userId,
            action
        });
    }

    getAll() {
        return this.entries;
    }
}