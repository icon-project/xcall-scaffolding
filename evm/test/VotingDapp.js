const VotingDapp = artifacts.require("VotingDapp");
const { strToHex, isValidEVMAddress } = require("../utils/utils");

const VOTES_CAP = 10;

contract("VotingDapp", accounts => {
  const deployer = accounts[0];
  const voteYes = strToHex("voteYes");

  // test #1 - should return the total votes
  it("should cast a vote for yes and return the total votes", async () => {
    const dapp = await VotingDapp.deployed();
    // initialize the contract with the votes cap
    await dapp.initialize(
      "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
      VOTES_CAP
    );
    await dapp.handleCallMessage("network/account", voteYes, {
      from: deployer
    });
    const response = await dapp.getVotes();
    const votesAmount = response["0"].toString();

    assert("1" === votesAmount, "The vote was not casted correctly");
  });

  // test #2 - should return a valid contract address
  it("should return a valid contract address", async () => {
    const dapp = await VotingDapp.deployed();
    const svcCall = await dapp.getCallService();
    assert(isValidEVMAddress(svcCall), "svcCall is not a valid EVM address");
  });

  // test #3 - should return a valid contract address
  it("returned svcCall address should be equal to supplied address in transaction calling 'initialize' method", async () => {
    const dapp = await VotingDapp.deployed();
    const svcCall = await dapp.getCallService();
    assert(
      deployer === svcCall,
      "svcCall equal to the address suplied in constructor during deployment"
    );
  });

  // test #4 - should revert transaction
  it("should revert transaction when votes cap is reached", async () => {
    const dapp = await VotingDapp.deployed();
    let revertReason = null;
    for (let i = 0; i < VOTES_CAP; i++) {
      try {
        await dapp.handleCallMessage("network/account", voteYes, {
          from: deployer
        });
      } catch (e) {
        revertReason = e.reason;
      }
    }
    assert(
      revertReason === "VotesCapReached",
      "The transaction was not reverted correctly"
    );
  });

  // test #5 - should return the votes cap
  it(`should return the votes cap and the value should be ${VOTES_CAP}`, async () => {
    const dapp = await VotingDapp.deployed();
    const response = await dapp.getVotesCap();
    const votesCap = response.toString();
    assert(votesCap === `${VOTES_CAP}`, `The votes cap is not ${VOTES_CAP}`);
  });
});
