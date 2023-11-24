import utilIndex from "../utils/index.mjs";
const { config, utils } = utilIndex;
import iconSdk from "icon-sdk-js";
const { IconService } = iconSdk;
import { Web3 } from "web3";
import Monitor from "../utils/monitor.mjs";
import ora from "ora";
import chalk from "chalk";
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
  waitCallExecutedEventEvm,
  parseEvmEventsFromBlock
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

async function helloWorldDemo(deployments) {
  // start monitor
  const monitor = new Monitor(
    JVM_SERVICE,
    JVM_XCALL_ADDRESS,
    deployments.HelloWorld.jvm
  );
  monitor.start();

  try {
    console.log(`> Wallet address on origin chain: ${JVM_WALLET.getAddress()}`);
    console.log(
      `> Wallet address on destination chain: ${EVM_WALLET_WEB3.address}\n`
    );
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
    const spinner = ora({
      text: `> Test: invoking 'initialize' method on JVM contract:`,
      suffixText: `${chalk.yellow("Pending")}`,
      spinner: process.argv[2]
    }).start();

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

    if (request1.txHash == null) {
      spinner.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Error: ${JSON.stringify(request1.error)}\n`);
      monitor.close();
      spinner.fail();
      return;
    }
    spinner.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Tx data: ${JSON.stringify(request1.txObj)}\n`);
    spinner.succeed();

    // fetch transaction result
    const spinner2 = ora({
      text: `> Test: validate tx for invoking 'initialize' method on JVM contract: `,
      suffixText: `${chalk.yellow("Pending")}.`,
      spinner: process.argv[2]
    }).start();

    const txResult1 = await getTxResult(request1.txHash);

    if (txResult1 == null || txResult1.status == 0) {
      spinner2.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- tx Result: ${JSON.stringify(txResult1)}\n`);
      spinner2.fail();
      monitor.close();
      return;
    }
    spinner2.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Tx result: ${JSON.stringify(txResult1)}\n`);
    spinner2.succeed();

    // initialize EVM contract and test results
    const spinner3 = ora({
      text: `> Test: invoking 'initialize' method on EVM contract: `,
      suffixText: `${chalk.yellow("Pending")}.`,
      spinner: process.argv[2]
    }).start();

    const request2 = await initializeEvmContract(
      deployments.HelloWorld.evm,
      deployments.HelloWorld.evmAbi,
      EVM_XCALL_ADDRESS,
      jvmDappNetworkAddress
    );

    if (request2.txHash == null) {
      spinner3.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Tx result: ${JSON.stringify(request2)}\n`);
      spinner3.fail();
      monitor.close();
      return;
    }
    spinner3.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Tx result: ${JSON.stringify(request2)}\n`);
    spinner3.succeed();

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

    const spinner4 = ora({
      text: `> Test: invoking 'sendMessage' method on JVM contract: `,
      suffixText: `${chalk.yellow("Pending")}.`,
      spinner: process.argv[2]
    }).start();

    const request3 = await invokeJvmDAppMethod(
      deployments.HelloWorld.jvm,
      "sendMessage",
      requestParams
    );
    if (request3.txHash == null) {
      spinner4.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Error: ${JSON.stringify(request3.error)}\n`);
      monitor.close();
      spinner4.fail();
      return;
    }
    spinner4.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Tx data: ${JSON.stringify(request3.txObj)}\n`);
    spinner4.succeed();

    const spinner5 = ora({
      text: `> Test: validate tx for invoking 'sendMessage' method on JVM contract: `,
      suffixText: `${chalk.yellow("Pending")}.`,
      spinner: process.argv[2]
    }).start();

    const txResult2 = await getTxResult(request3.txHash);

    if (txResult2 == null || txResult2.status == 0) {
      spinner5.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Tx result: ${JSON.stringify(txResult2)}\n`);
      spinner5.fail();
      monitor.close();
      return;
    }
    spinner5.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Tx result: ${JSON.stringify(txResult2)}\n`);
    spinner5.succeed();

    // catch CallMessageSent event from JVM contract and test result
    const spinner6 = ora({
      text: `> Test: filtering 'CallMessageSent' event on JVM contract: `,
      suffixText: `${chalk.yellow("Pending")}.`,
      spinner: process.argv[2]
    }).start();

    const eventlog1 = filterCallMessageSentEventJvm(txResult2.eventLogs);
    if (eventlog1.length == 0) {
      spinner6.suffixText = chalk.red("FAILURE") + ".\n";
      spinner6.fail();
      monitor.close();
      return;
    }
    spinner6.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Event: ${JSON.stringify(eventlog1)}\n`);
    spinner6.succeed();

    // filter CallMessage event from EVM dApp and test result
    const spinner7 = ora({
      text: `> Test: filtering 'CallMessage' event on EVM contract: `,
      suffixText: `${chalk.yellow("Pending")}.`,
      spinner: process.argv[2]
    }).start();

    const parsedEventlog1 = parseCallMessageSentEventJvm(eventlog1);
    const eventlog2 = filterCallMessageEventEvm(
      jvmDappNetworkAddress,
      deployments.HelloWorld.evm,
      parsedEventlog1._sn
    );
    if (eventlog2 == null) {
      spinner7.suffixText = chalk.red("FAILURE") + ".\n";
      spinner7.fail();
      monitor.close();
      return;
    }
    spinner7.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Event: ${JSON.stringify(eventlog2)}\n`);
    spinner7.succeed();

    // wait for CallMessage event to be raised on EVM dApp and test result
    const spinner8 = ora({
      text: `> Test: Wait for 'CallMessage' event to be raised on EVM contract: `,
      suffixText: `${chalk.yellow("Pending")}.`,
      spinner: process.argv[2]
    }).start();

    const event2 = await waitCallMessageEventEvm(eventlog2, spinner8);
    if (event2 == null) {
      spinner8.suffixText =
        chalk.red(
          "FAILURE. Critical error, 'waitCallMessageEventEvm' returned 'null'"
        ) + ".\n";
      spinner8.fail();
      monitor.close();
      return;
    }
    const reqId = event2[0].args._reqId;
    const data = event2[0].args._data;
    if (reqId == null || data == null) {
      spinner8.suffixText = chalk.red("FAILURE") + ".\n";
      spinner8.fail();
      monitor.close();
      return;
    }
    spinner8.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Event: ${JSON.stringify(event2[0])}\n`);
    spinner8.succeed();

    // invoke executeCall on EVM chain and test result
    const spinner9 = ora({
      text: `> Test: invoking 'executeCall' method on EVM contract: `,
      suffixText: `${chalk.yellow("Pending")}.`,
      spinner: process.argv[2]
    }).start();
    const request4 = await executeCallEvm(reqId, data);
    if (request4.txHash == null) {
      spinner9.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Tx result: ${JSON.stringify(request4)}\n`);
      spinner9.fail();
      monitor.close();
      return;
    }
    spinner9.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Tx result: ${JSON.stringify(request4)}\n`);
    spinner9.succeed();

    // catch CallExecuted event from EVM dApp and test result
    const spinner10 = ora({
      text: `> Test: filtering 'CallExecuted' event on EVM contract: `,
      suffixText: `${chalk.yellow("Pending")}.`,
      spinner: process.argv[2]
    }).start();

    const eventlog3 = filterCallExecutedEventEvm(reqId);
    if (eventlog3 == null) {
      spinner10.suffixText = chalk.red("FAILURE") + ".\n";
      spinner10.fail();
      monitor.close();
      return;
    }
    spinner10.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Event: ${JSON.stringify(eventlog3)}\n`);
    spinner10.succeed();

    // wait for CallExecuted event to be raised on EVM dApp and test result
    const spinner11 = ora({
      text: `> Test: Wait for 'CallExecuted' event to be raised on EVM contract: `,
      suffixText: `${chalk.yellow("Pending")}.`,
      spinner: process.argv[2]
    }).start();
    const event3 = await waitCallExecutedEventEvm(eventlog3, spinner11);
    if (event3.length == 0) {
      spinner11.suffixText = chalk.red("FAILURE") + ".\n";
      spinner11.fail();
      monitor.close();
      return;
    }
    spinner11.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Event: ${JSON.stringify(event3)}\n`);
    spinner11.succeed();

    // If rollbackData fetch Response Message event.
    // if revert was raised on EVM chain, fetch rollbackMessage event from JVM contract
    if (rollbackData != null) {
      console.log("> sn: ", parsedEventlog1._sn);
      const spinner12 = ora({
        text: `> Test: Wait for 'ResponseMessage' event to be raised on JVM contract: `,
        suffixText: `${chalk.yellow("Pending")}.`,
        prefixText: `${chalk.black.bgCyan(
          "[due to block finality on sepolia this event might take up to 20 minutes to be raised]"
        )}`,
        spinner: process.argv[2]
      }).start();

      // TODO from here
      // throw new Error("stop");
      // monitor.spinnerStart();
      await monitor.waitForEvents(
        "ResponseMessage",
        parsedEventlog1._sn,
        spinner12
      );
      const responseMsgEvents = monitor.events.ResponseMessage;
      if (responseMsgEvents == null) {
        spinner12.suffixText = chalk.red("FAILURE") + ".\n";
        spinner12.fail();
        monitor.close();
        return;
      }
      spinner12.suffixText =
        chalk.green("SUCCESS") +
        ".\n" +
        chalk.dim(`   -- Event: ${JSON.stringify(responseMsgEvents)}\n`);
      spinner12.succeed();
    }
    // stop monitor
    monitor.close();
  } catch (err) {
    console.log("Error in helloWorldDemo: ", err);
    monitor.close();
  }
}

export default helloWorldDemo;
