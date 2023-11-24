const { config, utils } = require("../utils");
const {
  initializeJvmContract,
  initializeEvmContract,
  getBtpAddress,
  invokeJvmDAppMethod,
  // decodeMessage,
  // encodeMessage,
  filterCallMessageSentEventJvm,
  parseCallMessageSentEventJvm,
  filterCallMessageEventEvm,
  waitCallMessageEventEvm,
  executeCallEvm,
  filterCallExecutedEventEvm,
  waitCallExecutedEventEvm
  // waitResponseMessageEventJvm
  // waitRollbackExecutedEventJvm
} = require("./utils");

const { Monitor } = require("../utils/monitor");
const {
  JVM_XCALL_ADDRESS,
  EVM_XCALL_ADDRESS,
  EVM_NETWORK_LABEL,
  JVM_NETWORK_LABEL
} = config;
const { getTxResult, isValidHexAddress, JVM_SERVICE, sleep } = utils;

async function votingDappE2E(deployments) {
  // test results
  const testResults = {
    initializeJvmContract: false,
    validateInitializeTxJvm: false,
    initializeEvmContract: false,
    invokeJvmDAppMethod: false,
    filterCallMessageSentEventJvm: false,
    parseCallMessageSentEventJvm: false,
    filterCallMessageEventEvm: false,
    waitCallMessageEventEvm: false,
    executeCallEvm: false,
    filterCallExecutedEventEvm: false,
    waitCallExecutedEventEvm: false,
    waitResponseMessageEventJvm: false,
    waitRollbackExecutedEventJvm: false
  };

  // get BTP addresses
  const evmDappBtpAddress = getBtpAddress(
    EVM_NETWORK_LABEL,
    deployments.VotingDapp.evm
  );

  const jvmDappBtpAddress = getBtpAddress(
    JVM_NETWORK_LABEL,
    deployments.VotingDapp.jvm
  );

  // initialize JVM contract and test results
  const request1 = await initializeJvmContract(deployments.VotingDapp.jvm, {
    _sourceXCallContract: JVM_XCALL_ADDRESS,
    _destinationBtpAddress: evmDappBtpAddress
  });
  testResults.initializeJvmContract = isValidHexAddress(request1, "0x", 66);
  console.log(
    `> Test: invoking 'initialize' method on JVM contract: ${
      testResults.initializeJvmContract == true ? "SUCCESS" : "FAILURE"
    }`
  );
  const txResult1 = await getTxResult(request1);
  const initBlock = txResult1.blockHeight;
  // start monitor
  const monitor = new Monitor(JVM_SERVICE, JVM_XCALL_ADDRESS, initBlock);
  monitor.start();

  testResults.validateInitializeTxJvm = txResult1.status == 1;
  console.log(
    `> Test: validate tx for invoking 'initialize' method on JVM contract: ${
      testResults.validateInitializeTxJvm == true ? "SUCCESS" : "FAILURE"
    }`
  );

  // initialize EVM contract and test results
  const request2 = await initializeEvmContract(
    deployments.VotingDapp.evm,
    deployments.VotingDapp.evmAbi,
    EVM_XCALL_ADDRESS,
    20
  );
  testResults.initializeEvmContract = isValidHexAddress(
    request2.transactionHash,
    "0x",
    66
  );
  console.log(
    `> Test: invoking 'initialize' method on EVM contract: ${
      testResults.initializeEvmContract == true ? "SUCCESS" : "FAILURE"
    }`
  );

  // send a message to EVM dApp and test results
  const request3 = await invokeJvmDAppMethod(
    deployments.VotingDapp.jvm,
    "voteYes"
  );
  testResults.invokeVoteYesMethodOnJvm = isValidHexAddress(request3, "0x", 66);
  console.log(
    `> Test: invoking 'voteYes' method on JVM contract: ${
      testResults.invokeVoteYesMethodOnJvm == true ? "SUCCESS" : "FAILURE"
    }`
  );
  const txResult2 = await getTxResult(request3);
  console.log(
    `> Test: validate tx for invoking 'voteYes' method on JVM contract: ${
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
    deployments.VotingDapp.evm,
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

  // set rollbackData to any value to test ResponseMessage event
  const rollbackData = "";

  // If rollbackData fetch Response Message event.
  // if revert was raised on EVM chain, fetch rollbackMessage event from JVM contract
  if (rollbackData != null) {
    let currentBlockHeight = initBlock;
    const maxBlockHeight = initBlock + 1800;
    let responseMessageEventWasRaised = false;
    while (currentBlockHeight < maxBlockHeight) {
      console.log(
        "-- Waiting for event on JVM chain: block height: " + currentBlockHeight
      );
      currentBlockHeight = monitor.getCurrentBlockHeight();
      const events = monitor.getEvents();

      if (events.ResponseMessage.length > 0) {
        for (const event of events.ResponseMessage) {
          if (event.indexed[1] === parsedEventlog1._sn) {
            responseMessageEventWasRaised = true;
            break;
          }
        }
      }

      if (responseMessageEventWasRaised) {
        break;
      }

      await sleep(2000);
    }
    console.log(
      `> Test: filtering 'ResponseMessage' event on JVM contract: ${
        responseMessageEventWasRaised != null ? "SUCCESS" : "FAILURE"
      }`
    );
  }
  monitor.close();
}

module.exports = {
  votingDappE2E
};
