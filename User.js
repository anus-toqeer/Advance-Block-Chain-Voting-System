export class User {
    constructor(id, name, password) {
        this.id = id;
        this.name = name;
        this.password = password;
    }
}

export class Voter extends User {
     constructor(id, name, password) {
        super(id, name, password); // sets up id, name, password via User
        this.hasVoted = false;
        this.votedAt = null;
    }
}
export class Admin extends User{
    constructor(id,name,password){
        super(id,name,password);
    }

}