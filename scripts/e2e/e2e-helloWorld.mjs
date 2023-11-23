import utilIndex from "../utils/index.mjs";
const { config, utils } = utilIndex;
import iconSdk from "icon-sdk-js";
const { IconService } = iconSdk;
import { Web3 } from "web3";
import Monitor from "../utils/monitor.mjs";
import ora from "ora";
import process from "node:process";
import miscUtils from "./utils.mjs";
const {
  initializeJvmContract,
  initializeEvmContract,
  getNetworkAddress,
  invokeJvmDAppMethod,
  // decodeMessage,
  encodeMessage,
  filterCallMessageSentEventJvm,
  parseCallMessageSentEventJvm,
  filterCallMessageEventEvm,
  waitCallMessageEventEvm,
  executeCallEvm,
  filterCallExecutedEventEvm,
  waitCallExecutedEventEvm
  // waitResponseMessageEventJvm
  // waitRollbackExecutedEventJvm
} = miscUtils;

const {
  JVM_XCALL_ADDRESS,
  EVM_XCALL_ADDRESS,
  EVM_NETWORK_LABEL,
  JVM_NETWORK_LABEL,
  JVM_RPC,
  EVM_RPC,
  JVM_PRIVATE_KEY,
  EVM_PRIVATE_KEY,
  JVM_NID
} = config;

const { getTxResult, isValidHexAddress, sleep } = utils;
const { HttpProvider, IconWallet } = IconService;

const HTTP_PROVIDER = new HttpProvider(JVM_RPC);
const JVM_SERVICE = new IconService(HTTP_PROVIDER);
const JVM_WALLET = IconWallet.loadPrivateKey(JVM_PRIVATE_KEY);

const EVM_SERVICE_WEB3 = new Web3(EVM_RPC);
const EVM_WALLET_WEB3 = EVM_SERVICE_WEB3.eth.accounts.privateKeyToAccount(
  EVM_PRIVATE_KEY,
  true
);
EVM_SERVICE_WEB3.eth.accounts.wallet.add(EVM_WALLET_WEB3);

