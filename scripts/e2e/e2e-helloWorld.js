const { config, utils } = require("../utils");
const {
  initializeJvmContract,
  initializeEvmContract,
  getBtpAddress,
  invokeJvmDAppMethod,
  // decodeMessage,
  encodeMessage,
  filterCallMessageSentEventJvm,
  parseCallMessageSentEventJvm,
  filterCallMessageEventEvm,
  waitCallMessageEventEvm,
  executeCallEvm,
  filterCallExecutedEventEvm,
  waitCallExecutedEventEvm,
  waitResponseMessageEventJvm
} = require("./utils");
const {
  JVM_XCALL_ADDRESS,
  EVM_XCALL_ADDRESS,
  EVM_NETWORK_LABEL,
  JVM_NETWORK_LABEL
} = config;
const { getTxResult, isValidHexAddress } = utils;

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

  // initialize EVM contract and test results
  const request2 = await initializeEvmContract(
    deployments.HelloWorld.evm,
    deployments.HelloWorld.evmAbi,
    EVM_XCALL_ADDRESS,
    jvmDappBtpAddress
  );
  console.log(
    `> Test: invoking 'initialize' method on EVM contract: ${
      isValidHexAddress(request2.transactionHash, "0x", 66) == true
        ? "SUCCESS"
        : "FAILURE"
    }`
  );

  // send a message to EVM dApp and test results
  const msg = encodeMessage("Hello World!");
  const rollbackData = encodeMessage("Hello World! Rollback");
  // const rollbackData = null;
  const requestParams = {
    payload: msg
  };
  if (rollbackData != null) {
    requestParams.rollback = rollbackData;
  }

  const request3 = await invokeJvmDAppMethod(
    deployments.HelloWorld.jvm,
    "sendMessage",
    requestParams
  );
  console.log(
    `> Test: invoking 'sendMessage' method on JVM contract: ${
      isValidHexAddress(request3, "0x", 66) == true ? "SUCCESS" : "FAILURE"
    }`
  );
  const txResult2 = await getTxResult(request3);
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
  const event2 = await waitCallMessageEventEvm(eventlog2);
  const reqId = event2[0].args._reqId;
  const data = event2[0].args._data;
  console.log(
    `> Test: Wait for 'CallMessage' event to be raised on EVM contract: ${
      reqId != null && data != null ? "SUCCESS" : "FAILURE"
    }`
  );

  // invoke executeCall on EVM chain and test result
  const request4 = await executeCallEvm(reqId, data);

  console.log(
    `> Test: invoking 'executeCall' method on EVM contract: ${
      isValidHexAddress(request4.transactionHash, "0x", 66) == true
        ? "SUCCESS"
        : "FAILURE"
    }`
  );
  // catch CallExecuted event from EVM dApp and test result
  const eventlog3 = filterCallExecutedEventEvm(reqId);
  console.log(
    `> Test: filtering 'CallExecuted' event on EVM contract: ${
      eventlog3 != null ? "SUCCESS" : "FAILURE"
    }`
  );
  const event3 = await waitCallExecutedEventEvm(eventlog3);
  console.log(
    `> Test: Wait for 'CallExecuted' event to be raised on EVM contract: ${
      event3.length > 0 ? "SUCCESS" : "FAILURE"
    }`
  );

  // If rollbackData is not null, invoke rollback on EVM chain and test result
  if (rollbackData != null) {
    const responseMessageEvent = await waitResponseMessageEventJvm();
    console.log("response message event");
    console.log(responseMessageEvent);
  }
}

module.exports = {
  helloWorldE2E
};
