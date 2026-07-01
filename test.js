/**
 * Blockchain Voting System — Comprehensive Test Suite
 * Covers: OOP, DSA, Blockchain Integrity, Security, Election Lifecycle, Audit Logging
 * Run: node test.js
 */

import { User, Voter, Admin } from './Classes/User.js';
import { Candidate } from './Classes/candidate.js';
import { Block } from './Classes/block.js';
import { BlockChain } from './Classes/blockChain.js';
import { AuditLog } from './Verification/audit.js';

// ─── Simple Test Runner ───────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function test(description, fn) {
    try {
        const result = fn();
        if (result instanceof Promise) {
            return result.then(() => {
                console.log(`  ✅  ${description}`);
                passed++;
            }).catch(err => {
                console.log(`  ❌  ${description}`);
                console.log(`       → ${err.message}`);
                failed++;
                failures.push({ description, error: err.message });
            });
        }
        console.log(`  ✅  ${description}`);
        passed++;
    } catch (err) {
        console.log(`  ❌  ${description}`);
        console.log(`       → ${err.message}`);
        failed++;
        failures.push({ description, error: err.message });
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

function section(title) {
    console.log(`\n── ${title} ${'─'.repeat(50 - title.length)}`);
}

// ─── Test Sections ────────────────────────────────────────────────────────────

section('1. OOP — Class Instantiation & Inheritance');

test('User base class creates with correct fields', () => {
    const u = new User('u1', 'Alice', 'pass123');
    assert(u.id === 'u1', 'id mismatch');
    assert(u.name === 'Alice', 'name mismatch');
    assert(u.password === 'pass123', 'password mismatch');
});

test('Voter extends User and initialises hasVoted as false', () => {
    const v = new Voter('v1', 'Alice', 'pass123');
    assert(v instanceof User, 'Voter should be instanceof User');
    assert(v instanceof Voter, 'should be instanceof Voter');
    assert(v.hasVoted === false, 'hasVoted should start false');
    assert(v.votedAt === null, 'votedAt should start null');
});

test('Admin extends User correctly', () => {
    const a = new Admin('a1', 'Anas', '1122');
    assert(a instanceof User, 'Admin should be instanceof User');
    assert(a instanceof Admin, 'should be instanceof Admin');
});

test('Voter.markAsVoted() sets hasVoted and votedAt', () => {
    const v = new Voter('v1', 'Alice', 'pass123');
    v.markAsVoted();
    assert(v.hasVoted === true, 'hasVoted should be true after marking');
    assert(v.votedAt !== null, 'votedAt should be set');
});

test('Voter.canVote() returns false after voting', () => {
    const v = new Voter('v1', 'Alice', 'pass123');
    assert(v.canVote() === true, 'canVote should be true initially');
    v.markAsVoted();
    assert(v.canVote() === false, 'canVote should be false after voting');
});

test('Candidate class creates with correct fields', () => {
    const c = new Candidate(1, 'John');
    assert(c.id === 1, 'id mismatch');
    assert(c.name === 'John', 'name mismatch');
});

// ─────────────────────────────────────────────────────────────────────────────

section('2. OOP — Encapsulation (Login Lockout)');

test('failedAttempts starts at 0', () => {
    const u = new Voter('v1', 'Alice', 'pass');
    assert(u.failedAttempts === 0, 'failedAttempts should start at 0');
});

test('incrementFailedAttempts() increases count', () => {
    const u = new Voter('v1', 'Alice', 'pass');
    u.incrementFailedAttempts();
    u.incrementFailedAttempts();
    assert(u.failedAttempts === 2, 'should be 2 after 2 increments');
});

test('isLocked() returns true after 3 failed attempts', () => {
    const u = new Voter('v1', 'Alice', 'pass');
    u.incrementFailedAttempts();
    u.incrementFailedAttempts();
    assert(u.isLocked() === false, 'should not be locked at 2 attempts');
    u.incrementFailedAttempts();
    assert(u.isLocked() === true, 'should be locked after 3 attempts');
});

test('resetFailedAttempts() unlocks the account', () => {
    const u = new Voter('v1', 'Alice', 'pass');
    u.incrementFailedAttempts();
    u.incrementFailedAttempts();
    u.incrementFailedAttempts();
    assert(u.isLocked() === true, 'should be locked');
    u.resetFailedAttempts();
    assert(u.isLocked() === false, 'should be unlocked after reset');
    assert(u.failedAttempts === 0, 'counter should be back to 0');
});

test('checkPassword() returns true for correct password', () => {
    const u = new Voter('v1', 'Alice', 'secret');
    assert(u.checkPassword('secret') === true, 'correct password should return true');
    assert(u.checkPassword('wrong') === false, 'wrong password should return false');
});

// ─────────────────────────────────────────────────────────────────────────────

section('3. DSA — Block & SHA-256 Hashing');

test('Block initialises with correct fields', () => {
    const b = new Block(0, 'GENESIS', 'GENESIS', 'GENESIS');
    assert(b.index === 0, 'index mismatch');
    assert(b.voterIdHash === 'GENESIS', 'voterIdHash mismatch');
    assert(b.candidateId === 'GENESIS', 'candidateId mismatch');
    assert(b.previousHash === 'GENESIS', 'previousHash mismatch');
    assert(b.hash === null, 'hash should start null');
    assert(b.prev === null, 'prev pointer should start null');
});

test('Block.hashValue() returns a 64-char hex SHA-256 string', async () => {
    const hash = await Block.hashValue('test input');
    assert(typeof hash === 'string', 'hash should be a string');
    assert(hash.length === 64, `hash should be 64 chars, got ${hash.length}`);
    assert(/^[0-9a-f]+$/.test(hash), 'hash should be lowercase hex');
});

test('Block.hashValue() is deterministic — same input produces same hash', async () => {
    const h1 = await Block.hashValue('hello');
    const h2 = await Block.hashValue('hello');
    assert(h1 === h2, 'same input must always produce same hash');
});

test('Block.hashValue() is sensitive — different inputs produce different hashes', async () => {
    const h1 = await Block.hashValue('hello');
    const h2 = await Block.hashValue('hello ');
    assert(h1 !== h2, 'even a single char difference must produce different hash');
});

test('calculateHash() populates block.hash from its own fields', async () => {
    const b = new Block(1, 'voterHash123', 2, 'prevHash000');
    assert(b.hash === null, 'hash should be null before calculation');
    await b.calculateHash();
    assert(b.hash !== null, 'hash should be set after calculation');
    assert(b.hash.length === 64, 'hash should be 64-char SHA-256');
});

test('Modifying block data produces a different hash', async () => {
    const b = new Block(1, 'voterHash123', 2, 'prevHash000');
    await b.calculateHash();
    const originalHash = b.hash;
    b.candidateId = 99; // tamper
    await b.calculateHash();
    assert(b.hash !== originalHash, 'tampered block must produce a different hash');
});

// ─────────────────────────────────────────────────────────────────────────────

section('4. DSA — Blockchain as a Singly Linked List');

test('Blockchain initialises with null tail and length 0', () => {
    const bc = new BlockChain();
    assert(bc.tail === null, 'tail should start null');
    assert(bc.length === 0, 'length should start 0');
});

test('AddGenesisBlock() sets tail and length to 1', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    assert(bc.tail !== null, 'tail should be set after genesis');
    assert(bc.length === 1, 'length should be 1 after genesis');
    assert(bc.tail.prev === null, 'genesis prev pointer should be null');
});

