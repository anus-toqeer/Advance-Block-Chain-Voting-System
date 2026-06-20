import { Block } from "./block.js";

export class BlockChain {
    constructor(){
        this.tail=null
        this.length=0
    }
    async AddGenesisBlock(){
        const genesis = new Block(0,'GENESIS','GENESIS','GENESIS')
        genesis.prev=null;
        await genesis.calculateHash();
        this.tail=genesis;
        this.length++;
    }
    async Addblock(voterIDhash,candidateId){
        const NewBlock = new Block(this.length,voterIDhash,candidateId,this.tail.hash);
        NewBlock.prev=this.tail;
        await NewBlock.calculateHash();
        this.tail=NewBlock;
        this.length ++;
    }
    // Tail Always Point to the newest block and each block link previous VIA Prev Pointer 
    async isValid(){
        let current = this.tail;
        while(current && current.previousHash){
            let neww = await Block.hashValue(current.Getstring());
            if(current.hash!==neww) return false;
            if(current.previousHash!==current.prev.hash) return false;
            current=current.prev;
        }
        return true;
    }
    toArray() {
        const blocks = [];
        let current = this.tail;
        while (current) {
            blocks.push(current);
            current = current.prev;
        }
        return blocks.reverse(); // oldest → newest, for display
    }

}