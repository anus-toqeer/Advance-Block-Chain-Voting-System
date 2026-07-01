// @ts-nocheck
import { VotingSystem } from "../Classes/VotingSystem.js";
import { Voter, Admin } from "../Classes/User.js";
const vs = new VotingSystem();
await vs.init();
window.vs = vs;

const loginSection = document.getElementById('loginSection');
const voterSection = document.getElementById('voterSection');
const adminSection = document.getElementById('adminSection');
const loginError = document.getElementById('loginError');
const controlmsg = document.getElementById('controlMsgs');


function logoutToAdminLogin() {
    vs.auditing.record("Admin", "Logout")
    vs.currentUser = null;
    document.getElementById('voterSection').style.display = 'none';
    adminSection.style.display = 'none';
    loginSection.style.display = 'block';
    document.getElementById('voterLoginForm').style.display = 'none';
    document.getElementById('adminLoginForm').style.display = 'block';
    document.getElementById('appBanner').classList.remove('compact');



    controlmsg.textContent = '';
    document.getElementById('secMsg').textContent ='';
    document.getElementById('adminLoginId').value = '';
    document.getElementById('adminLoginPassword').value = '';
    document.getElementById('adminLoginError').textContent = '';
    document.getElementById('blockchainView').innerHTML = '';
    document.getElementById('newVoterId').value = '';
    document.getElementById('newVoterName').value = '';
    document.getElementById('newVoterPassword').value = '';
    document.getElementById('newCandidateId').value = '';
    document.getElementById('newCandidateName').value = '';
    document.getElementById('viewResult').textContent = '';
    document.getElementById('auditMsg').textContent = '';
    document.getElementById('blockchainView').value = '';
    document.getElementById('removeList').innerHTML = '';
    document.getElementById('removeCandidateList').textContent = '';
    

}
function toggleOutput(element, showFn) {
    const isVisible = element.style.display !== 'none' && element.innerHTML.trim() !== '';
    if (isVisible) {
        element.style.display = 'none';
        element.innerHTML = '';
    } else {
        showFn();
        element.style.display = 'block';
    }
}
function rememberName(name) {
    const datalist = document.getElementById('nameSuggestions');
    if (![...datalist.options].some(opt => opt.value === name)) {
        const option = document.createElement('option');
        option.value = name;
        datalist.appendChild(option);
    }
}
function logoutToVoterLogin() {
    vs.auditing.record("Admin", "Logout")
    vs.currentUser = null;
    voterSection.style.display = 'none';
    loginSection.style.display = 'block';
    loginSection.style.marginTop = '2%';
    document.getElementById('appBanner').classList.remove('compact');
    document.getElementById('viewResultVoterMsg').textContent = '';
    loginError.textContent = '';
    
}
function updateVoterStatus() {
    const voter = vs.currentUser;
    const msg = document.getElementById('voterStatusMsg');
    if (voter.hasVoted) {
        msg.textContent = `✅ You already voted on ${new Date(voter.votedAt).toLocaleString()}.`;
    } else {
        msg.textContent = 'Select a candidate below to cast your vote.';
    }
}
function updateElectionStatus() {
    const statusEl = document.getElementById('electionStatusMsg');
    if (vs.electionStarted) {
        statusEl.textContent = '🗳 Voting is currently open.';
        statusEl.className = 'electionOpen';
    }
    else if (!vs.electionOpen) {
        statusEl.textContent = '🔒 Voting is closed. Results are now available.';
        statusEl.className = 'electionClosed';
    }
    else {
        statusEl.textContent = '';
    }
}

document.getElementById('logoutBtnVoter').addEventListener('click', logoutToVoterLogin);
document.getElementById('logoutBtnAdmin').addEventListener('click', logoutToAdminLogin);

