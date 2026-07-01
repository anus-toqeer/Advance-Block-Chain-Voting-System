# ⛓ Blockchain Voting System
### Secure. Transparent. Tamper-Evident.

A fully frontend-based blockchain voting system built in **Vanilla JavaScript (ES Modules)**, converted from a prior semester's C++ console-based structured-programming project into a modern, OOP-based web application. This project simultaneously demonstrates mastery across **JavaScript fundamentals**, **Object-Oriented Programming**, **Data Structures & Algorithms**, and **Information Security** principles — serving as a cohesive capstone across all three domains.

---

## 📌 Project Overview

| Attribute | Details |
|---|---|
| **Language** | Vanilla JavaScript (ES Modules) |
| **Frontend** | HTML5, CSS3, JavaScript |
| **Backend** | None — fully frontend-only |
| **Persistence** | Browser localStorage |
| **Hashing** | Web Crypto API — SHA-256 |
| **Architecture** | Single Page Application (SPA) |
| **Original Project** | C++ console-based structured programming (prior semester) |

---

## 🎯 Project Goals

1. Convert structured C++ logic into Object-Oriented JavaScript
2. Demonstrate real-world OOP design — classes, inheritance, encapsulation, and composition
3. Simulate blockchain behavior with real cryptographic hashing
4. Apply and demonstrate Information Security concepts including live attack and defense demonstrations
5. Integrate natural DSA usage throughout the system design
6. Build a clean, modular, portfolio-worthy web application

---

## 📁 Project Structure

```
Advance-Block-Chain-Voting-System/
├── Classes/
│   ├── User.js          — Base User class + Voter + Admin (inheritance)
│   ├── Candidate.js     — Candidate entity
│   ├── Block.js         — Individual block with SHA-256 hashing
│   ├── Blockchain.js    — Linked-list blockchain with integrity verification
│   ├── VotingSystem.js  — Core controller (only DOM-touching class)
│   └── AuditLog.js      — Tamper-evident action tracking
├── Frontend/
│   ├── index.html       — Single-page application shell
│   ├── app.js           — DOM wiring, event listeners, UI logic
│   └── style.css        — Full responsive styling
├── utils/
│   └── hash.js          — Reusable SHA-256 hashing utility
├── test.js              — Node.js smoke test script
└── jsconfig.json        — VS Code JS type checking configuration
```

---

## 🧱 System Architecture

### Separation of Concerns
A strict architectural principle was enforced throughout: **VotingSystem is the only class that touches the DOM**. All other classes — User, Voter, Admin, Block, Blockchain, AuditLog, and Candidate — are pure logic classes with zero DOM dependency. This means the logic layer is fully testable in Node.js without a browser, and the UI layer can be replaced or redesigned without touching any business logic. This matches professional-grade separation of concerns as practised in production software.

### Single Page Application Pattern
All three sections — Login, Voter Dashboard, and Admin Dashboard — exist in a single HTML file, shown and hidden via JavaScript based on who is logged in. No page reloads occur at any point. All data stays alive in memory throughout a session, which is exactly how production SPAs work, including those built with React.

---

## 🧠 OOP Design

### Class Hierarchy

```
User (base)
├── Voter extends User
└── Admin extends User

Block              — individual chain node
Blockchain         — linked list of Blocks
Candidate          — candidate entity
VotingSystem       — orchestrator / controller
AuditLog           — action history recorder
```

### Key OOP Concepts Demonstrated

**Encapsulation** means each class owns and manages its own state. Rather than external code directly modifying a voter's fields, changes go through the object's own methods — marking a voter as having voted is handled by the Voter class itself, not by outside assignment. This ensures the object's internal state is always controlled and consistent.

**Inheritance** allows Voter and Admin to both extend User, sharing common fields like ID, name, and password, as well as shared authentication behavior — login attempt tracking, lockout detection, and password verification — while each subclass adds its own role-specific behavior on top.

**Polymorphism** means a single users collection stores both Voter and Admin objects. One login method handles both roles, and the returned object's actual type determines what that user is permitted to do throughout the system.

**Composition** means VotingSystem is assembled from smaller, independent parts — it owns a Blockchain instance, an AuditLog instance, and a Map of users and candidates — rather than inheriting from a complex parent class. Each component has one job; VotingSystem coordinates them.

---

