#include <iostream>
#include <fstream>
#include <cstring>
#include <cmath>
#include <stdlib.h>
#include <ctime>
#include <string>

#define RESET "\033[0m"
#define RED "\033[31m"
#define GREEN "\033[32m"
#define YELLOW "\033[33m"
#define BLUE "\033[34m"
#define CYAN "\033[36m"
#define BOLDWHITE "\033[1m\033[37m"

using namespace std;

struct Voter
{
    int id;
    bool isvoted;
};

struct Block
{
    int blocknumber;
    char previoushash[50];
    char currenthash[50];
    int voterid;
    int candidatevote;
    char timestamp[50];
};
struct Candidate
{
    int id;
    char name[50];
};

const int Max_voters = 100;
const int Max_blocks = 500;
const int key = 17;
const int Max_candidates = 5;

Voter *voters = new Voter[Max_voters];
int votercount = 0;

Block *blockchain = nullptr;
int blockcount = 0;

int results[Max_candidates] = {0};
char adminpassword[50] = "admin123";
Candidate *candidates = new Candidate[Max_candidates];
int candidateCount = 0;

void loadAdminPassword();
void saveAdminPassword();
bool verifyAdmin();
void changeAdminPassword();

void add_candidate();
void save_candidate();
void load_candidate();

int encryptVote(int plainVote);
int decryptVote(int encryptedVote);

void load_Voters();
void save_Voters();
void register_Voter();
bool isVoter_Registered(int id);
bool hasVoted(int id);
void markVoterAsVoted(int id);
void search_Voter(int id);

void load_chain();
void save_chain();
void cast_vote();
void calculate_hash(const char *prev, int voterId, int vote, const char *time, char *output);
void display_Blockchain();
bool verify_Chain();
void search_Block(int blockNumber);
void ChainToFile();
void gen_Timestamp(char *buffer);
bool isValidName(const char *name);
void fullReset();


void display();
void save();
void load();

void clearScreen();
void pause();
void menu();
void exitProgram();

int main()
{
    system("cls");
    
    blockchain = new Block[Max_blocks];

    
    loadAdminPassword();
    load_Voters();
    load_candidate();
    load_chain();
    load();

    menu();
    delete[] voters;
    delete[] candidates;
    delete[] blockchain;

    return 0;
}

void fullReset()
{
    cout << RED << "So we are clearing all the previous data...\n" << RESET;
    blockcount = 0;
    votercount = 0;
    candidateCount = 0;

    for (int i = 0; i < Max_candidates; i++)
        results[i] = 0;
    
    ofstream f1("voters.txt", ios::trunc);
    f1.close();

    ofstream f2("blockchain.txt", ios::trunc);
    f2.close();

    ofstream f3("candidate.txt", ios::trunc);
    f3.close();
     
    ofstream f4("results.txt", ios::trunc);
    f4.close();

    cout << GREEN << "System fully reset.\n" << RESET;
    exitProgram();
}
    // Admin Fucntions  

bool verifyAdmin()
{

    cout << BLUE << "\n----- Admin verification -----\n"
         << RESET;
    cout << endl;
    char enteredPassword[50];

    cout << YELLOW << "Enter admin password: " << RESET;
    cin >> enteredPassword;
    int c = 0;
    while (c < 3 && strcmp(enteredPassword, adminpassword) != 0)
    {
        cout << RED << "\n Incorrect password. Enter again : \n"
             << RESET;
        if (c == 2)
        {
            cout << RED << "Incorrect password ! trying limit reached " << RESET << endl;
            return false;
        }
        c++;
        cin >> enteredPassword;
    }
    cout << GREEN << "\nVerification succcesful.\n";
    return true;
}
void saveAdminPassword()
{
    ofstream file("admin.txt");
    file << adminpassword << endl;
    file.close();
}