async function helloWorldE2E(deployments) {
  // start monitor
  const monitor = new Monitor(
    JVM_SERVICE,
    JVM_XCALL_ADDRESS,
    deployments.HelloWorld.jvm
  );
  monitor.start();
  const spinner = ora({
    text: "",
    spinner: process.argv[2]
  });

  try {
    console.log(`> Wallet address on origin chain: ${JVM_WALLET.getAddress()}`);
    console.log(
      `> Wallet address on destination chain: ${EVM_WALLET_WEB3.address}`
    );
    spinner.text =
      "> Test: invoking 'initialize' method on JVM contract: Pending";
    spinner.start();
    // get Network addresses
    const evmDappNetworkAddress = getNetworkAddress(
      EVM_NETWORK_LABEL,
      deployments.HelloWorld.evm
    );

    const jvmDappNetworkAddress = getNetworkAddress(
      JVM_NETWORK_LABEL,
      deployments.HelloWorld.jvm
    );

    // initialize JVM contract and test results
    const request1 = await initializeJvmContract(
      deployments.HelloWorld.jvm,
      {
        _sourceXCallContract: JVM_XCALL_ADDRESS,
        _destinationAddress: evmDappNetworkAddress
      },
      EVM_NETWORK_LABEL,
      true,
      JVM_XCALL_ADDRESS,
      JVM_SERVICE,
      JVM_WALLET,
      JVM_NID
    );
    spinner.text = `> Test: invoking 'initialize' method on JVM contract: ${
      isValidHexAddress(request1, "0x", 66) == true ? "SUCCESS" : "FAILURE"
    }`;
    spinner.succeed();
    const txResult1 = await getTxResult(request1);

    console.log(
      `> Test: validate tx for invoking 'initialize' method on JVM contract: ${
        txResult1.status == 1 ? "SUCCESS" : "FAILURE"
      }`
    );
    if (txResult1.status == 0) {
      console.log(txResult1);
      monitor.close();
      return;
    }

    // initialize EVM contract and test results
    const request2 = await initializeEvmContract(
      deployments.HelloWorld.evm,
      deployments.HelloWorld.evmAbi,
      EVM_XCALL_ADDRESS,
      jvmDappNetworkAddress
    );
    console.log(
      `> Test: invoking 'initialize' method on EVM contract: ${
        isValidHexAddress(request2.transactionHash, "0x", 66) == true
          ? "SUCCESS"
          : "FAILURE"
      }`
    );
    if (isValidHexAddress(request2.transactionHash, "0x", 66) == false) {
      console.log(request2);
      monitor.close();
      return;
    }

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
    if (isValidHexAddress(request3, "0x", 66) == false) {
      console.log(request3);
      monitor.close();
      return;
    }

    const txResult2 = await getTxResult(request3);
    console.log(txResult2);
    console.log(
      `> Test: validate tx for invoking 'sendMessage' method on JVM contract: ${
        txResult2.status == 1 ? "SUCCESS" : "FAILURE"
      }`
    );
    if (txResult2.status == 0) {
      console.log(txResult2);
      monitor.close();
      return;
    }

    // catch CallMessageSent event from JVM contract and test result
    const eventlog1 = filterCallMessageSentEventJvm(txResult2.eventLogs);
    console.log(
      `> Test: filtering 'CallMessageSent' event on JVM contract: ${
        eventlog1.length > 0 ? "SUCCESS" : "FAILURE"
      }`
    );
    if (eventlog1.length == 0) {
      console.log(txResult2.eventLogs);
      monitor.close();
      return;
    }

    // filter CallMessage event from EVM dApp and test result
    const parsedEventlog1 = parseCallMessageSentEventJvm(eventlog1);
    const eventlog2 = filterCallMessageEventEvm(
      jvmDappNetworkAddress,
      deployments.HelloWorld.evm,
      parsedEventlog1._sn
    );
    console.log(
      `> Test: filtering 'CallMessage' event on EVM contract: ${
        eventlog2 != null ? "SUCCESS" : "FAILURE"
      }`
    );
    if (eventlog2 == null) {
      console.log(txResult2.eventLogs);
      monitor.close();
      return;
    }

    // wait for CallMessage event to be raised on EVM dApp and test result
    const event2 = await waitCallMessageEventEvm(eventlog2);
    const reqId = event2[0].args._reqId;
    const data = event2[0].args._data;
    console.log(
      `> Test: Wait for 'CallMessage' event to be raised on EVM contract: ${
        reqId != null && data != null ? "SUCCESS" : "FAILURE"
      }`
    );
    if (reqId == null || data == null) {
      console.log(event2);
      monitor.close();
      return;
    }

    // invoke executeCall on EVM chain and test result
    const request4 = await executeCallEvm(reqId, data);

    console.log(
      `> Test: invoking 'executeCall' method on EVM contract: ${
        isValidHexAddress(request4.transactionHash, "0x", 66) == true
          ? "SUCCESS"
          : "FAILURE"
      }`
    );
    if (isValidHexAddress(request4.transactionHash, "0x", 66) == false) {
      console.log(request4);
      monitor.close();
      return;
    }

    // catch CallExecuted event from EVM dApp and test result
    const eventlog3 = filterCallExecutedEventEvm(reqId);
    console.log(
      `> Test: filtering 'CallExecuted' event on EVM contract: ${
        eventlog3 != null ? "SUCCESS" : "FAILURE"
      }`
    );
    console.log(eventlog3);
    if (eventlog3 == null) {
      console.log(eventlog2);
      monitor.close();
      return;
    }

    // wait for CallExecuted event to be raised on EVM dApp and test result
    const event3 = await waitCallExecutedEventEvm(eventlog3);
    console.log(
      `> Test: Wait for 'CallExecuted' event to be raised on EVM contract: ${
        event3.length > 0 ? "SUCCESS" : "FAILURE"
      }`
    );
    if (event3.length == 0) {
      console.log(event3);
      monitor.close();
      return;
    }

    // If rollbackData fetch Response Message event.
    // if revert was raised on EVM chain, fetch rollbackMessage event from JVM contract
    if (rollbackData != null) {
      console.log("sn: ", parsedEventlog1._sn);
      monitor.spinnerStart();
      await monitor.waitForEvents("ResponseMessage", parsedEventlog1._sn);
      const responseMsgEvents = monitor.events.ResponseMessage;
      console.log(
        `> Test: filtering 'ResponseMessage' event on JVM contract: ${
          responseMsgEvents != null ? "SUCCESS" : "FAILURE"
        }`
      );
    }
    // stop monitor
    monitor.close();
  } catch (err) {
    console.log(err);
    monitor.close();
  }
}

export default helloWorldE2E;
