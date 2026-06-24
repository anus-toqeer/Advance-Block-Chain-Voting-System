import { BlockChain } from './blockChain.js';
import { Block } from './block.js';
import { User, Admin, Voter } from './User.js';
import { Candidate } from './candidate.js';
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
    async init() {
        const restored = this.loadState();
        if (!restored) {
            await this.blockchain.AddGenesisBlock();
            this.users.set('admin1', new Admin('admin1', 'Admin', 'Admin123'));
            this.saveState();
        }
    }
    registerVoter(id, name, password) {

        if (this.electionStarted && this.electionOpen)
            throw new Error('Cannot register voters while voting is in progress.');
        if (!VotingSystem.isValidName(name)) throw new Error("Invalid Name");
        const voter = new Voter(id, name, password);
        this.users.set(id, voter);
        this.auditing.record(id, "Voter Registered");
        return voter;
    }
    addcandidate(id, name) {
        if (this.electionStarted && this.electionOpen)
            throw new Error('Cannot add candidates while voting is in progress.');
        if (this.users.has(id)) throw new Error("Voter ID Already exits");
        if (this.securityEnabled)
            if (!VotingSystem.isValidName(name)) throw new Error('Invalid candidate name.');
        this.candidates.push(new Candidate(id, name));
    }
    login(id, password) {
        const user = this.users.get(id);
        if (!user || password != user.password) throw new Error("Invalid Id or Password");
        if (user.isLocked()) throw new Error('Account locked due to too many failed attempts.');

        if (password !== user.password) {
            user.incrementFailedAttempts();
            throw new Error('Invalid ID or password.');
        }
        user.resetFailedAttempts();
        this.currentUser = user;
        this.auditing.record(id, "Login Successfull");
        return user;
    }
    static isValidName(name) {
        if (typeof name !== 'string') return false;
        const trimmed = name.trim();
        if (trimmed.length < 3 || trimmed.length > 30) return false;
        if (!/^[A-Za-z\s]+$/.test(trimmed)) return false;
        if (!/[A-Za-z]/.test(trimmed)) return false;
        return true;
    }
    startElection() {
        if (!(this.currentUser instanceof Admin)) throw new Error('Only admin can start the election.');
        this.electionStarted = true;
        this.auditing.record(this.currentUser.id, 'Election Started');
        this.saveState();
    }
    async castVote(id) {
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
        if (this.electionOpen && !(this.currentUser instanceof Admin)) throw new Error('Results are not available until the election closes.');
        const tally = new Map();
        this.candidates.forEach(c => tally.set(c.id, 0));
        this.blockchain.toArray().forEach(block => {
            if (tally.has(block.candidateId)) tally.set(block.candidateId, tally.get(block.candidateId) + 1);
        });
        return tally;
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
}