document.getElementById('loginBtn').addEventListener('click', async () => {
    const id = document.getElementById('loginId').value;
    const password = document.getElementById('loginPassword').value;
    loginError.innerHTML = '';

    try {
        const result = vs.securityEnabled
            ? await vs.login(id, password)
            : await vs.loginVulnerable(id, password);

        if (result.breached) {
            let dump = '🚨 INJECTION SUCCESSFUL — Database exposed:\n\n';
            result.users.forEach(u => dump += `User: ${u.id} | Name: ${u.name} | Password: ${u.password}\n`);
            dump += '\nCandidates:\n';
            result.candidates.forEach(c => dump += `${c.id}: ${c.name}\n`);
            loginError.textContent = dump;
            return;
        }

        loginError.textContent = '';
        loginSection.style.display = 'none';

        if (result instanceof Admin) {
            adminSection.style.display = 'block';
            document.getElementById('appBanner').classList.add('compact');
            id.value = '';
            password.value = '';
        } else if (result instanceof Voter) {
            voterSection.style.display = 'block';
            document.getElementById('appBanner').classList.add('compact');
            vs.renderCandidates(document.getElementById('candidateList'));
            updateVoterStatus();
            updateElectionStatus();
            document.getElementById('voterWelcomeMsg').textContent = `Logged in as Voter ${result.name}`;
            id.value = '';
            password.value = '';
        }
    } catch (e) {
        if (vs.securityEnabled) {
            loginError.textContent = e.message; // safe — plain text
        } else {
            loginError.innerHTML = e.message; // vulnerable — raw HTML injection
        }
    }
});

document.getElementById('adminLoginBtn').addEventListener('click',async () => {
    const id = document.getElementById('adminLoginId').value;
    const password = document.getElementById('adminLoginPassword').value;

    try {
        const user = vs.securityEnabled
            ? await vs.login(id, password)
            : await vs.loginVulnerable(id, password);
            console.log(user);              // ← add this
            console.log(user instanceof Admin);

        if (user instanceof Admin) {
            loginSection.style.display = 'none';
            adminSection.style.display = 'block';
            document.getElementById('appBanner').classList.add('compact');
            renderRemoveCandidateList();
            rememberName(id);
            document.getElementById('adminLoginError').textContent = '';
            document.getElementById('adminLoginError').innerHTML = '';
            loginError.textContent = '';
        } else {
            // injection succeeded but matched a non-admin — still show the "breach" for the demo
            alert('🚨 Auth bypassed via injection!\n' + JSON.stringify(vs.dumpDatabase(), null, 2));
        }
    } catch (e) {
        if (vs.securityEnabled) {
            document.getElementById('adminLoginError').textContent = e.message; // safe — plain text
            loginError.textContent = '';
        } else {
            document.getElementById('adminLoginError').innerHTML = e.message;
            loginError.innerHTML = ''; // vulnerable — raw HTML injection
        }
    }
});