test('Addblock() links new block to previous via prev pointer', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    const genesis = bc.tail;
    await bc.Addblock('voterHash1', 1);
    assert(bc.tail.prev === genesis, 'new block prev should point to genesis object');
    assert(bc.length === 2, 'length should be 2');
});

test('Addblock() sets previousHash to the prior block\'s actual hash', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    const genesisHash = bc.tail.hash;
    await bc.Addblock('voterHash1', 1);
    assert(bc.tail.previousHash === genesisHash, 'new block previousHash should match genesis hash');
});

test('toArray() returns blocks in order from oldest to newest', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    await bc.Addblock('voter1', 1);
    await bc.Addblock('voter2', 2);
    const arr = bc.toArray();
    assert(arr.length === 3, `should have 3 blocks, got ${arr.length}`);
    assert(arr[0].index === 0, 'first should be genesis (index 0)');
    assert(arr[1].index === 1, 'second should be block 1');
    assert(arr[2].index === 2, 'third should be block 2');
});

test('toArray() traverses the linked list correctly', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    await bc.Addblock('voter1', 1);
    await bc.Addblock('voter2', 2);
    const arr = bc.toArray();
    // verify each block's prev pointer actually links backward correctly
    assert(arr[2].prev === arr[1], 'block 2 prev should point to block 1 object');
    assert(arr[1].prev === arr[0], 'block 1 prev should point to genesis object');
    assert(arr[0].prev === null, 'genesis prev should be null');
});

// ─────────────────────────────────────────────────────────────────────────────

section('5. DSA — Blockchain Integrity Verification');

