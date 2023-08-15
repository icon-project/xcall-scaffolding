const {
  JVM_XCALL_ADDRESS,
  EVM_NETWORK_LABEL,
  JVM_NETWORK_LABEL
} = require("../config");
const { getTxResult, isValidHexAddress } = require("../utils");
const {
  initializeJvmContract,
  getBtpAddress,
  invokeJvmDAppMethod,
  // decodeMessage,
  encodeMessage,
  filterCallMessageSentEventJvm,
  parseCallMessageSentEventJvm,
  filterCallMessageEventEvm
} = require("./utils");

async function helloWorldE2E(deployments) {
  // get BTP addresses
  const evmDappBtpAddress = getBtpAddress(
    EVM_NETWORK_LABEL,
    deployments.HelloWorld.evm
  );

  const jvmDappBtpAddress = getBtpAddress(
    JVM_NETWORK_LABEL,
    deployments.HelloWorld.jvm
  );

  // initialize JVM contract and test results
  const request1 = await initializeJvmContract(deployments.HelloWorld.jvm, {
    _sourceXCallContract: JVM_XCALL_ADDRESS,
    _destinationBtpAddress: evmDappBtpAddress
  });
  console.log(
    `> Test: invoking 'initialize' method on JVM contract: ${
      isValidHexAddress(request1, "0x", 66) == true ? "SUCCESS" : "FAILURE"
    }`
  );
  const txResult1 = await getTxResult(request1);
  console.log(
    `> Test: validate tx for invoking 'initialize' method on JVM contract: ${
      txResult1.status == 1 ? "SUCCESS" : "FAILURE"
    }`
  );

  // send a message to EVM dApp and test results
  const msg = encodeMessage("Hello World!");
  const rollbackData = encodeMessage("Hello World! Rollback");
  const request2 = await invokeJvmDAppMethod(
    deployments.HelloWorld.jvm,
    "sendMessage",
    {
      payload: msg,
      rollback: rollbackData
    }
  );
  console.log(
    `> Test: invoking 'sendMessage' method on JVM contract: ${
      isValidHexAddress(request2, "0x", 66) == true ? "SUCCESS" : "FAILURE"
    }`
  );
  const txResult2 = await getTxResult(request2);
  console.log(
    `> Test: validate tx for invoking 'sendMessage' method on JVM contract: ${
      txResult2.status == 1 ? "SUCCESS" : "FAILURE"
    }`
  );

  // catch CallMessageSent event from JVM contract and test result
  const eventlog1 = filterCallMessageSentEventJvm(txResult2.eventLogs);
  console.log(
    `> Test: filtering 'CallMessageSent' event on JVM contract: ${
      eventlog1.length > 0 ? "SUCCESS" : "FAILURE"
    }`
  );
  const parsedEventlog1 = parseCallMessageSentEventJvm(eventlog1);

  // catch CallMessage event from EVM dApp and test result
  const eventlog2 = filterCallMessageEventEvm(
    jvmDappBtpAddress,
    deployments.HelloWorld.evm,
    parsedEventlog1._sn
  );
  console.log(
    `> Test: filtering 'CallMessage' event on EVM contract: ${
      eventlog2 != null ? "SUCCESS" : "FAILURE"
    }`
  );
  console.log(eventlog2);
  // invoke executeCall on EVM chain and test result
  // catch CallExecuted event from EVM dApp and test result
}

module.exports = {
  helloWorldE2E
};
