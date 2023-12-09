// Imports
import iconSdk from "icon-sdk-js";
import utilIndex from "../utils/index.mjs";
import Monitor from "../utils/monitor.mjs";
import CosmWasmMonitor from "../utils/cosmwasm-monitor.mjs";
import miscUtils from "./utils.mjs";
import ora from "ora";
import chalk from "chalk";
import process from "node:process";
import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { calculateFee, GasPrice } from "@cosmjs/stargate";

const { IconService } = iconSdk;
const { config, utils } = utilIndex;
const {
  encodeMessage,
  filterCallExecutedEventJvm,
  filterCallMessageSentEventJvm,
  filterRollbackExecutedEventJvm,
  getNetworkAddress,
  initializeJvmContract,
  invokeJvmContractMethod,
  invokeJvmDAppMethod,
  parseCallMessageEventJvm,
  parseCallMessageSentEventJvm,
  parseCallMessageEventCosmWasm
} = miscUtils;
const { originChain, destinationChain } = config;
const { getTxResult } = utils;

const { HttpProvider, IconWallet } = IconService;
const HTTP_PROVIDER_ORIGIN = new HttpProvider(originChain.jvm.rpc);
const JVM_SERVICE_ORIGIN = new IconService(HTTP_PROVIDER_ORIGIN);
const JVM_WALLET_ORIGIN = IconWallet.loadPrivateKey(originChain.jvm.privateKey);