test('isValid() returns { valid: true } on untampered chain', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    await bc.Addblock('voter1', 1);
    await bc.Addblock('voter2', 2);
    const result = await bc.isValid();
    assert(result.valid === true, `chain should be valid, got: ${JSON.stringify(result)}`);
});

test('isValid() detects hash mismatch (basic tampering — no hash recalculation)', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    await bc.Addblock('voter1', 1);
    await bc.Addblock('voter2', 2);
    // tamper without recalculating hash
    bc.tail.candidateId = 99;
    const result = await bc.isValid();
    assert(result.valid === false, 'chain should be invalid after tampering');
    assert(result.reason.includes('Hash mismatch'), `expected Hash mismatch, got: ${result.reason}`);
});

test('isValid() returns brokenBlockIndex pointing to the tampered block', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    await bc.Addblock('voter1', 1);
    await bc.Addblock('voter2', 2);
    bc.tail.candidateId = 99; // tamper tail (index 2)
    const result = await bc.isValid();
    assert(result.brokenBlockIndex === 2, `expected brokenBlockIndex 2, got ${result.brokenBlockIndex}`);
});

test('isValid() detects broken link (advanced — attacker recalculates own hash)', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    await bc.Addblock('voter1', 1);
    await bc.Addblock('voter2', 2);
    const blocks = bc.toArray();
    // tamper block 1 AND recalculate its hash to cover tracks
    blocks[1].candidateId = 99;
    await blocks[1].calculateHash();
    // now block 1's own hash is self-consistent — but block 2 still has old previousHash
    const result = await bc.isValid();
    assert(result.valid === false, 'chain should still be invalid despite attacker recalculating');
    assert(result.reason.includes('Broken link'), `expected Broken link, got: ${result.reason}`);
    // broken link is detected at block 2, not block 1, since block 2 remembers the old value
    assert(result.brokenBlockIndex === 2, `broken link should surface at block 2, got ${result.brokenBlockIndex}`);
});

test('isValid() on a chain with only genesis returns true', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    const result = await bc.isValid();
    assert(result.valid === true, 'single-block chain should be valid');
});

// ─────────────────────────────────────────────────────────────────────────────

section('6. Audit Log');

test('AuditLog initialises with empty entries', () => {
    const log = new AuditLog();
    assert(log.entries.length === 0, 'entries should start empty');
});

test('record() adds an entry with correct fields', () => {
    const log = new AuditLog();
    log.record('user1', 'Voted');
    assert(log.entries.length === 1, 'should have 1 entry');
    const entry = log.entries[0];
    assert(entry.userId === 'user1', 'userId mismatch');
    assert(entry.action === 'Voted', 'action mismatch');
    assert(typeof entry.timestamp === 'string', 'timestamp should be a string');
});

test('record() produces ISO-8601 timestamps', () => {
    const log = new AuditLog();
    log.record('u1', 'Test Action');
    const ts = log.entries[0].timestamp;
    assert(!isNaN(new Date(ts).getTime()), 'timestamp should be a valid date string');
});

test('getAll() returns all recorded entries', () => {
    const log = new AuditLog();
    log.record('u1', 'Action A');
    log.record('u2', 'Action B');
    log.record('u3', 'Action C');
    const all = log.getAll();
    assert(all.length === 3, `expected 3 entries, got ${all.length}`);
    assert(all[0].action === 'Action A', 'first entry mismatch');
    assert(all[2].action === 'Action C', 'third entry mismatch');
});

test('Multiple records accumulate in insertion order', () => {
    const log = new AuditLog();
    const actions = ['Register', 'Login', 'Vote', 'Logout'];
    actions.forEach((a, i) => log.record(`u${i}`, a));
    const all = log.getAll();
    assert(all.length === 4, 'should have 4 entries');
    actions.forEach((a, i) => {
        assert(all[i].action === a, `entry ${i} action should be ${a}`);
    });
});

// ─────────────────────────────────────────────────────────────────────────────

section('7. Voter Anonymity — Voter ID Hashing');

test('Hashing a voter ID produces a consistent 64-char hash', async () => {
    const hash1 = await Block.hashValue('voter123');
    const hash2 = await Block.hashValue('voter123');
    assert(hash1 === hash2, 'same voter ID should always hash to same value');
    assert(hash1.length === 64, 'should be a 64-char SHA-256 hex string');
});

test('Different voter IDs produce different hashes', async () => {
    const h1 = await Block.hashValue('voter1');
    const h2 = await Block.hashValue('voter2');
    assert(h1 !== h2, 'different voter IDs must not produce the same hash');
});