void loadAdminPassword()
{
    ifstream fin("admin.txt");
    if (fin)
    {
        fin.getline(adminpassword, 50);
        fin.close();
    }
    else
    {
        cout << RED << "File not found.\n"
             << RESET;
    }
}
void changeAdminPassword()
{
    if (!verifyAdmin())
    {
        cout << RED << "Verification failed. Cannot change password.\n"
             << RESET;
        return;
    }

    cout << BLUE << "\n ------ Change Admin Password------\n"
         << RESET;

    char newpass[50];
    cout << YELLOW << "Enter new  password: " << RESET;
    cin >> newpass;

    if (strcmp(newpass, adminpassword) == 0)
    {
        cout << RED << "New password cannot be the same as the old password.\n"
             << RESET;
        return;
    }

    strcpy(adminpassword, newpass);
    saveAdminPassword();
    cout << GREEN << " Admin password changed successfully.\n"
         << RESET;
}

    //  voter functions
void save_Voters()
{
    ofstream fout("voters.txt");
    fout << votercount << endl;
    fout << "Id  Status\n";
    for (int i = 0; i < votercount; i++)
    {
        fout << voters[i].id << " " << voters[i].isvoted << endl;
    }
    fout.close();
}
void load_Voters()
{
    ifstream fin1("voters.txt");
    string temp;
    if (!fin1)
        return;

    if (!(fin1 >> votercount))
        return;

    getline(fin1, temp);
    getline(fin1,temp);
    for (int i = 0; i < votercount; i++)
    {
        fin1 >> voters[i].id >> voters[i].isvoted;
        if (i >= Max_voters - 1)
            break;
    }
    fin1.close();
}

bool isVoter_Registered(int id)
{
    for (int i = 0; i < votercount; i++)
    {
        if (voters[i].id == id)
        {
            return true;
        }
    }
    return false;
}

bool hasVoted(int id)
{

    for (int i = 0; i < votercount; i++)
    {
        if (voters[i].id == id)
        {
            return voters[i].isvoted;
        }
    }
    return false;
}

void markVoterAsVoted(int id)
{
    for (int i = 0; i < votercount; i++)
    {
        if (voters[i].id == id)
        {
            voters[i].isvoted = true;
            return;
        }
    }
    return;
}

void search_Voter(int id)
{
    clearScreen();
    cout << BLUE << "\n------- Voter Searching -------\n"
         << RESET;

    bool found = false;
    for (int i = 0; i < votercount; i++)
    {
        if (voters[i].id == id)
        {
            cout << YELLOW << "Voter ID: " << voters[i].id << RESET << endl;
            cout << CYAN << "Status: " << ((voters[i].isvoted) ? "Already voted" : "Not voted") << RESET << endl;
            found = true;
            break;
        }
    }

    if (!found)
        cout << RED << "Voter not found!\n"
             << RESET;
}

void register_Voter()
{
    clearScreen();
    cout << BLUE << "\n---------Register a New Voter --------\n"
         << RESET;

    if (!verifyAdmin())
    {
        cout << RED << " Access denied.\n"
             << RESET;
        return;
    }

    int id;
    cout << YELLOW << "Enter Voter ID: " << RESET;
    cin >> id;

    while (isVoter_Registered(id))
    {
        cout << RED << "\nVoter ID already exists! Enter again: " << RESET;
        cin >> id;
    }

    if (votercount >= Max_voters)
    {
        cout << RED << "\n Maximum voter limit reached!\n"
             << RESET;
        return;
    }

    voters[votercount].id = id;
    voters[votercount].isvoted = false;
    votercount++;

    cout << GREEN << "\nVoter registered successfully!\n"
         << RESET;

    save_Voters();
}

    //   candidate functions

bool isDuplicateName(const char newName[])
{
    for (int i = 0; i < candidateCount; i++)
    {
        if (strcmp(candidates[i].name, newName) == 0)
        {
            return true;
        }
    }
    return false;
}