async function helloWorldDemoJVMCOSMWASM(deployments) {
  const dappOriginContractAddress =
    deployments.HelloWorld[originChain.jvm.networkLabel].contract;
  const dappDestinationContractAddress =
    deployments.HelloWorld[destinationChain.cosmwasm.networkLabel].contract;

  const monitorOrigin = new Monitor(
    JVM_SERVICE_ORIGIN,
    originChain.jvm.xcallAddress,
    dappOriginContractAddress
  );

  const monitorDestination = new CosmWasmMonitor(
    destinationChain.cosmwasm.rpc,
    destinationChain.cosmwasm.xcallAddress
  );

  try {
    const COSMWASM_WALLET_DESTINATION = await DirectSecp256k1Wallet.fromKey(
      Buffer.from(destinationChain.cosmwasm.privateKey, "hex"),
      "archway"
    );
    const COSMWASM_SERVICE = await SigningCosmWasmClient.connectWithSigner(
      destinationChain.cosmwasm.rpc,
      COSMWASM_WALLET_DESTINATION
    );
    // print wallet addresses
    console.log(
      `> Wallet address on origin chain: ${JVM_WALLET_ORIGIN.getAddress()}`
    );
    console.log(
      `> Wallet address on destination chain: ${COSMWASM_WALLET_DESTINATION.address}\n`
    );

    // start monitoring events
    monitorOrigin.start();
    monitorDestination.start();

    // message to send
    let msgString = "hello world";
    const rollbackString = "use Rollback";
    const triggerErrorForRollback = true;

    // to trigger a rollback, the message must be "ExecuteRollback"
    // and in that case the `MessageReceived` event
    // will not be emmitted
    if (triggerErrorForRollback) {
      msgString = "ExecuteRollback";
    }

    // encode message
    const msg = encodeMessage(msgString);
    const rollback = encodeMessage(rollbackString);

    // get network addresses
    const originDappNetworkAddress = getNetworkAddress(
      originChain.jvm.networkLabel,
      dappOriginContractAddress
    );
    const destinationDappNetworkAddress = getNetworkAddress(
      destinationChain.cosmwasm.networkLabel,
      dappDestinationContractAddress
    );

    // params to destination
    const paramsToDestination = {
      payload: msg,
      rollback: rollback
    };

    // initialize contracts on origin chain
    const spinner = ora({
      text: `> Test: invoking 'initialize' method on origin contract:`,
      suffixText: `${chalk.yellow("Pending")}\n`,
      spinner: process.argv[2]
    }).start();

    const request1 = await initializeJvmContract(
      dappOriginContractAddress,
      {
        _sourceXCallContract: originChain.jvm.xcallAddress,
        _destinationAddress: destinationDappNetworkAddress
      },
      destinationChain.cosmwasm.networkLabel,
      true,
      originChain.jvm.xcallAddress,
      JVM_SERVICE_ORIGIN,
      JVM_WALLET_ORIGIN,
      originChain.jvm.nid
    );

    if (request1.txHash == null) {
      spinner.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Error: ${JSON.stringify(request1.error)}\n`);
      monitorOrigin.close();
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
      text: `> Test: validate tx for invoking 'initialize' method on origin contract (hash ${request1.txHash}): `,
      suffixText: `${chalk.yellow("Pending")}\n`,
      spinner: process.argv[2]
    }).start();

    const txResult1 = await getTxResult(
      request1.txHash,
      JVM_SERVICE_ORIGIN,
      spinner2
    );

    if (txResult1 == null || txResult1.status == 0) {
      spinner2.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Tx Result: ${JSON.stringify(txResult1)}\n`);
      spinner2.fail();
      monitorOrigin.close();
      return;
    }
    spinner2.succeed();

    // send a message to jvm dApp on destination chain
    // if msg is the string "executeRollback" a rollback
    // will be executed
    const spinner3 = ora({
      text: `> Test: invoking 'sendMessage' method on origin contract:`,
      suffixText: `${chalk.yellow("Pending")}\n`,
      spinner: process.argv[2]
    }).start();

    const request3 = await invokeJvmDAppMethod(
      dappOriginContractAddress,
      "sendMessage",
      paramsToDestination,
      true,
      destinationChain.cosmwasm.networkLabel
    );

    if (request3.txHash == null) {
      spinner3.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Error: ${JSON.stringify(request3.error)}\n`);
      monitorOrigin.close();
      spinner3.fail();
      return;
    }

    spinner3.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Tx data: ${JSON.stringify(request3.txObj)}\n`);
    spinner3.succeed();

    // fetch transaction result
    const spinner4 = ora({
      text: `> Test: validate tx for invoking 'sendMessage' method on origin contract (hash ${request3.txHash}): `,
      suffixText: `${chalk.yellow("Pending")}\n`,
      spinner: process.argv[2]
    }).start();

    const txResult3 = await getTxResult(
      request3.txHash,
      JVM_SERVICE_ORIGIN,
      spinner4
    );

    if (txResult3 == null || txResult3.status == 0) {
      spinner4.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Tx Result: ${JSON.stringify(txResult3)}\n`);
      spinner4.fail();
      monitorOrigin.close();
      return;
    }

    spinner4.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Tx Result: ${JSON.stringify(txResult3)}\n`);
    spinner4.succeed();

    // catch CallMessageSent event from JVM contract
    const spinner5 = ora({
      text: `> Test: catch CallMessageSent event from contract on origin chain:`,
      suffixText: `${chalk.yellow("Pending")}\n`,
      spinner: process.argv[2]
    }).start();

    const eventlog1 = filterCallMessageSentEventJvm(txResult3.eventLogs);
    if (eventlog1.length == 0) {
      spinner5.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Error: event not found\n`);
      spinner5.fail();
      monitorOrigin.close();
      return;
    }

    spinner5.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Event data: ${JSON.stringify(eventlog1)}\n`);
    spinner5.succeed();

    // catch CallMessage event on destination chain
    const parsedEventlog1 = parseCallMessageSentEventJvm(eventlog1);
    const snFromSource = parsedEventlog1._sn;
    console.log(`> Message sn: ${snFromSource}`);

    const spinner6 = ora({
      text: `> Test: catch CallMessage event from contract on destination chain:`,
      suffixText: `${chalk.yellow("Pending")}\n`,
      spinner: process.argv[2]
    }).start();

    spinner6.suffixText = `${chalk.yellow("Pending")}. sn: ${snFromSource}\n`;

    // wait for monitor to fetch event
    await monitorDestination.waitForEvents(
      "CallMessage",
      snFromSource,
      spinner6
    );

    const callMessageEvents = monitorDestination.events.CallMessage.filter(
      event => {
        // event => event.indexed[3] === snFromSource
        for (const attrib of event.attributes) {
          if (attrib.key === "sn") {
            return parseInt(attrib.value) === parseInt(snFromSource, 16);
          }
        }
      }
    );

    if (callMessageEvents.length == 0) {
      spinner6.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Error: event not found\n`);
      spinner6.fail();
      monitorOrigin.close();
      monitorDestination.close();
      return;
    }

    spinner6.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Event data: ${JSON.stringify(callMessageEvents)}\n`);
    spinner6.succeed();

    // parse CallMessage event
    const spinner7 = ora({
      text: `> Test: parse CallMessage event from contract on destination chain:`,
      suffixText: `${chalk.yellow("Pending")}\n`,
      spinner: process.argv[2]
    }).start();

    const parsedEventlog2 = parseCallMessageEventCosmWasm(callMessageEvents);

    spinner7.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Event data: ${JSON.stringify(parsedEventlog2)}\n`);
    spinner7.succeed();
    monitorOrigin.close();
    monitorDestination.close();
    throw new Error("test");

    // // invoke executeCall on destination chain
    // const spinner10 = ora({
    //   text: `> Test: invoking 'executeCall' method on destination contract:`,
    //   suffixText: `${chalk.yellow("Pending")}\n`,
    //   spinner: process.argv[2]
    // }).start();

    // const request4 = await invokeJvmContractMethod(
    //   "executeCall",
    //   destinationChain.jvm.xcallAddress,
    //   JVM_WALLET_DESTINATION,
    //   destinationChain.jvm.nid,
    //   JVM_SERVICE_DESTINATION,
    //   {
    //     _reqId: parsedEventlog2._nsn,
    //     _data: parsedEventlog2._data
    //   },
    //   false
    // );

    // if (request4.txHash == null) {
    //   spinner10.suffixText =
    //     chalk.red("FAILURE") +
    //     ".\n" +
    //     chalk.dim(`   -- Error: ${JSON.stringify(request4.error)}\n`);
    //   monitorOrigin.close();
    //   monitorDestination.close();
    //   return;
    // }

    // spinner10.suffixText =
    //   chalk.green("SUCCESS") +
    //   ".\n" +
    //   chalk.dim(`   -- Tx data: ${JSON.stringify(request4.txObj)}\n`);
    // spinner10.succeed();

    // // validate transaction for executeCall
    // const spinner11 = ora({
    //   text: `> Test: validate tx for invoking 'executeCall' method on destination contract (hash ${request4.txHash}): `,
    //   suffixText: `${chalk.yellow("Pending")}\n`,
    //   spinner: process.argv[2]
    // }).start();

    // const txResult4 = await getTxResult(
    //   request4.txHash,
    //   JVM_SERVICE_DESTINATION,
    //   spinner11
    // );

    // if (txResult4 == null || txResult4.status == 0) {
    //   spinner11.suffixText =
    //     chalk.red("FAILURE") +
    //     ".\n" +
    //     chalk.dim(`   -- Tx Result: ${JSON.stringify(txResult4)}\n`);
    //   spinner11.fail();
    //   monitorOrigin.close();
    //   monitorDestination.close();
    //   return;
    // }

    // spinner11.suffixText =
    //   chalk.green("SUCCESS") +
    //   ".\n" +
    //   chalk.dim(`   -- Tx Result: ${JSON.stringify(txResult4)}\n`);
    // spinner11.succeed();

    // // catch CallExecuted event from destination chain
    // const spinner12 = ora({
    //   text: `> Test: catch CallExecuted event from contract on destination chain:`,
    //   suffixText: `${chalk.yellow("Pending")}\n`,
    //   spinner: process.argv[2]
    // }).start();

    // const eventlog2 = filterCallExecutedEventJvm(
    //   txResult4.eventLogs,
    //   destinationChain.jvm.xcallAddress
    // );

    // if (eventlog2.length == 0) {
    //   spinner12.suffixText =
    //     chalk.red("FAILURE") +
    //     ".\n" +
    //     chalk.dim(`   -- Error: event not found\n`);
    //   spinner12.fail();
    //   monitorOrigin.close();
    //   monitorDestination.close();
    //   return;
    // }

    // spinner12.suffixText =
    //   chalk.green("SUCCESS") +
    //   ".\n" +
    //   chalk.dim(`   -- Event data: ${JSON.stringify(eventlog2)}\n`);
    // spinner12.succeed();

    // // if rollback is true, invoke rollback on source chain
    // // const msg = encodeMessage(msgString);
    // // const rollback = encodeMessage(rollbackString);
    // if (rollback != null) {
    //   // if message sent is string literal "ExecuteRollback" then
    //   // RollbackMessage will be raised along with ResponseMessage event

    //   const initBlock = monitorOrigin.currentBlockHeight;
    //   const maxBlock = initBlock + 700;
    //   console.log(
    //     `> sn (id that identifies the event we are waiting for): ${snFromSource}`
    //   );
    //   console.log(
    //     "> maxBlock (after reaching this block height the loop will be stopped and the event fetch will fail):",
    //     maxBlock
    //   );

    //   const spinner13 = ora({
    //     text: `> Test: catch ResponseMessage event from contract on source chain:`,
    //     suffixText: `${chalk.yellow("Pending")}\n`,
    //     spinner: process.argv[2]
    //   }).start();

    //   await monitorOrigin.waitForEvents(
    //     "ResponseMessage",
    //     snFromSource,
    //     spinner13,
    //     maxBlock
    //   );

    //   const responseMsgEvents = monitorOrigin.events.ResponseMessage.filter(
    //     event => event.indexed[1] == snFromSource
    //   );

    //   if (responseMsgEvents.length == 0) {
    //     spinner13.suffixText =
    //       chalk.red("FAILURE") +
    //       ".\n" +
    //       chalk.dim(`   -- Error: event not found\n`);
    //     spinner13.fail();
    //     monitorOrigin.close();
    //     monitorDestination.close();
    //     return;
    //   }

    //   spinner13.suffixText =
    //     chalk.green("SUCCESS") +
    //     ".\n" +
    //     chalk.dim(`   -- Event data: ${JSON.stringify(responseMsgEvents)}\n`);
    //   spinner13.succeed();

    //   // wait for RollbackMessage event
    //   const spinner14 = ora({
    //     text: `> Test: catch RollbackMessage event from contract on source chain:`,
    //     suffixText: `${chalk.yellow("Pending")}\n`,
    //     spinner: process.argv[2]
    //   }).start();

    //   if (msg !== encodeMessage("executeRollback")) {
    //     spinner14.suffixText =
    //       chalk.red("FAILURE") +
    //       ".\n" +
    //       chalk.dim(`   -- Rollback will not be raised\n`);
    //     spinner14.fail();
    //     monitorOrigin.close();
    //     monitorDestination.close();
    //     return;
    //   } else {
    //     await monitorOrigin.waitForEvents(
    //       "RollbackMessage",
    //       snFromSource,
    //       spinner14,
    //       maxBlock
    //     );

    //     const rollbackMsgEvents = monitorOrigin.events.RollbackMessage.filter(
    //       event => event.indexed[1] == snFromSource
    //     );

    //     if (rollbackMsgEvents.length == 0) {
    //       spinner14.suffixText =
    //         chalk.red("FAILURE") +
    //         ".\n" +
    //         chalk.dim(`   -- Error: event not found\n`);
    //       spinner14.fail();
    //       monitorOrigin.close();
    //       monitorDestination.close();
    //       return;
    //     }

    //     spinner14.suffixText =
    //       chalk.green("SUCCESS") +
    //       ".\n" +
    //       chalk.dim(`   -- Event data: ${JSON.stringify(rollbackMsgEvents)}\n`);
    //     spinner14.succeed();

    //     // execute rollback
    //     const spinner15 = ora({
    //       text: `> Test: execute rollback on source chain:`,
    //       suffixText: `${chalk.yellow("Pending")}\n`,
    //       spinner: process.argv[2]
    //     }).start();

    //     const request5 = await invokeJvmContractMethod(
    //       "executeRollback",
    //       originChain.jvm.xcallAddress,
    //       JVM_WALLET_ORIGIN,
    //       originChain.jvm.nid,
    //       JVM_SERVICE_ORIGIN,
    //       {
    //         _sn: snFromSource
    //       }
    //     );

    //     if (request5.txHash == null) {
    //       spinner15.suffixText =
    //         chalk.red("FAILURE") +
    //         ".\n" +
    //         chalk.dim(`   -- Error: ${JSON.stringify(request5.error)}\n`);
    //       spinner15.fail();
    //       monitorOrigin.close();
    //       monitorDestination.close();
    //       return;
    //     }

    //     spinner15.suffixText =
    //       chalk.green("SUCCESS") +
    //       ".\n" +
    //       chalk.dim(`   -- TxHash: ${request5.txHash}\n`);
    //     spinner15.succeed();

    //     // verify transaction
    //     const spinner16 = ora({
    //       text: `> Test: verify transaction on source chain:`,
    //       suffixText: `${chalk.yellow("Pending")}\n`,
    //       spinner: process.argv[2]
    //     }).start();

    //     const txResult5 = await getTxResult(
    //       request5.txHash,
    //       JVM_SERVICE_ORIGIN,
    //       spinner16
    //     );

    //     if (txResult5 == null || txResult5.status == 0) {
    //       spinner16.suffixText =
    //         chalk.red("FAILURE") +
    //         ".\n" +
    //         chalk.dim(`   -- Error: ${JSON.stringify(txResult5)}\n`);
    //       spinner16.fail();
    //       monitorOrigin.close();
    //       monitorDestination.close();
    //       return;
    //     }

    //     spinner16.suffixText =
    //       chalk.green("SUCCESS") +
    //       ".\n" +
    //       chalk.dim(`   -- TxResult: ${JSON.stringify(txResult5)}\n`);
    //     spinner16.succeed();

    //     // catch RollbackExecuted event
    //     const spinner17 = ora({
    //       text: `> Test: catch RollbackExecuted event from contract on source chain:`,
    //       suffixText: `${chalk.yellow("Pending")}\n`,
    //       spinner: process.argv[2]
    //     }).start();

    //     const eventlog5 = filterRollbackExecutedEventJvm(txResult5.eventLogs);
    //     if (eventlog5.length == 0) {
    //       spinner17.suffixText =
    //         chalk.red("FAILURE") +
    //         ".\n" +
    //         chalk.dim(`   -- Error: event not found\n`);
    //       spinner17.fail();
    //       monitorOrigin.close();
    //       monitorDestination.close();
    //       return;
    //     }

    //     spinner17.suffixText =
    //       chalk.green("SUCCESS") +
    //       ".\n" +
    //       chalk.dim(`   -- Event data: ${JSON.stringify(eventlog5)}\n`);
    //     spinner17.succeed();
    //   }
    //   console.log("> stopping block monitors on both chains");
    //   monitorOrigin.close();
    //   monitorDestination.close();
    // }
  } catch (err) {
    console.log("Error in helloWorldDemoJVMCOSMWASM: ", err);
    monitorOrigin.close();
  }
}

export default helloWorldDemoJVMCOSMWASM;
