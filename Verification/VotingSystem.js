import { BlockChain } from '../Classes/blockChain.js';
import { Block } from '../Classes/block.js';
import { hashPassword } from '../Utils/hash.js';
import { User, Admin, Voter } from '../Classes/User.js';
import { Candidate } from '../Classes/candidate.js';
import { AuditLog } from './audit.js';

export class VotingSystem {
    constructor() {
        this.users = new Map();       // id -> Voter | Admin
        this.candidates = [];
        this.blockchain = new BlockChain();
        this.currentUser = null;
        this.auditing = new AuditLog;
        this.electionOpen = true;
        this.securityEnabled = false;
        this.electionStarted = false;

    }
    // Basic Utilities Functions
    async init() {
    const restored = this.loadState();
    if (!restored) {
        await this.blockchain.AddGenesisBlock();
        const adminHash = await hashPassword('1122');   // ← hash admin password too
        this.users.set('Anas', new Admin('Anas', 'Anas', adminHash));
        this.saveState();
    }
}
   async registerVoter(id, name, password) {
    if (this.electionStarted && this.electionOpen)
        throw new Error('Cannot register voters while voting is in progress.');
    if (this.users.has(id)) throw new Error("Voter ID already exists.");
    if (!this.isValidName(name)) throw new Error("Invalid Name");
    const hashed = await hashPassword(password);   // ← hash here
    const voter = new Voter(id, name, hashed);      // ← store hash, not plaintext
    this.users.set(id, voter);
    this.auditing.record(id, `Voter ${name} Registered`);
    return voter;
}
    addcandidate(id, name) {
        if (this.electionStarted && this.electionOpen)
            throw new Error('Cannot add candidates while voting is in progress.');
        if (this.candidates.some(c => c.id === id)) throw new Error("Candidate ID already exists.");
        if (!this.isValidName(name)) throw new Error('Invalid candidate name.');
        this.candidates.push(new Candidate(id, name));
        this.auditing.record(id, `Candidate ${name} Added`)
    }
    async loginVulnerable(id, password) {
    const hashedPassword = await hashPassword(password);
    let match;
    try {
        match = [...this.users.values()].find(u =>
            eval(`u.id === "${id}" && u.password === "${hashedPassword}"`)
        );
    } catch (e) {
        match = undefined;
    }

    if (id.includes("' OR '1'='1") || id.includes('" OR "1"="1') || id.includes("|| true ||")) {
        this.auditing.record('UNKNOWN', 'SIMULATED SQL INJECTION — auth bypassed');
        return this.dumpDatabase();
    }

    // ← specific errors — information leakage vulnerability
    const userExists = this.users.get(id);
    if (!userExists) {
        this.auditing.record(id, 'Login Failed - User Not Found(Not-secure)');
        throw new Error(`User '${id}' does not exist.`);
    }
    if (!match) {
        this.auditing.record(id, 'Login Failed - Wrong Password(Not-secure)');
        throw new Error(`Incorrect password for user '${id}'.`);
    }

    this.currentUser = match;
    this.auditing.record(match.id, 'Login Successful(Not-Secure)');
    return match;
}
    dumpDatabase() {
        return {
            breached: true,
            users: [...this.users.values()].map(u => ({ id: u.id, name: u.name, password: u.password })),
            candidates: this.candidates
        };
    }
    async login(id, password) {
    const user = this.users.get(id);
    if (!user) throw new Error("Invalid Id or Password");
    if (user.isLocked()) throw new Error('Account locked due to too many failed attempts.');

    const hashed = await hashPassword(password);   // ← hash entered password
    if (hashed !== user.password) {                // ← compare hash to hash
        user.incrementFailedAttempts();
        this.auditing.record(id, "Login Failed");
        throw new Error('Invalid ID or password.');
    }

    user.resetFailedAttempts();
    this.currentUser = user;
    this.auditing.record(id, "Login Successful(Secure)");
    return user;
}
    isValidName(name) {
        if (this.securityEnabled) {
            if (typeof name !== 'string') return false;
            const trimmed = name.trim();
            if (trimmed.length < 3 || trimmed.length > 30) return false;
            if (!/^[A-Za-z\s]+$/.test(trimmed)) return false;
            if (!/[A-Za-z]/.test(trimmed)) return false;
        }
        return true;
    }
    async changePassword(oldPassword, newPassword) {
    if (!this.currentUser) throw new Error('You must be logged in.');
    const hashedOld = await hashPassword(oldPassword);
    if (this.currentUser.password !== hashedOld) throw new Error('Current password is incorrect.');
    if (newPassword === oldPassword) throw new Error('New password must be different.');
    if (newPassword.length < 4) throw new Error('Password too short.');

    this.currentUser.password = await hashPassword(newPassword);
    this.auditing.record(this.currentUser.id, 'Password Changed');
    this.saveState();
}
    startElection() {
        if (!(this.currentUser instanceof Admin)) throw new Error('Only admin can start the election.');
        this.electionStarted = true;
        this.auditing.record(this.currentUser.id, 'Election Started');
        this.saveState();
    }
    async castVote(id) {
        if (!this.electionStarted) throw new Error("Voting has not started yet.");
        if (!this.electionOpen) throw new Error("Voting is closed. No further votes can be cast.");
        if (!(this.currentUser instanceof Voter)) throw new Error("Voter ID Doesnot Exists");
        if (this.currentUser.hasVoted) throw new Error("Voter Already Voted");
        const VoterIdHash = await Block.hashValue(this.currentUser.id);
        await this.blockchain.Addblock(VoterIdHash, id);
        this.currentUser.hasVoted = true;
        this.auditing.record(this.currentUser.id, "Vote Cast");
        this.currentUser.votedAt = new Date().toISOString();
    }
    closeElection() {
        if (!(this.currentUser instanceof Admin)) throw new Error('Only admin can close the election.');
        this.electionOpen = false;
        this.auditing.record(this.currentUser.id, 'Election Closed');
    }

