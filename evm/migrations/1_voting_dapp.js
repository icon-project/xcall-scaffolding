const VotingDapp = artifacts.require("VotingDapp.sol");
const HelloWorld = artifacts.require("HelloWorld.sol");

module.exports = (deployer, network, accounts) => {
  const deployerAccount = accounts[0];

  console.log("> Deploying VotingDapp contract to network: " + network);
  console.log("> Deployer account: " + deployerAccount);
  deployer.deploy(VotingDapp, deployerAccount, 10);
  console.log("> VotingDapp contract deployed!\n");

  console.log("> Deploying HelloWorld contract to network: " + network);
  console.log("> Deployer account: " + deployerAccount);
  deployer.deploy(HelloWorld, deployerAccount);
  console.log("> HelloWorld contract deployed!\n");
};