## 📊 Data Structures & Algorithms

DSA concepts were applied where they provide genuine architectural value, not forced in arbitrarily.

### Blockchain as a Singly Linked List
Each Block object holds a direct reference (pointer) to the previous Block object in memory — not just the previous hash string, but the actual object. The Blockchain class maintains a tail pointer that always references the newest block. Inserting a new block is O(1) — just update the tail. Reading the full history requires traversing backward through each block's pointer until reaching genesis, which is O(n). This is structurally identical to a classic singly linked list with a tail pointer, and the implementation makes that explicit by design.

### Hash Table for Voter Lookup
All registered users are stored in a JavaScript Map keyed by voter ID. Every lookup — login, duplicate detection, registration check — is O(1) average case. The original C++ version scanned through an array on every lookup, which was O(n). This is a deliberate, concrete DSA improvement over the prior implementation.

### Results Tallying — Always Recomputed from the Chain
Election results are never stored as a separate running counter. Every call to getResults() walks the full blockchain and counts votes from scratch. This means results are only ever as valid as the chain itself — if the chain passes integrity verification, results are correct by definition. A tampered chain produces meaningless results, and integrity verification catches that before results are trusted.

---

## 🔐 Information Security

### SHA-256 Hashing — Block Integrity
Every block's hash is computed using the browser's native Web Crypto API — real cryptographic hashing, not a custom or simplified function. The hash covers all meaningful fields of a block. Any change to any single field produces a completely different hash, making silent data modification detectable.

### Voter Anonymity — Information Disclosure Prevention
Voter IDs are never stored in the blockchain in their raw form. Before a block is created, the voter's ID is passed through SHA-256 and only the resulting hash is stored. The chain records that a unique person voted without recording who that person is. Verifying whether a voter has already voted simply requires hashing their ID again and comparing — the raw identity is never exposed at any point in the chain. This directly addresses the Information Disclosure threat from the STRIDE model.

### SHA-256 Password Hashing
Passwords are hashed at the point of registration using the same SHA-256 utility. Plaintext passwords are never stored — not in memory, not in localStorage. When a user logs in, the entered password is hashed before comparison. Even if the database dump attack successfully exposes stored data, it reveals only SHA-256 hashes, which are not reversible into readable passwords.

### Role-Based Access Control (RBAC)
Every privileged operation begins with a check confirming the current user is the correct type. This is enforced at the logic layer — not just at the UI level by hiding buttons. Even if someone bypasses the interface entirely and calls methods directly from the browser console, the logic still rejects them if they are not the required role.

Roles and their permissions:

| Action | Voter | Admin |
|---|---|---|
| Cast vote | ✅ | ❌ |
| Register voter | ❌ | ✅ |
| Add candidate | ❌ | ✅ |
| Remove voter / candidate | ❌ | ✅ |
| Start / close election | ❌ | ✅ |
| Toggle security mode | ❌ | ✅ |
| View results during voting | ❌ | ✅ |
| View results after closing | ✅ | ✅ |

### Authentication and Login Lockout
After three consecutive failed login attempts, an account is locked and further attempts are rejected regardless of whether the correct password is entered afterward. This directly addresses Denial of Service (brute-force prevention) from the STRIDE model. The failed attempt count is persisted via localStorage, so a page refresh does not reset it.

### Input Validation
When security is enabled, all voter and candidate names are validated before acceptance — minimum and maximum character length, letters and spaces only, no numbers or symbols, and at least one real alphabetic character required. This is the first line of defense against injection attacks via registration forms.

### Audit Logging — Non-Repudiation
Every significant system action is recorded with a timestamp, the acting user's ID, and a description of the action. Logged events include: Voter Registered, Login Successful, Vote Cast, Election Started, Election Closed, Security Enabled and Disabled, Password Changed, Voter Removed, Candidate Removed, and Simulated Tamper Attack. This directly addresses the Repudiation threat from the STRIDE model — users cannot deny actions they performed, because a timestamped record exists.

### Blockchain Tamper Detection — Integrity
The integrity check walks the entire blockchain and performs two independent verifications per block.

The first check recomputes each block's hash from its current data and compares it to the stored hash. If they differ, the block's data was changed after the hash was recorded — a direct tampering indicator.

