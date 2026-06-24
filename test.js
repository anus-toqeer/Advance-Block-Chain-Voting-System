import { VotingSystem } from './Classes/VotingSystem.js';

async function test() {
    const vs = new VotingSystem();
    await vs.init();

    vs.registerVoter('v1', 'Alice', '1234');
    vs.registerVoter('v2', 'Bob', '1234');
    vs.addcandidate(1, 'John');
    vs.addcandidate(2, 'Sara');

    // console.log('Login:', vs.login('v1', '1234'));
    // console.log('Login:', vs.login('v2', '1234'));

    
    vs.login('v1','1234');
    await vs.castVote(1);

    vs.login('v2','1234');
    await vs.castVote(2);


    
    
    // console.log('Results:', vs.getResults());
    try {
        vs.getResults();
    } catch (e) {
        console.log('Blocked as expected:', e.message);
    }

    // Admin logs in and closes the election
    vs.login('admin1', 'Admin123');
    vs.closeElection();
    // console.log('Chain valid?', await vs.blockchain.isValid());
    // console.log('Audit Log:', vs.auditing.getAll());

    console.log('Results:', vs.getResults());

    console.log('Search results:', vs.searchCandidate('" || true || "'));
    vs.toggleSecurity();
    console.log('Search results:', vs.searchCandidate('" || true || "'));
}

test();