    // Attack Functions

    toggleSecurity() {
        if (!(this.currentUser instanceof Admin)) throw new Error('Only admin can toggle security.');
        this.securityEnabled = !this.securityEnabled;
        this.auditing.record(this.currentUser.id, `Security ${this.securityEnabled ? 'Enabled' : 'Disabled'}`);
    }
    searchCandidate(query) {
        if (this.securityEnabled) {
            return this.candidates.filter(c => c.name === query);
        } else {
            return this.candidates.filter(c => eval(`c.name === "${query}"`));
            // eval() is a built-in JS function that takes a string and runs it as actual JavaScript code 
        }
    }
    simulateTamperAttack() {
        if (!(this.currentUser instanceof Admin)) throw new Error('Only admin can run this demo.');
        if (!this.blockchain.tail || !this.blockchain.tail.prev) {
            throw new Error('Need at least one real vote cast before tampering can be demonstrated.');
        }

        // Tamper with the most recent real vote block, without recalculating its hash
        this.blockchain.tail.candidateId = this.blockchain.tail.candidateId === 1 ? 2 : 1;
        this.auditing.record(this.currentUser.id, 'SIMULATED ATTACK: Block tampered (candidateId flipped)');
    }

    // System Features
    async resetSystem() {
        if (!(this.currentUser instanceof Admin)) throw new Error('Only admin can reset the system.');

        localStorage.removeItem('votingSystemState');

        this.users = new Map();
        this.candidates = [];
        this.blockchain = new BlockChain();
        this.electionOpen = true;
        this.electionStarted = false;
        this.securityEnabled = false;
        this.auditing = new AuditLog();
        this.currentUser = null;

        await this.blockchain.AddGenesisBlock();
        const adminHash = await hashPassword('1122');   // ← hash admin password too
        this.users.set('Anas', new Admin('Anas', 'Anas', adminHash));
        this.saveState();
    }
    renderCandidates(container) {
        container.innerHTML = '';
        this.candidates.forEach(c => {
            const el = document.createElement('div');

            const nameSpan = document.createElement('span');
            if (this.securityEnabled) {
                nameSpan.textContent = c.name;
            } else {
                nameSpan.innerHTML = c.name;
            }
            el.appendChild(nameSpan);

            const voteBtn = document.createElement('button');
            voteBtn.textContent = 'Vote';
            voteBtn.disabled = this.currentUser.hasVoted;
            voteBtn.addEventListener('click', async () => {
                try {
                    await this.castVote(c.id);
                    alert('Vote cast successfully!');
                    document.getElementById('voterSection').style.display = 'none';
                    document.getElementById('loginSection').style.display = 'block';
                } catch (e) {
                    alert(e);
                }
            });
            el.appendChild(voteBtn);
            container.appendChild(el);
        });
    }