document.getElementById('togglePasswordPanel').addEventListener('click', () => {
    const fields = document.getElementById('passwordFields');
    fields.style.display = fields.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('showAdminLoginBtn').addEventListener('click', () => {
    document.getElementById('voterLoginForm').style.display = 'none';
    document.getElementById('adminLoginForm').style.display = 'block';
});

document.getElementById('showVoterLoginBtn').addEventListener('click', () => {
    document.getElementById('adminLoginForm').style.display = 'none';
    document.getElementById('voterLoginForm').style.display = 'block';
});

document.getElementById('registerVoterBtn').addEventListener('click', () => {
    const id = document.getElementById('newVoterId').value;
    const name = document.getElementById('newVoterName').value;
    const password = document.getElementById('newVoterPassword').value;
    const msg = document.getElementById('registerVoterMsg');

    try {
        vs.registerVoter(id, name, password);
        msg.textContent = `Voter ${id} registered successfully.`;
        msg.className = 'fieldMsg success';
    } catch (e) {
        msg.textContent = e.message;
        msg.className = 'fieldMsg error';
    }
});

document.getElementById('addCandidateBtn').addEventListener('click', () => {
    const id = document.getElementById('newCandidateId').value;
    const name = document.getElementById('newCandidateName').value;
    const msg = document.getElementById('addCandidateMsg');

    try {
        vs.addcandidate(id, name);
        msg.textContent = `Candidate ${id} added successfully.`;
        msg.className = 'fieldMsg success';
        renderRemoveCandidateList();
    } catch (e) {
        msg.textContent = e.message;
        msg.className = 'fieldMsg error';
    }
});

document.getElementById('closeElectionBtn').addEventListener('click', () => {
    vs.electionOpen = false;
    vs.electionStarted = false;
    try {
        vs.closeElection();
        document.getElementById('appBanner').classList.remove('compact');
        controlmsg.textContent = 'Elections are Closed';
    }
    catch (e) {
        controlmsg.textContent = e.message;
    }
});

document.getElementById('startElectionBtn').addEventListener('click', () => {
    vs.electionOpen = true;
    vs.electionStarted = true;
    try {
        vs.startElection();
        // adminSection.style.display = 'none';
        // loginSection.style.display = 'block';
        // document.getElementById('voterLoginForm').style.display = 'block';
        // document.getElementById('adminLoginForm').style.display = 'none';
        // document.getElementById('appBanner').classList.remove('compact');
        controlmsg.textContent = 'Election started — registration locked.';
    } catch (e) {
        controlmsg.textContent = e.message;
    }
});

document.getElementById('changePasswordBtn').addEventListener('click', () => {
    const oldPass = document.getElementById('oldPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const passmsg = document.getElementById('Passmsg');
    try {
        vs.changePassword(oldPass, newPass);
        passmsg.textContent = 'Password changed successfully.';
    } catch (e) {
        passmsg.textContent = e.message;
    }
});

document.getElementById('toggleSecurityBtn').addEventListener('click', () => {
    const secMsg = document.getElementById('secMsg');
    secMsg.innerHTML = '';   // clear previous message before adding the new one

    const p = document.createElement('span');
    p.className = 'securityMsg';
    vs.toggleSecurity();
    p.textContent = `Security is Now ${vs.securityEnabled ? 'Enabled' : 'Disabled'}`;

    const btn = document.getElementById('toggleSecurityBtn');
    if (vs.securityEnabled) {
        btn.style.backgroundColor = 'transparent';
        btn.style.color = '#2fc787';
        btn.style.border = '2px solid var(--accent)';
        btn.style.borderRadius = '10px';
        p.style.color = 'var(--accent)';
    } else {
        btn.style.backgroundColor = 'transparent';
        btn.style.color = '#FF5577';
        btn.style.border = '2px solid var(--danger)';
        btn.style.borderRadius = '20px';
        p.style.color = 'var(--danger)';
    }

    secMsg.appendChild(p);
});


document.getElementById('verifyChainBtn').addEventListener('click', async () => {
    const result = await vs.blockchain.isValid();
    controlmsg.textContent = result.valid
        ? '✅ Blockchain integrity verified — no tampering detected.'
        : `❌ TAMPERING DETECTED at Block ${result.brokenBlockIndex} — ${result.reason}`;
});

document.getElementById('resetSystemBtn').addEventListener('click', async () => {
    const confirmed = confirm('This will erase all voters, candidates, and the blockchain. Continue?');
    if (!confirmed) return;

    try {
        await vs.resetSystem();
        logoutToAdminLogin();

    } catch (e) {
        controlmsg.textContent = e.message;
    }
});

document.getElementById('tamperBtn').addEventListener('click', () => {
    try {
        vs.simulateTamperAttack();
        controlmsg.textContent = 'Attack simulated — now click "View Blockchain" or run integrity check to see the result.';
    } catch (e) {
        controlmsg.textContent = e.message;
    }
});
document.getElementById('viewResultsVoterBtn').addEventListener('click', () => {
    const msg = document.getElementById('viewResultVoterMsg');
    toggleOutput(msg, () => {
        try {

            let output = 'Results:\n';
            const results = vs.getResults();
            results.forEach((count, candidateId) => {
                output += `Candidate ${candidateId}: ${count} Votes\n`;
            });
            msg.textContent = output;
        } catch (e) {
            msg.textContent = e.message;
        }
    });
});

document.getElementById('viewResultsBtn').addEventListener('click', () => {
    const msg = document.getElementById('viewResult');

    toggleOutput(msg, async () => {
        try {
            let output = 'Results : \n';
            let results = vs.getResults();

            results.forEach((count, candidateId) => {
                output += `Candidate ${candidateId}: ${count} Votes\n`;
            });

            msg.innerText = output;
        } catch (e) {
            msg.innerText = e.message;
        }
    });
});

document.getElementById('viewBlockchainBtn').addEventListener('click', () => {
    const container = document.getElementById('blockchainView');
    toggleOutput(container, async () => {
        const result = await vs.blockchain.isValid();
        const blocks = vs.blockchain.toArray();

        blocks.forEach((b, i) => {
            const isBroken = !result.valid && b.index === result.brokenBlockIndex;
            const card = document.createElement('div');
            card.className = 'blockCard' + (isBroken ? ' tampered' : '');

            const fields = [
                ['Index', b.index], ['Timestamp', b.timestamp],
                ['Voter Hash', b.voterIdHash], ['Candidate', b.candidateId],
                ['Prev Hash', b.previousHash], ['Hash', b.hash]
            ];
            fields.forEach(([label, value]) => {
                const row = document.createElement('div');
                row.className = 'blockField';
                const span = document.createElement('span');
                span.textContent = label + ': ';
                row.appendChild(span);
                row.appendChild(document.createTextNode(value));
                card.appendChild(row);
            });

            if (isBroken) {
                const tag = document.createElement('div');
                tag.className = 'tamperedTag';
                tag.textContent = '🚨 TAMPERED BLOCK';
                card.appendChild(tag);
            }

            container.appendChild(card);
            if (i < blocks.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'blockConnector';
                connector.textContent = '→';
                container.appendChild(connector);
            }
        });
    });
});

document.getElementById('viewAuditLogBtn').addEventListener('click', () => {
    const auditMsg = document.getElementById('auditMsg');
    toggleOutput(auditMsg, () => {
        const logs = vs.auditing.getAll();
        auditMsg.innerHTML = ''; // clear first since we're building elements, not text

        logs.forEach(entry => {
            const row = document.createElement('div');
            row.className = 'auditRow';

            // Wherever you render audit rows (main.js viewAuditLogBtn handler)
            const time = document.createElement('span');
            time.className = 'auditTime';
            time.textContent = new Date(entry.timestamp).toLocaleString();  // converts to viewer's local time correctly

            const user = document.createElement('span');
            user.className = 'auditUser';
            user.textContent = entry.userId;

            const action = document.createElement('span');
            action.className = 'auditAction';
            action.textContent = entry.action;

            row.appendChild(time);
            row.appendChild(document.createTextNode(' | '));
            row.appendChild(user);
            row.appendChild(document.createTextNode(' | '));
            row.appendChild(action);

            auditMsg.appendChild(row);
        });
    });
});

function renderRemoveCandidateList() {
    const container = document.getElementById('removeCandidateList');
    container.innerHTML = '';
    vs.candidates.forEach(c => {
        const row = document.createElement('div');
        row.className = 'removeRow';

        const label = document.createElement('span');
        label.textContent = `${c.id} - ${c.name}`;

        const btn = document.createElement('button');
        btn.textContent = 'Remove';
        btn.addEventListener('click', () => {
            const pw = prompt('Enter admin password to confirm removal:');
            if (pw === null) return;
            try {
                vs.removeCandidate(c.id, pw);
                controlmsg.textContent = `Candidate ${c.id} removed.`;
                renderRemoveCandidateList(); // refresh list
            } catch (e) {
                controlmsg.textContent = e.message;
            }
        });

        row.appendChild(label);
        row.appendChild(btn);
        container.appendChild(row);
    });
}

document.getElementById('removeCandidate').addEventListener('click', () => {
    toggleOutput(document.getElementById('removeCandidateList'), renderRemoveCandidateList);
});

function renderRemoveVoterList() {
    const container = document.getElementById('removeList'); // add this div in HTML
    container.innerHTML = '';
    [...vs.users.values()]
        .filter(u => u instanceof Voter)
        .forEach(v => {
            const row = document.createElement('div');
            row.className = 'removeRow';

            const label = document.createElement('span');
            label.textContent = `${v.id} - ${v.name}`;

            const btn = document.createElement('button');
            btn.textContent = 'Remove';
            btn.addEventListener('click', () => {
                const pw = prompt('Enter admin password to confirm removal:');
                if (pw === null) return;
                try {
                    vs.removeVoter(v.id, pw);
                    controlmsg.textContent = `Voter ${v.id} removed.`;
                    renderRemoveVoterList();
                } catch (e) {
                    controlmsg.textContent = e.message;
                }
            });

            row.appendChild(label);
            row.appendChild(btn);
            container.appendChild(row);
        });
}

document.getElementById('removeVoter').addEventListener('click', () => {
    toggleOutput(document.getElementById('removeList'), renderRemoveVoterList);
});