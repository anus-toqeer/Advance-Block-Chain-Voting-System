import { VotingSystem } from './VotingSystem.js';

async function test() {
    const vs = new VotingSystem();
    await vs.init();

    vs.registerVoter('v1', 'Alice', '1234');
    vs.registerVoter('v2', 'Bob', '1234');
    vs.addcandidate(1, 'John');
    vs.addcandidate(2, 'Sara');

    console.log('Login:', vs.login('v1', '1234'));
    console.log('Login:', vs.login('v2', '1234'));
    
    vs.login('v1','1234');
    await vs.castVote(1);

    vs.login('v2','1234');
    await vs.castVote(2);

    console.log('Results:', vs.getResults());
    console.log('Chain valid?', await vs.blockchain.isValid());
}

test();