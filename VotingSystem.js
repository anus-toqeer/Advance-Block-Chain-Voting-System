import { BlockChain } from './blockChain.js';
import { Block } from './block.js';
import { User,Admin,Voter } from './User.js';
import { Candidate } from './candidate.js';

export class VotingSystem {
    constructor() {
        this.users = new Map();       // id -> Voter | Admin
        this.candidates = [];
        this.blockchain = new BlockChain();
        this.currentUser = null;
    }
    async init(){
        await this.blockchain.AddGenesisBlock();
        this.users.set('admin1',new Admin('admin1','Admin','Admin123'));
    }
    registerVoter(id,name,password){
        if(this.users.has(id)) throw new Error("Voter ID Already exits");
        const voter=new Voter(id,name,password);
        this.users.set(id,voter);
        return voter;
    }
    addcandidate(id,name){
        this.candidates.push(new Candidate(id,name));
    }
    login(id,password){
        const user=this.users.get(id);
        if(!user || password!=user.password) return null;
        this.currentUser=user;
        return user;
    }
    async castVote(id){
        if(!(this.currentUser instanceof Voter)) throw new Error("Voter ID Doesnot Exists");
        if(this.currentUser.hasVoted) throw new Error("Voter Already Voted");
        const VoterIdHash = await Block.hashValue(this.currentUser.id);
        await this.blockchain.Addblock(VoterIdHash,id);
        this.currentUser.hasVoted=true;
        this.currentUser.votedAt= new Date().toISOString();
    }
    getResults(){
        const tally= new Map();
        this.candidates.forEach(c => tally.set(c.id, 0));
        this.blockchain.toArray().forEach(block => {
            if (tally.has(block.candidateId)) tally.set(block.candidateId, tally.get(block.candidateId) + 1);
        });
        return tally;
    }
}