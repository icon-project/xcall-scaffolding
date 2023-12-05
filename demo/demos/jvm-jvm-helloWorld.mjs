// Imports
import iconSdk from "icon-sdk-js";
import utilIndex from "../utils/index.mjs";
import Monitor from "../utils/monitor.mjs";
import miscUtils from "./utils.mjs";
import ora from "ora";
import chalk from "chalk";
import process from "node:process";

const { IconService } = iconSdk;
const { config, utils } = utilIndex;
const {
  encodeMessage,
  filterCallMessageSentEventJvm,
  parseCallMessageSentEventJvm,
  getNetworkAddress,
  initializeJvmContract,
  invokeJvmDAppMethod
} = miscUtils;
const { originChain, destinationChain } = config;
const { getTxResult } = utils;

const { HttpProvider, IconWallet } = IconService;
const HTTP_PROVIDER_ORIGIN = new HttpProvider(originChain.jvm.rpc);
const HTTP_PROVIDER_DESTINATION = new HttpProvider(destinationChain.jvm.rpc);
const JVM_SERVICE_ORIGIN = new IconService(HTTP_PROVIDER_ORIGIN);
const JVM_SERVICE_DESTINATION = new IconService(HTTP_PROVIDER_DESTINATION);
const JVM_WALLET_ORIGIN = IconWallet.loadPrivateKey(originChain.jvm.privateKey);
const JVM_WALLET_DESTINATION = IconWallet.loadPrivateKey(
  destinationChain.jvm.privateKey
);

// const {
//   rpc,
//   contract,
//   nid,
//   network,
//   PK_HAVAH,
//   PK_ICON,
//   dappSimple
// } = require("../utils/config");

//const {
//  //
//  getTxResult,
//  parseCallMessageEvent,
//  callDappContractMethod,
//  filterCallExecutedEvent
//} = require("../utils/lib");