The second check compares each block's stored previous hash field against the actual current hash of the real previous block object. If they differ, a block was modified and its hash was recalculated to cover the change — but the next block in the chain still remembers the old value, exposing the inconsistency.

The check returns a structured result identifying exactly which block failed and the specific reason, so the UI can visually highlight the broken block rather than just displaying a pass or fail.

### Content Security Policy (CSP)
A Content Security Policy is declared in the HTML permanently, regardless of the security toggle state. It instructs the browser to only execute scripts loaded from the application's own files, blocking inline script tags, inline event handlers, and scripts from external or untrusted sources. This is a browser-enforced, always-on defense that operates entirely independently of any JavaScript code or runtime setting.

---

## 🚨 Security Attack Demonstrations

The system includes an admin-controlled security toggle that switches between vulnerable and secure code paths, enabling live before-and-after demonstrations without maintaining two separate codebases.

### Attack 1 — Stored XSS (Cross-Site Scripting)

**Vulnerability (security off):** When a login attempt fails, the entered ID is echoed back into the error message by treating it as raw HTML. The browser interprets the echoed content as markup and renders it accordingly.

**Attack:** Entering a malicious HTML payload as the login ID causes it to be injected into the page when login fails. The browser parses and executes the embedded handler — a classic reflected XSS pattern, representing one of the most common real-world web vulnerabilities.

**Defense (security on):** The error message is written as plain text rather than HTML. The browser treats the entire input as a literal string regardless of what it contains — the payload is displayed exactly as typed, nothing executes.

**Secondary defense (always-on):** The Content Security Policy independently blocks inline event handlers even when HTML rendering is used. This demonstrates how layered defenses can overlap — one layer being bypassed does not mean the system is fully compromised.

### Attack 2 — Eval-Based Code Injection

**Vulnerability (security off):** The candidate search function passes user input directly into JavaScript's eval() function. eval() treats its argument as executable code rather than as a data value, meaning any carefully crafted input can change the logic of the running program.

**Attack:** Entering a crafted query causes the dynamically evaluated expression to always return true, so every candidate in the system is returned regardless of what was actually searched — the same logical outcome as a classic SQL injection using `WHERE 1=1`.

**Defense (security on):** The search uses plain strict equality comparison. The query is treated as a literal string value, not as executable code. The same malicious input simply finds no match.

**Key lesson:** The vulnerability class is injection — the mixing of data and instructions at runtime. The same principle applies whether the target is JavaScript using eval(), SQL using string concatenation, or any other system that executes user-provided text as code. The language is incidental; the root cause is identical.

### Attack 3 — SQL-Injection-Style Authentication Bypass and Database Dump

**Vulnerability (security off):** The vulnerable login path mimics the classic SQL authentication bypass pattern. If the entered ID matches the injection structure — the same logical form as `' OR '1'='1` in a SQL WHERE clause — the authentication check is bypassed entirely without valid credentials, and all registered system data is returned.

**Attack:** Entering the injection string as the admin ID grants access regardless of password and triggers a full dump of all registered users including their hashed passwords, and all candidates. Even with passwords hashed, voter IDs, names, and registration data are exposed — a genuine Information Disclosure breach even without readable passwords.

**Defense (security on):** The real login method performs a direct lookup by ID followed by strict equality comparison. The injection string is simply an ID that does not exist in the system — no bypass is possible and no data is exposed.

### Attack 4 — Information Disclosure via Error Messages

**Vulnerability (security off):** Failed login attempts return specific, differentiated errors — one message when the entered ID is not registered, and a different message when the ID exists but the password is wrong.

**Attack:** An attacker can probe the login form with arbitrary IDs and observe which error they receive. A specific error confirms that a given ID is registered, enabling systematic enumeration of all valid voter IDs without ever successfully logging in. This is known as username enumeration — a real-world vulnerability directly under Information Disclosure in the STRIDE model.

**Defense (security on):** Login failure always returns the same generic message regardless of whether the ID does not exist or the password is wrong. An attacker cannot distinguish between the two outcomes from outside the system.

### Attack 5 — Blockchain Tampering and Integrity Verification

**Vulnerability:** Because the entire VotingSystem lives in the browser's JavaScript runtime, any block's data can be directly mutated from the developer console without going through the normal application flow.

**Basic attack:** Modifying a block's vote data without recalculating its hash is immediately caught by the integrity check — the stored hash no longer matches what would be computed from the modified data.