void add_candidate()
{
    if (!verifyAdmin())
    {
        cout << RED << "Access denied.\n"
             << RESET;
        return;
    }
    cout << BLUE << "\n------- Add New Candidate -------\n"
         << RESET;

    if (candidateCount >= Max_candidates)
    {
        cout << RED << "Maximum candidates reached.\n"
             << RESET;
        return;
    }

    cout << YELLOW << "Enter candidate name: " << RESET;
    cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    char tempname[50];
    cin.getline(tempname, 50);
    if (!isValidName(tempname))
    {
        cout << RED << "Invalid name. use alphabets only (3-30 chars).\n"
             << RESET;
        return;
    }
    if (isDuplicateName(tempname))
    {
        cout << RED << "Candidate with this name already exists!\n"
             << RESET;
        return;
    }
    strcpy(candidates[candidateCount].name, tempname);
    candidates[candidateCount].id = candidateCount + 1;
    candidateCount++;

    save_candidate();
    cout << GREEN << "Candidate added successfulyy\n"
         << RESET;
}
bool isValidName(const char *name)
{
    int len = strlen(name);

    if (len == 0)
        return false;
    if (len < 3 || len > 30)
        return false;

    bool valid = false;
    for (int i = 0; i < len; i++)
    {
        if (isalpha(name[i]))
            valid = true;
        if (!(isalpha(name[i]) || name[i] == ' '))
            return false;
    }
    return valid;
}

void save_candidate()
{
    ofstream fout("candidate.txt");
    fout << candidateCount << endl;
    for (int i = 0; i < candidateCount; i++)
    {
        fout << candidates[i].id << " " << candidates[i].name << endl;
    }
    fout.close();
}
void load_candidate()
{
    ifstream fin("candidate.txt");
    if (!fin)
    {
        cout << RED << " candidate file not found.\n";
        return;
    }
    fin >> candidateCount;

    for (int i = 0; i < candidateCount; i++)
    {
        fin >> candidates[i].id;
        fin.ignore();

        fin.getline(candidates[i].name, 50);
    }
    fin.close();
}
    //    Blockchain Functions

int encryptVote(int vote)
{
    return (vote + key) % 100;
}

int decryptVote(int vote)
{
    int d = (vote - key) % 100;
    if (d < 0)
    {
        d += 100;
    }
    return d;
}
void save_chain()
{
    ofstream fout1("blockchain.txt");
    fout1 << blockcount << endl;
    for (int i = 0; i < blockcount; i++)
    {
        fout1 << blockchain[i].blocknumber << " " << blockchain[i].previoushash << " " << blockchain[i].currenthash << " " << blockchain[i].voterid << " " << blockchain[i].candidatevote << " " << blockchain[i].timestamp << endl;
    }
    fout1.close();
}

