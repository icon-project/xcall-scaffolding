const VotingDapp = artifacts.require("VotingDapp");
const { strToHex, isValidEVMAddress } = require("../utils/utils");

contract("VotingDapp", accounts => {
  const deployer = accounts[0];
  const voteYes = strToHex("voteYes");

  // test #1 - should return the total votes
  it("should cast a vote for yes and return the total votes", async () => {
    const dapp = await VotingDapp.deployed();
    await dapp.handleCallMessage("btp://network/account", voteYes, {
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
  it("returned svcCall address should be equal to supplied address in constructor during deployment", async () => {
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
    for (let i = 0; i < 10; i++) {
      try {
        await dapp.handleCallMessage("btp://network/account", voteYes, {
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
  it("should return the votes cap and the value should be 10", async () => {
    const dapp = await VotingDapp.deployed();
    const response = await dapp.getVotesCap();
    const votesCap = response.toString();
    console.log("votesCap", votesCap);
    assert(votesCap === "10", "The votes cap is not 10");
  });
});