**Advanced attack:** After tampering, an attacker might recalculate just that one block's hash to cover the change. The first check now passes for the tampered block — but the next block in the chain still stores the old previous hash value, which no longer matches the tampered block's new hash. The second check catches this. The system correctly identifies the block after the tampered one as the point of failure, showing that the break surfaces one step downstream of where the actual tampering happened.

**Key lesson:** Blockchain tamper-resistance does not come from secrecy of the hashing algorithm — SHA-256 is completely public knowledge. It comes from the cost of having to consistently re-chain every subsequent block after any modification. In a real decentralized blockchain, that would require redoing the computational work of every independent node in the network simultaneously, which is practically infeasible at scale.

### Attacks Identified But Not Fully Implemented

The following attacks are real and documented, but cannot be fully prevented in a frontend-only architecture without a server boundary:

| Attack | Architectural Reason |
|---|---|
| **Client-side state tampering** | The VotingSystem instance is accessible from the browser console. Any user can directly reassign the current user to an admin object, bypassing all role checks. No server boundary exists to enforce access control independently of the client. |
| **Login lockout bypass** | The failed attempt counter lives on a client-side object and can be reset directly from the console, undoing any lockout instantly. Without a backend, no client-side mechanism can enforce this unconditionally. |
| **localStorage manipulation** | All persisted state is plain JSON, fully readable and editable through the browser's developer tools. Without server-side validation on every action, no client-side storage mechanism can be fully trusted. |

These limitations are documented as deliberate, honest architectural acknowledgements rather than oversights. A production voting system would require a backend with server-side session management, a real database, and server-enforced access control to properly address all of them.

---

## 🗳 Election Lifecycle

The system enforces a strict three-phase election lifecycle. State transitions are enforced at the logic layer, not just visually through the UI — meaning restrictions cannot be bypassed by calling methods directly from the browser console.

```
Phase 1 — SETUP
  Admin registers voters and adds candidates.
  Voting is not yet possible.

       ↓ Admin clicks "Start Election"

Phase 2 — VOTING
  Registration and candidate addition are locked.
  Voters can log in and cast their vote.
  Results are visible to admin only.

       ↓ Admin clicks "Close Election"

Phase 3 — CLOSED
  Results become visible to all users.
  Registration and candidate addition reopen.
  No further votes can be cast under any circumstances.
```

---

## 💾 Data Persistence

All system state — registered voters, candidates, the full blockchain, election flags, the security toggle state, and the complete audit log — is saved to localStorage after every mutation and reconstructed on page load.

The key technical challenge in persistence is that JSON serialization strips class information. A plain object loaded from JSON has no methods — it is not a Voter or Admin. On load, every stored user record is manually reconstructed into the appropriate class instance based on a saved role field, restoring full method availability.

Blockchain blocks present an additional challenge: each block auto-generates a timestamp on creation. When restoring from storage, the saved timestamp is immediately applied back to the reconstructed block, and the stored hash is restored directly rather than being recalculated. Recalculating hashes on load would produce different values because the current time differs from the original, causing the integrity check to falsely report tampering on every page refresh.

---

## 🔧 Setup and Running

**Requirements:**
- Any modern browser (Chrome recommended)
- VS Code with the Live Server extension — required because ES Modules cannot be loaded via the file:// protocol

**Steps:**
1. Clone the repository
2. Open the project folder in VS Code
3. Right-click `Frontend/index.html` and select "Open with Live Server"
4. Default admin credentials: ID — `Anas` | Password — `1122`

**To run the logic-layer smoke test in Node.js (no browser required):**
```bash
node test.js
```

---

## 👤 Author

**Anas** — Computer Science Student  
Courses: Object-Oriented Programming, Information Security, Data Structures & Algorithms  
GitHub: [anus-toqeer/Advance-Block-Chain-Voting-System](https://github.com/anus-toqeer/Advance-Block-Chain-Voting-System)

---

## ⚠️ Disclaimer

This project is built for academic and portfolio purposes only. It is a frontend-only simulation — client-side code cannot provide real security guarantees in a production environment. All security demonstrations are intentionally simplified to illustrate concepts for educational purposes. A real voting system would require a hardened backend, a real database with server-side access control, end-to-end encryption, and independent security auditing.