void load_chain()
{
    ifstream fin2("blockchain.txt");
    if (fin2)
    {
        fin2 >> blockcount;
        for (int i = 0; i < blockcount; i++)
        {
            fin2 >> blockchain[i].blocknumber >> blockchain[i].previoushash >> blockchain[i].currenthash >> blockchain[i].voterid >> blockchain[i].candidatevote;
            fin2.ignore();
            fin2.getline(blockchain[i].timestamp, 50);
        }
        fin2.close();
    }
}
void cast_vote()
{
    clearScreen();
    cout << BLUE << "\n -------- VOte Casting ------\n"<< RESET;
    if(candidateCount==0) {
        cout<<RED <<"No candidate registered Yet "<<RESET<<endl;
        return;
    }
    int id;
    cout << YELLOW << "Enter your voter ID: " << RESET;
    cin >> id;
    int c = 0;
    while (c <3 && !isVoter_Registered(id))
    {
        if (c == 2)
        {
            cout << "Incorrect trying limit reached\n";
            return;
        }
        c++;
        cout << RED << " Voter ID not registered!\n"<< RESET;
        cout << YELLOW << " Enter Id again : ";
        cin >> id;
    }
    if (hasVoted(id))
    {
        cout << RED << " You have already voted!\n"
             << RESET;
        return;
    }

    cout << CYAN << "\nList of Candidates:\n"<< RESET;
    for (int i = 0; i < candidateCount; i++)
        cout << GREEN << candidates[i].id << ". " << candidates[i].name << RESET << endl;

    int vote;
    cout << YELLOW << "Enter candidate ID to vote for: " << RESET;
    cin >> vote;

    while (vote < 1 || vote > candidateCount)
    {
        cout << RED << ".. Invalid candidate ID!\n"<< RESET;
        cout << YELLOW << "Enter again : " << RESET;
        cin >> vote;
    }

    Block newblock;
    newblock.blocknumber = blockcount;
    newblock.voterid = id;
    newblock.candidatevote = encryptVote(vote);

    strcpy(newblock.previoushash, (blockcount == 0) ? "GENESIS" : blockchain[blockcount - 1].currenthash);

    gen_Timestamp(newblock.timestamp);
    calculate_hash(newblock.previoushash, newblock.voterid, newblock.candidatevote, newblock.timestamp, newblock.currenthash);
    blockchain[blockcount] = newblock;
    blockcount++;

    markVoterAsVoted(id);
    results[vote - 1]++;
    save();
    save_chain();
    save_Voters();

    cout << GREEN << "\nVote cast successfully !\n"<< RESET;
}

void gen_Timestamp(char *buffer)
{
    time_t now = time(0);
    struct tm *tstruct = localtime(&now);
    strftime(buffer, 50, "%Y-%m-%d %X", tstruct);
}
void calculate_hash(const char *prev, int voterId, int vote, const char *time, char *output)
{
    unsigned long hash = 5381;
    char combined[256];

    sprintf(combined, "%s|%d|%d|%s", prev, voterId, vote, time);

    for (int i = 0; combined[i] != '\0'; i++)
        hash = ((hash << 5) + hash) + combined[i];

    sprintf(output, "HASH%06lu", hash % 1000000);
}

void display_Blockchain()
{
    clearScreen();
    cout << BLUE << "------------- BLOCKCHAIN --------------\n"<< RESET;
    if (!verifyAdmin())
    {
        cout << RED << "Access denied" << RESET << endl;
        return;
    }

    if (blockcount == 0)
    {
        cout << RED << "Blockchain is empty. No blocks to display.\n"<< RESET;
        return;
    }

    for (int i = 0; i < blockcount; i++)
    {
        cout << CYAN << "Block Number: " << blockchain[i].blocknumber << RESET << endl;
        cout << YELLOW << "Previous Hash: " << blockchain[i].previoushash << RESET << endl;
        cout << YELLOW << "Current Hash: " << blockchain[i].currenthash << RESET << endl;
        cout << YELLOW << "Voter ID: " << blockchain[i].voterid << RESET << endl;
        cout << YELLOW << "Candidate voted (Encrypted): " << blockchain[i].candidatevote << RESET << endl;
        cout << YELLOW << "Timestamp: " << blockchain[i].timestamp << RESET << endl;
        cout << BOLDWHITE << "-----------------------------------\n"<< RESET;
    }
}

