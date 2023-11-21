const HelloWorld = artifacts.require("HelloWorld");
const { strToHex, isValidEVMAddress } = require("../utils/utils");

contract("HelloWorld", accounts => {
  const deployer = accounts[0];
  const xcallContractAddress = accounts[1];

  // test #1 - recieves message
  it("should initialize and be able to receive message", async () => {
    const destinationAddress = "network/account";
    const payload = "0x12345";

    const dapp = await HelloWorld.deployed();
    await dapp.initialize(xcallContractAddress, destinationAddress, {
      from: deployer
    });

    const receipt = await dapp.handleCallMessage(destinationAddress, payload, {
      from: xcallContractAddress
    });

    assert(receipt.logs[0].event === "MessageReceived", "Event not emitted");
  });
});