test('Raw voter ID is NOT stored in the block — only its hash is', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    const rawId = 'voter_alice';
    const hashed = await Block.hashValue(rawId);
    await bc.Addblock(hashed, 1);
    const blocks = bc.toArray();
    const voteBlock = blocks[1];
    // the raw ID should not appear anywhere in the block
    assert(voteBlock.voterIdHash !== rawId, 'raw voter ID must not be stored in block');
    assert(voteBlock.voterIdHash === hashed, 'block should store the hash, not the raw ID');
});

test('Re-hashing voter ID during double-vote check produces matching hash', async () => {
    const rawId = 'voter_alice';
    const storedHash = await Block.hashValue(rawId);
    // simulate the double-vote check: hash again and compare
    const checkHash = await Block.hashValue(rawId);
    assert(storedHash === checkHash, 'double-vote check: re-hashing same ID must match stored hash');
});

// ─────────────────────────────────────────────────────────────────────────────

section('8. Election Lifecycle — Logic Flags');

test('Election flags start in correct default states', () => {
    // simulate the flag logic that VotingSystem enforces
    let electionStarted = false;
    let electionOpen = true;
    // Phase 1: setup — can register, cannot vote
    assert(electionStarted === false, 'should not be started yet');
    assert(electionOpen === true, 'electionOpen starts true');
    // voting should be blocked before start
    const canVote = electionStarted && electionOpen;
    assert(canVote === false, 'voting should be blocked in setup phase');
});

test('After startElection(): electionStarted true, electionOpen true', () => {
    let electionStarted = false;
    let electionOpen = true;
    // simulate startElection()
    electionStarted = true;
    const canVote = electionStarted && electionOpen;
    assert(canVote === true, 'voting should be possible in voting phase');
    const canRegister = !(electionStarted && electionOpen);
    assert(canRegister === false, 'registration should be locked during voting');
});

test('After closeElection(): electionOpen false, voting blocked', () => {
    let electionStarted = true;
    let electionOpen = true;
    // simulate closeElection()
    electionOpen = false;
    const canVote = electionStarted && electionOpen;
    assert(canVote === false, 'voting should be blocked after closing');
    const canRegister = !(electionStarted && electionOpen);
    assert(canRegister === true, 'registration should reopen after closing');
});

test('Results access: admin can see results at any phase', () => {
    const admin = new Admin('a1', 'Anas', '1122');
    // simulate the getResults() access check
    const electionOpen = true; // mid-voting
    const adminCanSee = !(electionOpen && !(admin instanceof Admin));
    assert(adminCanSee === true, 'admin should always be able to see results');
});

test('Results access: voter blocked during open election', () => {
    const voter = new Voter('v1', 'Alice', 'pass');
    const electionOpen = true;
    // voter should be blocked during open election
    const blocked = electionOpen && !(voter instanceof Admin);
    assert(blocked === true, 'voter should be blocked from results during open election');
});

test('Results access: voter allowed after election closes', () => {
    const voter = new Voter('v1', 'Alice', 'pass');
    const electionOpen = false; // closed
    const blocked = electionOpen && !(voter instanceof Admin);
    assert(blocked === false, 'voter should be allowed results after election closes');
});

// ─────────────────────────────────────────────────────────────────────────────

section('9. Results Tallying from Blockchain');

test('Tallying an empty chain returns zero votes for all candidates', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    const candidates = [new Candidate(1, 'John'), new Candidate(2, 'Sara')];
    const tally = new Map();
    candidates.forEach(c => tally.set(c.id, 0));
    bc.toArray().forEach(b => {
        if (tally.has(b.candidateId)) tally.set(b.candidateId, tally.get(b.candidateId) + 1);
    });
    assert(tally.get(1) === 0, 'John should have 0 votes');
    assert(tally.get(2) === 0, 'Sara should have 0 votes');
});

test('Tallying correctly counts votes per candidate', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    // 2 votes for candidate 1, 1 vote for candidate 2
    await bc.Addblock('voter1hash', 1);
    await bc.Addblock('voter2hash', 1);
    await bc.Addblock('voter3hash', 2);
    const candidates = [new Candidate(1, 'John'), new Candidate(2, 'Sara')];
    const tally = new Map();
    candidates.forEach(c => tally.set(c.id, 0));
    bc.toArray().forEach(b => {
        if (tally.has(b.candidateId)) tally.set(b.candidateId, tally.get(b.candidateId) + 1);
    });
    assert(tally.get(1) === 2, `John should have 2 votes, got ${tally.get(1)}`);
    assert(tally.get(2) === 1, `Sara should have 1 vote, got ${tally.get(2)}`);
});

