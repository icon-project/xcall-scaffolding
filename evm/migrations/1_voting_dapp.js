const VotingDapp = artifacts.require("VotingDapp.sol");
const HelloWorld = artifacts.require("HelloWorld.sol");

module.exports = async (deployer, network, accounts) => {
  // account 0 is the deployer account on development networks like ganache
  const deployerAccount = accounts[0];
  console.log("> Deployer account: " + deployerAccount);

  // deploy HelloWorld contract
  console.log("> Deploying HelloWorld contract to network: " + network);
  await deployer.deploy(HelloWorld, deployerAccount);
  console.log("> HelloWorld contract deployed!\n");

  // deploy VotingDapp contract
  console.log("> Deploying VotingDapp contract to network: " + network);
  await deployer.deploy(VotingDapp);
  console.log("> VotingDapp contract deployed!\n");
};
