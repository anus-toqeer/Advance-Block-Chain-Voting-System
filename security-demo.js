import { VotingSystem } from '../Classes/VotingSystem.js';

const vs = new VotingSystem();
await vs.init();

vs.addcandidate(1, '<img src=x onerror="alert(\'XSS executed\')">');

const container = document.getElementById('candidateList');

console.log('--- Security OFF ---');
vs.renderCandidates(container); // attack fires here

vs.login('admin1', 'Admin123'); // your seeded admin credentials
vs.toggleSecurity();


setTimeout(()=>{
    console.log('--- Security ON ---');
    vs.renderCandidates(container); // should NOT fire this time
},4000);





