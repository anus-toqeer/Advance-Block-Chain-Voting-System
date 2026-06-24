export class Block {
    constructor(index, voterIdHash, candidateId, previousHash) {
        this.index = index;
        this.timestamp = new Date().toISOString();
        this.voterIdHash = voterIdHash;
        this.candidateId = candidateId;
        this.previousHash = previousHash;
        this.hash = null; // set after calculateHash() runs
        this.prev=null;
    }

    Getstring(){
        return `${this.index}${this.timestamp}${this.voterIdHash}${this.candidateId}${this.previousHash}`;
    }

    async calculateHash() {
        this.hash = await Block.hashValue(this.Getstring());
        return this.hash;
    }

    static async hashValue(value) {
        const encoder = new TextEncoder();
        const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(value));
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}