async function helloWorldDemoJVMJVM(deployments) {
  const dappOriginContractAddress =
    deployments.HelloWorld[originChain.jvm.networkLabel].contract;
  const dappDestinationContractAddress =
    deployments.HelloWorld[destinationChain.jvm.networkLabel].contract;

  const monitorOrigin = new Monitor(
    JVM_SERVICE_ORIGIN,
    originChain.jvm.xcallAddress,
    dappOriginContractAddress
  );
  const monitorDestination = new Monitor(
    JVM_SERVICE_DESTINATION,
    destinationChain.jvm.xcallAddress,
    dappDestinationContractAddress
  );
  try {
    // print wallet addresses
    console.log(
      `> Wallet address on origin chain: ${JVM_WALLET_ORIGIN.getAddress()}`
    );
    console.log(
      `> Wallet address on destination chain: ${JVM_WALLET_DESTINATION.getAddress()}\n`
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
      destinationChain.jvm.networkLabel,
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
      destinationChain.jvm.networkLabel,
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
      monitorDestination.close();
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
      monitorDestination.close();
      return;
    }

    spinner2.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Tx Result: ${JSON.stringify(txResult1)}\n`);
    spinner2.succeed();

    // initialize contracts on destination chain
    const spinner3 = ora({
      text: `> Test: invoking 'initialize' method on destination contract:`,
      suffixText: `${chalk.yellow("Pending")}\n`,
      spinner: process.argv[2]
    }).start();

    const request2 = await initializeJvmContract(
      dappDestinationContractAddress,
      {
        _sourceXCallContract: destinationChain.jvm.xcallAddress,
        _destinationAddress: originDappNetworkAddress
      },
      originChain.jvm.networkLabel,
      true,
      destinationChain.jvm.xcallAddress,
      JVM_SERVICE_DESTINATION,
      JVM_WALLET_DESTINATION,
      destinationChain.jvm.nid
    );

    if (request2.txHash == null) {
      spinner3.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Error: ${JSON.stringify(request2.error)}\n`);
      monitorOrigin.close();
      monitorDestination.close();
      return;
    }

    spinner3.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Tx data: ${JSON.stringify(request2.txObj)}\n`);
    spinner3.succeed();

    // fetch transaction result
    const spinner4 = ora({
      text: `> Test: validate tx for invoking 'initialize' method on destination contract (hash ${request2.txHash}): `,
      suffixText: `${chalk.yellow("Pending")}\n`,
      spinner: process.argv[2]
    }).start();

    const txResult2 = await getTxResult(
      request2.txHash,
      JVM_SERVICE_DESTINATION,
      spinner4
    );

    if (txResult2 == null || txResult2.status == 0) {
      spinner4.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Tx Result: ${JSON.stringify(txResult2)}\n`);
      spinner4.fail();
      monitorOrigin.close();
      monitorDestination.close();
      return;
    }

    spinner4.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Tx Result: ${JSON.stringify(txResult2)}\n`);
    spinner4.succeed();

    // send a message to jvm dApp on destination chain
    // if msg is the string "executeRollback" a rollback
    // will be executed
    const spinner5 = ora({
      text: `> Test: invoking 'sendMessage' method on origin contract:`,
      suffixText: `${chalk.yellow("Pending")}\n`,
      spinner: process.argv[2]
    }).start();

    const request3 = await invokeJvmDAppMethod(
      dappOriginContractAddress,
      "sendMessage",
      paramsToDestination
    );

    if (request3.txHash == null) {
      spinner5.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Error: ${JSON.stringify(request3.error)}\n`);
      monitorOrigin.close();
      monitorDestination.close();
      return;
    }

    spinner5.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Tx data: ${JSON.stringify(request3.txObj)}\n`);
    spinner5.succeed();

    // fetch transaction result
    const spinner6 = ora({
      text: `> Test: validate tx for invoking 'sendMessage' method on origin contract (hash ${request3.txHash}): `,
      suffixText: `${chalk.yellow("Pending")}\n`,
      spinner: process.argv[2]
    }).start();

    const txResult3 = await getTxResult(
      request3.txHash,
      JVM_SERVICE_ORIGIN,
      spinner6
    );

    if (txResult3 == null || txResult3.status == 0) {
      spinner6.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Tx Result: ${JSON.stringify(txResult3)}\n`);
      spinner6.fail();
      monitorOrigin.close();
      monitorDestination.close();
      return;
    }

    spinner6.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Tx Result: ${JSON.stringify(txResult3)}\n`);
    spinner6.succeed();

    // catch CallMessageSent event from JVM contract
    const spinner7 = ora({
      text: `> Test: catch CallMessageSent event from contract on origin chain:`,
      suffixText: `${chalk.yellow("Pending")}\n`,
      spinner: process.argv[2]
    }).start();

    const eventlog1 = filterCallMessageSentEventJvm(txResult3.eventLogs);
    if (eventlog1.length == 0) {
      spinner7.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Error: event not found\n`);
      spinner7.fail();
      monitorOrigin.close();
      monitorDestination.close();
      return;
    }

    spinner7.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Event data: ${JSON.stringify(eventlog1)}\n`);
    spinner7.succeed();

    // catch CallMessage event on destination chain
    const parsedEventlog1 = parseCallMessageSentEventJvm(eventlog1);
    const snFromSource = parsedEventlog1._sn;
    console.log(`> Message sn: ${snFromSource}`);
    const spinner8 = ora({
      text: `> Test: catch CallMessage event from contract on destination chain:`,
      suffixText: `${chalk.yellow("Pending")}\n`,
      spinner: process.argv[2]
    }).start();

    spinner8.suffixText = `${chalk.yellow("Pending")}. sn: ${snFromSource}\n`;

    // wait for monitor to fetch event
    await monitorDestination.waitForEvents(
      "CallMessage",
      snFromSource,
      spinner8
    );

    const callMessageEvents = monitorDestination.events.CallMessage.filter(
      event => event.indexed[3] === snFromSource
    );

    if (callMessageEvents.length == 0) {
      spinner8.suffixText =
        chalk.red("FAILURE") +
        ".\n" +
        chalk.dim(`   -- Error: event not found\n`);
      spinner8.fail();
      monitorOrigin.close();
      monitorDestination.close();
      return;
    }

    spinner8.suffixText =
      chalk.green("SUCCESS") +
      ".\n" +
      chalk.dim(`   -- Event data: ${JSON.stringify(callMessageEvents)}\n`);
    spinner8.succeed();

    // send a message to jvm dApp on destination chain

    // TODO
    throw new Error("TODO: implement this test");
  } catch (err) {
    console.log("Error in helloWorldDemoJVMJVM: ", err);
    monitorOrigin.close();
    monitorDestination.close();
  }
}
// const { Monitor } = require("../utils/monitor");

// const { HttpProvider, IconWallet } = IconService.default;

// const HTTP_PROVIDER = new HttpProvider(rpc.lisbon);
// const HTTP_PROVIDER2 = new HttpProvider(rpc.altair);

// const ICON_SERVICE = new IconService.default(HTTP_PROVIDER);
// const HAVAH_SERVICE = new IconService.default(HTTP_PROVIDER2);
// const ICON_WALLET = IconWallet.loadPrivateKey(PK_ICON);
// const HAVAH_WALLET = IconWallet.loadPrivateKey(PK_HAVAH);

// if (dappSimple.lisbon == null) {
//   throw new Error("Cant find Dapp contract deployed to lisbon");
// }
// if (dappSimple.altair == null) {
//   throw new Error("Cant find Dapp contract deployed to altair");
// }

// /*
//  */
// async function test() {
//   try {
//     // initialize block monitor on destination chain (havah)
//     const monitor = new Monitor(
//       HAVAH_SERVICE,
//       contract.altair["xcall-multi"],
//       dappSimple.altair
//     );
//     const monitorOrigin = new Monitor(
//       ICON_SERVICE,
//       contract.lisbon["xcall-multi"],
//       dappSimple.lisbon
//     );

//     // start monitor on both chains
//     monitor.start();
//     monitorOrigin.start();

//     // message to send
//     let msgString = "hello world";
//     const rollbackString = "use Rollback";
//     const triggerErrorForRollback = true;

//     // to trigger a rollback, the message must be "rollback"
//     // and in that case the `MessageReceived` event
//     // will not be emmitted
//     if (triggerErrorForRollback) {
//       msgString = "rollback";
//     }

//     const msg = encodeMessage(msgString);
//     const rollback = encodeMessage(rollbackString);
//     const altairDestinationAddress = `${network.altair.label}/${dappSimple.altair}`;

//     const paramsToAltair = {
//       _to: altairDestinationAddress,
//       _data: msg,
//       _rollback: rollback
//     };

//     // send message
//     const tx = await callDappContractMethod(
//       "sendMessage",
//       dappSimple.lisbon,
//       ICON_WALLET,
//       nid.lisbon,
//       ICON_SERVICE,
//       paramsToAltair,
//       true, // set to false if paramsToAltair._rollback is null
//       true
//     );
//     console.log(`\n> Sending message from Lisbon to Altair. Tx hash: ${tx}`);
//     console.log(tx);

//     // wait tx result
//     const txResult = await getTxResult(tx, ICON_SERVICE);
//     console.log(`\n> Sending message from Lisbon to Altair. Tx result:`);
//     console.log(JSON.stringify(txResult));

//     // filter CallMessageSentEvent
//     const callMsgSentEvent = await filterCallMessageSentEvent(
//       txResult.eventLogs,
//       contract.lisbon["xcall-multi"],
//       false
//     );
//     console.log(`\n> Filtering CallMessageSentEvent:`);
//     console.log(callMsgSentEvent);

//     // parse CallMessageSentEvent
//     const parsedCallMsgSentEvent = await parseCallMessageSentEvent(
//       callMsgSentEvent,
//       false
//     );
//     console.log(`\n> Parsing CallMessageSentEvent:`);
//     console.log(parsedCallMsgSentEvent);

//     // get _sn from source
//     const snFromSource = parsedCallMsgSentEvent._sn;
//     console.log(`\n> Source SN: ${snFromSource}`);

//     // wait for the monitor to fetch events
//     await monitor.waitForEvents("CallMessage", snFromSource);

//     // Access events after the monitor has fetched them
//     const callMsgEvents = monitor.events.CallMessage;
//     console.log(`\n> Filtering CallMessage event on destination:`);
//     console.log(callMsgEvents);

//     // parse CallMessage event on destination
//     const parsedCallMsgEvent = await parseCallMessageEvent(callMsgEvents);
//     console.log(`\n> Parsing CallMessage event on destination:`);
//     console.log(parsedCallMsgEvent);

//     const txExecuteCall = await callDappContractMethod(
//       "executeCall",
//       contract.altair["xcall-multi"],
//       HAVAH_WALLET,
//       nid.altair,
//       HAVAH_SERVICE,
//       {
//         _reqId: parsedCallMsgEvent._nsn,
//         _data: parsedCallMsgEvent._data
//       },
//       false
//     );
//     console.log(`\n> Sending transaction to executeCall:`);
//     console.log(txExecuteCall);

//     // wait tx result
//     const txResultExecuteCall = await getTxResult(txExecuteCall, HAVAH_SERVICE);
//     console.log(`\n> Sending transaction to executeCall. Tx result:`);
//     console.log(txResultExecuteCall);
//     console.log(JSON.stringify(txResultExecuteCall));

//     // filter CallExecuted event
//     const callExecutedEvent = await filterCallExecutedEvent(
//       txResultExecuteCall.eventLogs,
//       contract.altair["xcall-multi"]
//     );
//     console.log(`\n> Filtering CallExecuted event:`);
//     console.log(callExecutedEvent);

//     // fetching MessageReceived event on destination if no rollback
//     if (!triggerErrorForRollback) {
//       await monitor.waitForEvents("MessageReceived", msg);
//       // Access events after the monitor has fetched them
//       const msgReceivedEvents = monitor.events.MessageReceived;
//       console.log(`\n> Filtering MessageReceived event on destination:`);
//       console.log(msgReceivedEvents);
//     } else {
//       console.log(
//         `\n> Bypassing fetching MessageReceived event on destination beacuse of rollback`
//       );
//     }

//     // wait for the monitor to fetch ResponseMessage event
//     await monitorOrigin.waitForEvents("ResponseMessage", snFromSource);
//     const responseMsgEvents = monitorOrigin.events.ResponseMessage;
//     console.log(`\n> Filtering ResponseMessage event on source:`);
//     console.log(responseMsgEvents);

//     if (triggerErrorForRollback) {
//       // wait for the monitor to fetch RollbackMessage event
//       await monitorOrigin.waitForEvents("RollbackMessage", snFromSource);
//       const rollbackMsgEvents = monitorOrigin.events.RollbackMessage;
//       console.log(`\n> Filtering RollbackMessage event on source:`);
//       console.log(rollbackMsgEvents);

//       // execute rollback transaction
//       const txExecuteRollback = await callDappContractMethod(
//         "executeRollback",
//         contract.lisbon["xcall-multi"],
//         ICON_WALLET,
//         nid.lisbon,
//         ICON_SERVICE,
//         {
//           _sn: snFromSource
//         },
//         false
//       );
//       console.log(`\n> Sending transaction to executeRollback:`);
//       console.log(txExecuteRollback);

//       // wait tx result
//       const txResultExecuteRollback = await getTxResult(
//         txExecuteRollback,
//         ICON_SERVICE
//       );
//       console.log(`\n> Sending transaction to executeRollback. Tx result:`);
//       console.log(txResultExecuteRollback);
//       console.log(JSON.stringify(txResultExecuteRollback));

//       // filter RollbackExecuted event
//       await monitorOrigin.waitForEvents("RollbackExecuted", snFromSource);
//       const rollbackExecutedEvents = monitorOrigin.events.RollbackExecuted;
//       console.log(`\n> Filtering RollbackExecuted event on source:`);
//       console.log(rollbackExecutedEvents);
//     } else {
//       console.log("\n> Bypassing rollback transaction");
//     }

//     // close monitors
//     monitor.close();
//     monitorOrigin.close();
//   } catch (e) {
//     console.log("error running tests", e);
//   }
// }

export default helloWorldDemoJVMJVM;
