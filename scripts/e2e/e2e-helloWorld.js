const { JVM_XCALL_ADDRESS, EVM_NETWORK_LABEL } = require("../config");
const { getTxResult, isValidHexAddress } = require("../utils");
const { initializeJvmContract, getBtpAddress } = require("./utils");

async function helloWorldE2E(deployments) {
  // get BTP address of EVM dApp
  const evmDappBtpAddress = getBtpAddress(
    EVM_NETWORK_LABEL,
    deployments.HelloWorld.evm
  );

  // initialize JVM contract and test results
  const response_01 = await initializeJvmContract(deployments.HelloWorld.jvm, {
    _sourceXCallContract: JVM_XCALL_ADDRESS,
    _destinationBtpAddress: evmDappBtpAddress
  });
  console.log(
    `> Testing valid tx hash for invocation of 'initialize' method on JVM contract: ${
      isValidHexAddress(response_01, "0x", 66) == true ? "SUCCESS" : "FAILURE"
    }`
  );
  const txResult_01 = await getTxResult(response_01);
  console.log(
    `> Testing valid invocation of 'initialize' method on JVM contract: ${
      txResult_01.status == 1 ? "SUCCESS" : "FAILURE"
    }`
  );

  // send a message to EVM dApp and test results
  // catch CallMessageSent event from JVM contract and test result
  // catch CallMessage event from EVM dApp and test result
  // invoke executeCall on EVM chain and test result
  // catch CallExecuted event from EVM dApp and test result
}

module.exports = {
  helloWorldE2E
};