   getResults() {
    if (this.electionOpen && !(this.currentUser instanceof Admin)) 
        throw new Error('Results are not available until the election closes.');
    
    // Build tally map — candidateId → vote count
    const tally = new Map();
    this.candidates.forEach(c => tally.set(c.id, 0));
    this.blockchain.toArray().forEach(block => {
        if (tally.has(block.candidateId)) 
            tally.set(block.candidateId, tally.get(block.candidateId) + 1);
    });

    // Find highest vote count
    const maxVotes = Math.max(...tally.values());

    // Find candidate whose id has that vote count
    const winnerId = [...tally.entries()].find(([id, votes]) => votes === maxVotes)?.[0];
    const winner = this.candidates.find(c => c.id === winnerId);

    return { tally, winner, maxVotes };
}

    saveState() {
        const usersData = [];
        this.users.forEach((user, id) => {
            usersData.push({
                id: user.id, name: user.name, password: user.password,
                hasVoted: user.hasVoted ?? false, votedAt: user.votedAt ?? null,
                failedAttempts: user.failedAttempts ?? 0,
                role: user instanceof Admin ? 'admin' : 'voter'
            });
        });

        const blocksData = this.blockchain.toArray().map(b => ({
            index: b.index, timestamp: b.timestamp, voterIdHash: b.voterIdHash,
            candidateId: b.candidateId, previousHash: b.previousHash, hash: b.hash
        }));

        localStorage.setItem('votingSystemState', JSON.stringify({
            users: usersData, candidates: this.candidates,
            blocks: blocksData,
            electionOpen: this.electionOpen,
            securityEnabled: this.securityEnabled,
            electionStarted: this.electionStarted,
            auditLog: this.auditing.getAll()
        }));
    }
    loadState() {
        const raw = localStorage.getItem('votingSystemState');
        if (!raw) return false;

        const state = JSON.parse(raw);

        state.users.forEach(u => {
            if (u.role === 'admin') {
                const usr = new Admin(u.id, u.name, u.password);
                usr.failedAttempts = u.failedAttempts;
                this.users.set(u.id, usr);
            }
            else if (u.role === 'voter') {
                const usr = new Voter(u.id, u.name, u.password);
                usr.failedAttempts = u.failedAttempts;
                usr.hasVoted = u.hasVoted;
                usr.votedAt = u.votedAt;
                this.users.set(u.id, usr);
            }
        });

        this.candidates = state.candidates.map(c => new Candidate(c.id, c.name));

        let prevBlock = null;
        state.blocks.forEach(b => {
            const block = new Block(b.index, b.voterIdHash, b.candidateId, b.previousHash);
            block.timestamp = b.timestamp; // overwrite auto-generated timestamp with the real saved one
            block.hash = b.hash;           // overwrite — don't recalculate, just restore
            block.prev = prevBlock;
            this.blockchain.tail = block;
            prevBlock = block;
        });
        this.blockchain.length = state.blocks.length;

        this.electionOpen = state.electionOpen;
        this.electionStarted = state.electionStarted;
        this.securityEnabled = state.securityEnabled;
        state.auditLog.forEach(entry => this.auditing.entries.push(entry));

        return true;
    }


    async removeVoter(id, adminPassword) {
        if (!(this.currentUser instanceof Admin)) throw new Error('Only admin can remove voters.');
        const adminhash = await hashPassword(adminPassword);
        if (this.currentUser.password !== adminhash) throw new Error('Incorrect admin password.');
        if (!this.users.has(id)) throw new Error('Voter not found.');
        this.users.delete(id);
        this.auditing.record(this.currentUser.id, `Removed voter ${id}`);
        this.saveState();
    }

    async removeCandidate(id, adminPassword) {
        if (!(this.currentUser instanceof Admin)) throw new Error('Only admin can remove candidates.');
        const adminhash = await hashPassword(adminPassword);
        if (this.currentUser.password !== adminhash) throw new Error('Incorrect admin password.');
        const index = this.candidates.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Candidate not found.');
        this.candidates.splice(index, 1);
        this.auditing.record(this.currentUser.id, `Removed candidate ${id}`);
        this.saveState();
    }
}