void search_Block(int num)
{
    clearScreen();
    cout << BLUE << "\n-------- SEARCH BLOCK -------\n"<< RESET;

    if (num < 0 || num >= blockcount)
    {
        cout << RED << " Block not found!\n"<< RESET;
        return;
    }

    cout << CYAN << "Block Number: " << blockchain[num].blocknumber << RESET << endl;
    cout << YELLOW << "Previous Hash: " << blockchain[num].previoushash << RESET << endl;
    cout << YELLOW << "Current Hash: " << blockchain[num].currenthash << RESET << endl;
    cout << YELLOW << "Voter ID: " << blockchain[num].voterid << RESET << endl;
    cout << YELLOW << "Encrypted Vote: " << blockchain[num].candidatevote << RESET << endl;
    cout << YELLOW << "Timestamp: " << blockchain[num].timestamp << RESET << endl;
}
void ChainToFile()
{
    if (!verifyAdmin())
    {
        cout << RED << "Access denied.\n"<< RESET;
        return;
    }

    if (blockcount == 0)
    {
        cout << RED << "Blockchain is empty.\n"<< RESET;
        return;
    }

    cout << CYAN << "Exporting " << blockcount << " blocks...\n" << RESET;
    ofstream fout3("blockchain_export.txt");

    fout3 << "BLOCKCHAIN VOTING SYSTEM BACKUP\n";
    fout3 << "----------------------------------------\n";

    char Time[50];
    time_t now = time(0);
    strftime(Time, 50, "%Y-%m-%d %H:%M:%S", localtime(&now));
    fout3 << "Export Timestamp: " << Time << "\n";
    fout3 << "Total Blocks: " << blockcount << "\n";

    for (int i = 0; i < blockcount; i++)
    {
        fout3 << "Block Number: " << blockchain[i].blocknumber << "\n";
        fout3 << "Previous Hash: " << blockchain[i].previoushash << "\n";
        fout3 << "Current Hash: " << blockchain[i].currenthash << "\n";
        fout3 << "Voter ID: " << blockchain[i].voterid << "\n";
        fout3 << "Encrypted Vote: " << blockchain[i].candidatevote << "\n";
        int d = decryptVote(blockchain[i].candidatevote);
        fout3 << "Decrypted Vote (Candidate ID): " << d << "\n";
        fout3 << "Timestamp: " << blockchain[i].timestamp << "\n";
        fout3 << "-----------------------------------\n";
    }

    fout3.close();
    cout << GREEN << "Blockchain exported in blockchain_export.txt \n"<< RESET;
}

bool verify_Chain()
{
    clearScreen();
    cout << BLUE << " ------- Blockchain Verification ------\n"<< RESET;

    if (blockcount == 0)
    {
        cout << RED << "Blockchain is empty. Nothing to verify.\n"<< RESET;

        return true;
    }

    for (int i = 0; i < blockcount; i++)
    {
        cout << CYAN << "Checking Block " << i << ": " << RESET;

        char re_hash[50];
        calculate_hash(blockchain[i].previoushash, blockchain[i].voterid, blockchain[i].candidatevote, blockchain[i].timestamp, re_hash);

        if (strcmp(blockchain[i].currenthash, re_hash) != 0)
        {
            cout << RED << "Failed...\n" << RESET;
            cout << RED << "Blockchain has been tampered.\n"<< RESET;
            return false;
        }

        if (i > 0 && strcmp(blockchain[i].previoushash, blockchain[i - 1].currenthash) != 0)
        {
            cout << RED << "Failed..\n"<< RESET;
            cout << RED << "Block linking error.\n"<< RESET;
            return false;
        }

        cout << GREEN << "Valid\n"<< RESET;
    }

    cout << GREEN << "\nBlockchain verification completed, All blocks are valid.\n"<< RESET;
    return true;
}

    //   Result Fucntions 
void save()
{
    ofstream file("results.txt");

    if (!file)
        return;

    file << candidateCount << endl;

    for (int i = 0; i < candidateCount; i++)
    {
        file << candidates[i].name << " " << results[i] << endl;
    }

    file.close();
}

void load()
{
    for (int i = 0; i < Max_candidates; i++)
        results[i] = 0;

    for (int i = 0; i < blockcount; i++)
    {
        int encryptedVote = blockchain[i].candidatevote;
        int realVote = decryptVote(encryptedVote);

        if (realVote >= 1 && realVote <= candidateCount)
            results[realVote - 1]++;
    }

    cout << GREEN << " Results recalculated from blockchain.\n"
         << RESET;
}