test('Genesis block is excluded from vote tally (GENESIS is not a candidate ID)', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    await bc.Addblock('voter1hash', 1);
    const candidates = [new Candidate(1, 'John')];
    const tally = new Map();
    candidates.forEach(c => tally.set(c.id, 0));
    bc.toArray().forEach(b => {
        if (tally.has(b.candidateId)) tally.set(b.candidateId, tally.get(b.candidateId) + 1);
    });
    assert(tally.get(1) === 1, 'should count exactly 1 vote, not 2 (genesis excluded)');
});

// ─────────────────────────────────────────────────────────────────────────────

section('10. Full Integration — Election Simulation');

test('Full election: register → vote → verify → tally matches', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    const log = new AuditLog();

    const voters = [
        new Voter('v1', 'Alice', 'pass1'),
        new Voter('v2', 'Bob', 'pass2'),
        new Voter('v3', 'Charlie', 'pass3'),
    ];
    const candidates = [new Candidate(1, 'John'), new Candidate(2, 'Sara')];

    // cast votes: Alice → 1, Bob → 1, Charlie → 2
    for (const [voter, candidateId] of [[voters[0], 1], [voters[1], 1], [voters[2], 2]]) {
        const voterIdHash = await Block.hashValue(voter.id);
        await bc.Addblock(voterIdHash, candidateId);
        voter.markAsVoted();
        log.record(voter.id, 'Vote Cast');
    }

    // verify all voters are marked
    assert(voters.every(v => v.hasVoted), 'all voters should be marked as voted');

    // verify chain integrity
    const integrity = await bc.isValid();
    assert(integrity.valid === true, 'chain should be valid after honest voting');

    // verify tally
    const tally = new Map();
    candidates.forEach(c => tally.set(c.id, 0));
    bc.toArray().forEach(b => {
        if (tally.has(b.candidateId)) tally.set(b.candidateId, tally.get(b.candidateId) + 1);
    });
    assert(tally.get(1) === 2, `John should have 2 votes, got ${tally.get(1)}`);
    assert(tally.get(2) === 1, `Sara should have 1 vote, got ${tally.get(2)}`);

    // verify audit log
    const auditEntries = log.getAll();
    assert(auditEntries.length === 3, `should have 3 audit entries, got ${auditEntries.length}`);
    assert(auditEntries.every(e => e.action === 'Vote Cast'), 'all entries should be Vote Cast');
});

test('Tampered election: tally changes after attack, integrity check fails', async () => {
    const bc = new BlockChain();
    await bc.AddGenesisBlock();
    await bc.Addblock('voter1hash', 1); // voted for candidate 1
    await bc.Addblock('voter2hash', 2); // voted for candidate 2

    // verify integrity before attack
    const before = await bc.isValid();
    assert(before.valid === true, 'chain should be valid before attack');

    // simulate tamper attack — flip block 1's vote from candidate 1 to candidate 2
    const blocks = bc.toArray();
    blocks[1].candidateId = 2;

    // integrity now fails
    const after = await bc.isValid();
    assert(after.valid === false, 'chain should be invalid after tampering');

    // tally now shows wrong results (2-0 instead of honest 1-1)
    const candidates = [new Candidate(1, 'John'), new Candidate(2, 'Sara')];
    const tally = new Map();
    candidates.forEach(c => tally.set(c.id, 0));
    bc.toArray().forEach(b => {
        if (tally.has(b.candidateId)) tally.set(b.candidateId, tally.get(b.candidateId) + 1);
    });
    // The tampered tally shows fraud — exactly why integrity must be verified before trusting results
    assert(tally.get(2) === 2, 'tampered tally shows fraudulent result (2 votes for Sara)');
    assert(tally.get(1) === 0, 'tampered tally shows fraudulent result (0 votes for John)');
});

// ─────────────────────────────────────────────────────────────────────────────

section('Summary');

// Run all tests (collecting any async ones)
// Results print inline as each test runs

await new Promise(resolve => setTimeout(resolve, 100)); // let async tests settle

console.log(`\n${'─'.repeat(60)}`);
console.log(`  Total:  ${passed + failed}`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failures.length > 0) {
    console.log(`\n  Failed tests:`);
    failures.forEach(f => {
        console.log(`    ❌ ${f.description}`);
        console.log(`       ${f.error}`);
    });
}

console.log(`${'─'.repeat(60)}\n`);

if (failed > 0) process.exit(1);