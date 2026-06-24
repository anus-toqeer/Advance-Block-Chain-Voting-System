// @ts-nocheck
import { VotingSystem } from "../Classes/VotingSystem.js";
import { Voter,Admin } from "../Classes/User.js";
const vs = new VotingSystem();
await vs.init();

const loginSection = document.getElementById('loginSection');
const voterSection = document.getElementById('voterSection');
const adminSection = document.getElementById('adminSection');
const loginError = document.getElementById('loginError');
const adminmsg= document.getElementById('adminOutput');

function logoutToAdminLogin() {
    vs.currentUser = null;
    document.getElementById('voterSection').style.display = 'none';
    adminSection.style.display = 'none';
    loginSection.style.display = 'block';
    document.getElementById('voterLoginForm').style.display = 'none';
    document.getElementById('adminLoginForm').style.display = 'block';
}
function logoutToVoterLogin() {
   vs.currentUser = null;
   voterSection.style.display = 'none';
   loginSection.style.display = 'block';
}
document.getElementById('logoutBtnVoter').addEventListener('click', logoutToVoterLogin);
document.getElementById('logoutBtnAdmin').addEventListener('click', logoutToAdminLogin);

document.getElementById('loginBtn').addEventListener('click', () => {
    const id = document.getElementById('loginId').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const user = vs.login(id, password);
        loginError.textContent = '';
        loginSection.style.display = 'none';

        if (user instanceof Admin) {
            adminSection.style.display = 'block';
        } else if (user instanceof Voter) {
            voterSection.style.display = 'block';
            vs.renderCandidates(document.getElementById('candidateList'));
        }
    } catch (e) {
        loginError.textContent = e.message;
    }
});
document.getElementById('showAdminLoginBtn').addEventListener('click', () => {
    document.getElementById('voterLoginForm').style.display = 'none';
    document.getElementById('adminLoginForm').style.display = 'block';
});

document.getElementById('showVoterLoginBtn').addEventListener('click', () => {
    document.getElementById('adminLoginForm').style.display = 'none';
    document.getElementById('voterLoginForm').style.display = 'block';
});

document.getElementById('adminLoginBtn').addEventListener('click', () => {
    const id = document.getElementById('adminLoginId').value;
    const password = document.getElementById('adminLoginPassword').value;

    try {
        const user = vs.login(id, password);
        document.getElementById('adminLoginError').textContent = '';

        if (user instanceof Admin) {
            loginSection.style.display = 'none';
            adminSection.style.display = 'block';
        } else {
            document.getElementById('adminLoginError').textContent = 'This account is not an admin.';
        }
    } catch (e) {
        document.getElementById('adminLoginError').textContent = e.message;
    }
});

document.getElementById('registerVoterBtn').addEventListener('click', () => {
    const id = document.getElementById('newVoterId').value;
    const name = document.getElementById('newVoterName').value;
    const password = document.getElementById('newVoterPassword').value;

    try {
        vs.registerVoter(id, name, password);
        adminmsg.textContent = `Voter ${id} registered successfully.`;
    } catch (e) {
        adminmsg.textContent = e.message;
    }
});

document.getElementById('addCandidateBtn').addEventListener('click',()=>{
    const id = document.getElementById('newCandidateId').value;
    const name = document.getElementById('newCandidateName').value;

    try{
        vs.addcandidate(id,name);
        adminmsg.textContent = `Candidate ${id} added Successfully.`;
    }
    catch (e){
        adminmsg.textContent = e.message;
    }
});

document.getElementById('closeElectionBtn').addEventListener('click',()=>{
    try{
        vs.closeElection();
        adminmsg.textContent = 'Elections are Closed';
    }
    catch(e){
        adminmsg.textContent = e.message;
    }
});

document.getElementById('startElectionBtn').addEventListener('click', () => {
    try {
        vs.startElection();
        adminSection.style.display = 'none';
        loginSection.style.display = 'block';
        document.getElementById('voterLoginForm').style.display = 'block';
        document.getElementById('adminLoginForm').style.display = 'none';
        document.getElementById('adminOutput').textContent = 'Election started — registration locked.';
    } catch (e) {
        document.getElementById('adminOutput').textContent = e.message;
    }
});

document.getElementById('toggleSecurityBtn').addEventListener('click',()=>{
    vs.toggleSecurity();
    adminmsg.textContent = `Security is Now ${vs.securityEnabled? 'On' : 'OFF'}`

});

document.getElementById('viewResultsBtn').addEventListener('click',()=>{
    try{
        let output = 'Results : \n';
        let results = vs.getResults();

        results.forEach((C_id,count)=>{
            output += `Candidate ${C_id,count} : ${count} Votes`;
        })
        adminmsg.innerText = output;
    } catch(e){
        adminmsg.innerText = e.message;
    }

});

document.getElementById('viewBlockchainBtn').addEventListener('click', () => {
    const blocks = vs.blockchain.toArray();
    let output = 'Blockchain:\n';
    blocks.forEach(b => {
        output += `Block ${b.index} | Hash: ${b.hash} | Prev: ${b.previousHash} | Candidate: ${b.candidateId}\n`;
    });
    document.getElementById('adminOutput').textContent = output;
});

document.getElementById('viewAuditLogBtn').addEventListener('click', () => {
    const logs = vs.auditing.getAll();
    let output = 'Audit Log:\n';
    logs.forEach(entry => {
        output += `${entry.timestamp} | ${entry.userId} | ${entry.action}\n`;
    });
    document.getElementById('adminOutput').textContent = output;
});