void display()
{
    clearScreen();
    cout << GREEN << "\n-------- Election Results  --------\n"
         << RESET;

    int total = 0;
    for (int i = 0; i < candidateCount; i++)
        total += results[i];

    if (total == 0)
    {
        cout << RED << "No votes cast yet.\n"<< RESET;
        return;
    }

    int maxvotes = 0;
    int maxnum = -1;

    for (int i = 0; i < candidateCount; i++)
    {
        cout << CYAN << "Candidate " << candidates[i].name << ": " << results[i] << " votes" << RESET << endl;
        double percent = (double)results[i] / total * 100.0;
        cout << YELLOW << "Percentage: " << percent << "%" << RESET << endl;

        if (results[i] > maxvotes)
        {
            maxvotes = results[i];
            maxnum = i;
        }
    }

    int tie = 0;
    for (int i = 0; i < candidateCount; i++)
    {
        if (results[i] == maxvotes)
            tie++;
    }

    if (tie > 1)
    {
        cout << RED << "\n** Election Tied **\n"<< RESET;
        cout << YELLOW << "candidates with max votes(" << maxvotes << " votes):\n"<< RESET;

        for (int i = 0; i < candidateCount; i++)
        {
            if (results[i] == maxvotes)
                cout << CYAN << "- " << candidates[i].name << RESET << endl;
        }

        cout << BOLDWHITE << "Disclaimer: Tie must be resolved by revoting.\n"<< RESET;
        return;
    }

    cout << GREEN << "\nWinner: " << candidates[maxnum].name << " with " << maxvotes << " votes\n" << RESET;
    cout << BOLDWHITE << "Note: All votes are secured in blockchain.\n"<< RESET;
}

    //  Utility Functions
void exitProgram()
{
    cout<<CYAN << "\nExiting the program...\n"<<RESET;
    exit(0);  
}

void menu()
{
    int choice;
    while (true)
    {
        clearScreen();
        cout << BOLDWHITE << "  BLOCKCHAIN VOTING SYSTEM\n"<< RESET;
        cout << CYAN;
        cout << "\n";
        cout << "  1)  Register New Voter (Admin)\n";
        cout << "  2)  Add Candidate (Admin)\n";
        cout << "  3)  Cast Vote\n";
        cout << "  4)  Display Blockchain (Admin)\n";
        cout << "  5)  Verify Blockchain\n";
        cout << "  6)  Display Results\n";
        cout << "  7)  Search Voter\n";
        cout << "  8)  Search Block\n";
        cout << "  9)  Export Blockchain (Admin)\n";
        cout << "  10) Change Admin Password (Admin)\n";
        cout << "  0)  Exit\n";
        cout << "    _________________________\n";
        cout << YELLOW;
        cout << "Enter choice: " << RESET;

        cin >> choice;

        if (choice == 0)
            break;

        switch (choice)
        {
        case 1:
            register_Voter();
            pause();
            break;
        case 2:
            add_candidate();
            pause();
            break;
        case 3:
            cast_vote();
            pause();
            break;
        case 4:
            display_Blockchain();
            pause();
            break;
        case 5:

           if(! verify_Chain()) {
            fullReset();
           }
            pause();
            break;
        case 6:
            display();
            pause();
            break;
        case 7:
        {
            int id;
            cout << YELLOW;
            cout << "Enter Voter ID: ";
            cin >> id;
            search_Voter(id);
            pause();
            break;
        }
        case 8:
        {
            int blocknum;
            cout << YELLOW;
            cout << "Enter Block Number: ";
            cin >> blocknum;
            search_Block(blocknum);
            pause();
            break;
        }
        case 9:
            ChainToFile();
            pause();
            break;
        case 10:
            changeAdminPassword();
            pause();
            break;
        default:
            pause();
            break;
        }
    }
}

void pause()
{
    cout << BLUE << "\nPress Enter to continue...";
    cin.ignore();
    cin.get();
}

void clearScreen()
{
    system("cls");
}