const VotingDapp = artifacts.require("VotingDapp.sol");

module.exports = (deployer, network, accounts) => {
  console.log("> Deploying VotingDapp contract to network: " + network);
  const deployerAccount = accounts[0];
  console.log("> Deployer account: " + deployerAccount);
  deployer.deploy(VotingDapp, deployerAccount, 10);
  console.log("> VotingDapp contract deployed!\n");
};
