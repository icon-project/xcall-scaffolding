import { Web3 } from "web3";
import { ethers } from "ethers";
import utilIndex from "../utils/index.mjs";
const { config, utils } = utilIndex;
const {
  EVM_RPC,
  EVM_PRIVATE_KEY,
  EVM_XCALL_ADDRESS,
  JVM_XCALL_ADDRESS,
  // JVM_NETWORK_LABEL,
  EVM_NETWORK_LABEL,
  JVM_NID,
  xcallAbi
} = config;
const {
  isValidHexAddress,
  sleep,
  fetchEventsFromTracker,
  contractEventMonitor,
  getBlockJvm,
  JVM_SERVICE,
  JVM_WALLET,
  IconConverter,
  SignedTransaction,
  IconBuilder
  // EVM_SERVICE_WEB3,
  // EVM_WALLET_WEB3
} = utils;

const web3Utils = Web3.utils;
const { CallTransactionBuilder, CallBuilder } = IconBuilder;
const EVM_PROVIDER_ETHERS = new ethers.providers.JsonRpcProvider(EVM_RPC);
const EVM_SIGNER_ETHERS = new ethers.Wallet(
  EVM_PRIVATE_KEY,
  EVM_PROVIDER_ETHERS
);

function getContractObjectEvm(abi, address) {
  try {
    const contract = new ethers.Contract(address, abi, EVM_SIGNER_ETHERS);
    return contract;
  } catch (e) {
    console.log("Error getting contract object: ", e);
    throw new Error("Error getting contract object");
  }
}

function getXcallContractObject() {
  try {
    return getContractObjectEvm(xcallAbi, EVM_XCALL_ADDRESS);
  } catch (e) {
    console.log("Error getting xcall contract object: ", e);
    throw new Error("Error getting xcall contract object");
  }
}

function getDappContractObject(contract, abi) {
  try {
    return getContractObjectEvm(abi, contract);
  } catch (e) {
    console.log("Error getting dapp contract object: ", e);
    throw new Error("Error getting dapp contract object");
  }
}

function filterEventEvm(contract, method, ...params) {
  const filter = contract.filters[method](...params);
  return filter;
}

function filterCallMessageEventEvm(btpAddressSource, evmDappAddress, sn) {
  const xCallContract = getXcallContractObject();
  return filterEventEvm(
    xCallContract,
    "CallMessage",
    btpAddressSource,
    evmDappAddress,
    sn
  );
}

function filterCallExecutedEventEvm(msgId) {
  const xCallContract = getXcallContractObject();
  return filterEventEvm(xCallContract, "CallExecuted", msgId);
}

async function waitCallMessageEventEvm(
  eventFilter,
  spinner,
  maxMinutesToWait = 20,
  waitTimeBetweenRetries = 1000
) {
  try {
    const xCallContract = getXcallContractObject();
    return await waitEventEvm(
      xCallContract,
      eventFilter,
      spinner,
      maxMinutesToWait,
      waitTimeBetweenRetries
    );
  } catch (e) {
    console.log("Error waiting for CallMessage event: ", e);
    throw new Error("Error waiting for CallMessage event");
  }
}

async function waitCallExecutedEventEvm(
  eventFilter,
  spinner,
  maxMinutesToWait = 20
) {
  try {
    const xCallContract = getXcallContractObject();
    return await waitEventEvm(
      xCallContract,
      eventFilter,
      spinner,
      maxMinutesToWait
    );
  } catch (e) {
    console.log("Error waiting for CallExecuted event: ", e);
    throw new Error("Error waiting for CallExecuted event");
  }
}

async function waitEventEvm(
  contract,
  eventFilter,
  spinner = null,
  maxMinutesToWait = 20,
  waitTimeBetweenRetries = 1000
) {
  const initBlock = await contract.provider.getBlockNumber();
  let height = initBlock - 5;
  let next = height + 1;
  const maxSecondsToWait = maxMinutesToWait * 60;
  let secondsWaited = 0;
  let breakLoop = false;
  while (secondsWaited < maxSecondsToWait && !breakLoop) {
    try {
      await sleep(waitTimeBetweenRetries);
      secondsWaited++;
      if (height == next) {
        const latestBlock = await contract.provider.getBlockNumber();
        next = latestBlock + 1;
        continue;
      }
      for (; height < next; height++) {
        if (spinner != null) {
          spinner.suffixText = `\n   -- Waiting for event on EVM Chain: block height ${height}`;
        }
        const events = await contract.queryFilter(eventFilter, height);
        if (events != null && events.length > 0) {
          return events;
        }
      }
    } catch (err) {
      spinner.suffixText = `\n   -- Error waiting for event on EVM Chain: ${err.message}`;
      const errMsg = JSON.stringify({
        msg: err.body,
        requestBody: err.requestBody
      });
      const parsedErrMsg = recursivelyParseJSON(errMsg);
      if (
        parsedErrMsg != null &&
        parsedErrMsg.msg != null &&
        parsedErrMsg.msg.error != null
      ) {
        if (parsedErrMsg.msg.error.message != null) {
          if (parsedErrMsg.msg.error.message === "limit exceeded") {
            spinner.suffixText = `\n   -- Response error => rate limit exceeded. ${JSON.stringify(
              parsedErrMsg
            )}`;
            breakLoop = true;
          }
        }
      }
    }
  }
  return null;
  // throw new Error("Timeout waiting for event on EVM Chain");
}

function recursivelyParseJSON(str) {
  try {
    return recursivelyParseJSONHelper(JSON.parse(str));
  } catch (err) {
    `Unexpected error running recursivelyParseJSON. input => ${str}`;
  }
}

function recursivelyParseJSONHelper(obj) {
  try {
    const mainObject = { ...obj };
    for (const key in mainObject) {
      if (typeof mainObject[key] === "string") {
        let parsedValue;
        try {
          // try to parse the string
          parsedValue = JSON.parse(mainObject[key]);
        } catch (innerErr) {
          // if the parsing fails assume is a regular string
          parsedValue = mainObject[key];
        }
        // replace the original string with the parsed or unparsed
        // value
        mainObject[key] = parsedValue;

        // if the value is an object, recursively parse it
        if (typeof mainObject[key] === "object") {
          // recursively parse the object
          mainObject[key] = recursivelyParseJSONHelper(mainObject[key]);
        }
      } else if (
        typeof mainObject[key] === "object" &&
        mainObject[key] != null
      ) {
        // recursively parse the object
        mainObject[key] = recursivelyParseJSONHelper(mainObject[key]);
      }
    }

    return mainObject;
  } catch (err) {
    throw new Error(
      `Unexpected error running recursivelyParseJSONHelper. input => ${str}`
    );
  }
}

async function executeCallEvm(id, data) {
  try {
    const xCallContract = getXcallContractObject();
    return await sendSignedTxEvm(xCallContract, "executeCall", id, data);
  } catch (e) {
    console.log("Error invoking executeCall on EVM Chain: ", e);
    throw new Error("Error invoking executeCall on EVM Chain");
  }
}

async function initializeEvmContract(
  dappContract,
  abi,
  sourceXcallContract,
  destinationBtpAddress
) {
  try {
    const contract = getDappContractObject(dappContract, abi);
    return await sendSignedTxEvm(
      contract,
      "initialize",
      sourceXcallContract,
      destinationBtpAddress
    );
  } catch (e) {
    return {
      txHash: null,
      txObj: null,
      error: e
    };
  }
}

async function sendSignedTxEvm(contract, method, ...params) {
  try {
    const txParams = {
      gasPrice: ethers.utils.parseUnits("50", "gwei"),
      gasLimit: 10000000
      // gasLimit: 15000000
    };
    const tx = await contract[method](...params, txParams);
    const txWaited = await tx.wait(1);
    return {
      txHash: tx.hash,
      txObj: txWaited
    };
  } catch (e) {
    return {
      txHash: null,
      txObj: null,
      error: e
    };
  }
}

function parseEventResponseFromTracker(response) {
  const result = response.map(event => {
    const indexed =
      event.indexed != null && typeof event.indexed === "string"
        ? JSON.parse(event.indexed)
        : [];
    return {
      ...event,
      scoreAddress: event.address,
      indexed: indexed
    };
  });

  return result;
}

async function eventListenerJvm(sig, address, id, fromBlock = null) {
  void id;
  const useBlock = fromBlock != null ? fromBlock : "latest";
  let eventBlock = await getBlockJvm(useBlock);
  const monitor = responseMessageEventListener(eventBlock.height);
}

async function waitEventJvm(
  sig,
  address,
  id,
  fromBlock = null,
  maxMinutesToWait = 20
) {
  void id;
  const maxSecondsToWait = maxMinutesToWait * 60;
  let secondsWaited = 0;
  let latest = await getBlockJvm("latest");
  // const monitor = responseMessageEventListener(latest.height);
  let height = latest.height - 1;
  if (fromBlock != null && fromBlock < height) {
    height = fromBlock;
  }
  let block = await getBlockJvm(height);
  while (secondsWaited < maxSecondsToWait) {
    while (height < latest.height) {
      console.log(`-- Waiting for event on JVM Chain: block height ${height}`);
      const events = await filterEventFromBlockJvm(block, sig, address);
      if (events.length > 0) {
        return { block, events };
      }
      height++;
      if (height == latest.height) {
        block = latest;
      } else {
        block = await getBlockJvm(height);
      }
    }
    await sleep(1000);
    latest = await getBlockJvm("latest");
  }
  throw new Error("Timeout waiting for event on JVM Chain");
}

async function waitEventFromTrackerJvm(
  sig,
  address,
  id,
  maxMinutesToWait = 40
) {
  try {
    console.log(`## Waiting for event ${sig} on ${address} with id ${id}`);
    let minutesWaited = 0;
    let highestIdFound = 0;
    let minsToWaitOnEachLoop = 1;

    console.log(
      `# If destination chain is Sepolia, the wait period is around 20 min for the event to be raised because of the block finality.`
    );

    while (minutesWaited < maxMinutesToWait) {
      let events = await fetchEventsFromTracker();
      const parsedEvent = parseEventResponseFromTracker(events);
      const filterEvents = filterEventJvm(parsedEvent, sig, address);

      if (filterEvents.length > 0) {
        console.log(`## found event ${sig}`);
        for (const event of filterEvents) {
          const idNumber = parseInt(id);
          const eventIdNumber = parseInt(event.indexed[1]);
          if (eventIdNumber == idNumber) {
            return event;
          } else {
            if (eventIdNumber >= highestIdFound) {
              highestIdFound = eventIdNumber;
              console.log(
                `## Event id doest not match. Found Id: ${eventIdNumber} (${
                  event.indexed[1]
                }), Looking for Id: ${idNumber} (${id})`
              );
            } else {
              continue;
            }
          }
        }
        console.log(
          `# Event not found, will continue to wait for ${minsToWaitOnEachLoop} minutes`
        );
        console.log(`# Waiting (waited for ${minutesWaited} minutes so far)..`);
        console.log(`# press ctrl + c to exit\n`);
        minutesWaited += minsToWaitOnEachLoop;
        await sleep(60000 * minsToWaitOnEachLoop);
      }
    }
    console.log(`# Waited for ${maxMinutesToWait} minutes, exiting..`);
    throw new Error(
      `Timeout waiting for event with signature "${sig}" on JVM Chain`
    );
  } catch (e) {
    console.log("Error waiting for event on JVM Chain: ", e);
    throw new Error("Error waiting for event on JVM Chain");
  }
}

async function filterEventFromBlockJvm(block, sig, address) {
  try {
    let filtered = [];
    for (const tx of block.confirmedTransactionList) {
      const txResult = await JVM_SERVICE.getTransactionResult(
        tx.txHash
      ).execute();
      const events = filterEventJvm(txResult.eventLogs, sig, address);
      if (events.length > 0) {
        filtered = events;
        break;
      }
    }
    return filtered;
  } catch (e) {
    console.log("Error filtering event on JVM Chain: ", e.message);
    throw new Error("Error filtering event on JVM Chain");
  }
}

function responseMessageEventListener(height) {
  return contractEventMonitor(
    height,
    "ResponseMessage(int,int)",
    JVM_XCALL_ADDRESS
  );
}
async function waitResponseMessageEventJvm(id) {
  try {
    const sig = "ResponseMessage(int,int,str)";
    return await eventListenerJvm(sig, JVM_XCALL_ADDRESS, id);
    // return await waitEventJvm(sig, JVM_XCALL_ADDRESS, id);
    // return await waitEventFromTrackerJvm(sig, JVM_XCALL_ADDRESS, id);
  } catch (e) {
    console.log("Error waiting for ResponseMessage event: ", e.message);
    throw new Error("Error waiting for ResponseMessage event");
  }
}

async function waitRollbackExecutedEventJvm(id) {
  try {
    const sig = "RollbackExecuted(int)";
    return await waitEventFromTrackerJvm(sig, JVM_XCALL_ADDRESS, id);
  } catch (e) {
    console.log("Error waiting for RollbackExecuted event: ", e.message);
    throw new Error("Error waiting for RollbackExecuted event");
  }
}

async function getXcallJvmFee(
  network,
  useRollback = true,
  contract = JVM_XCALL_ADDRESS,
  service = JVM_SERVICE
) {
  try {
    const params = {
      _net: network,
      _rollback: useRollback ? "0x1" : "0x0"
    };
    const txObj = new CallBuilder()
      .to(contract)
      .method("getFee")
      .params(params)
      .build();

    return await service.call(txObj).execute();
  } catch (e) {
    return {
      txHash: null,
      txObj: null,
      error: e
    };
  }
}

// invokeJvmContractMethod(method, dappContract, params, fee);
async function invokeJvmContractMethod(
  method,
  contract,
  wallet = JVM_WALLET,
  nid = JVM_NID,
  service = JVM_SERVICE,
  params = null,
  value = null
) {
  try {
    const txObj = new CallTransactionBuilder()
      .from(wallet.getAddress())
      .to(contract)
      .stepLimit(IconConverter.toBigNumber(20000000))
      .nid(IconConverter.toBigNumber(nid))
      .nonce(IconConverter.toBigNumber(1))
      .version(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .method(method);

    if (value !== null) {
      txObj.value(value);
    }
    if (params !== null) {
      txObj.params(params);
    }

    const formattedTxObj = txObj.build();
    // console.log("txObject");
    // console.log(formattedTxObj);
    const signedTx = new SignedTransaction(formattedTxObj, wallet);
    const result = await service.sendTransaction(signedTx).execute();
    return {
      txHash: result,
      txObj: formattedTxObj
    };
  } catch (e) {
    return {
      txHash: null,
      txObj: null,
      error: e
    };
  }
}

async function initializeJvmContract(
  dappContract,
  params,
  destinationNetworkLabel = EVM_NETWORK_LABEL,
  rollback = true,
  contract = JVM_XCALL_ADDRESS,
  service = JVM_SERVICE,
  wallet = JVM_WALLET,
  nid = JVM_NID
) {
  try {
    const fee = await getXcallJvmFee(
      destinationNetworkLabel,
      rollback,
      contract,
      service
    );
    if (typeof fee !== "string" && fee.error) {
      throw new Error(fee.error);
    }
    return await invokeJvmContractMethod(
      "initialize",
      dappContract,
      wallet,
      nid,
      service,
      params,
      fee
    );
  } catch (err) {
    return {
      txHash: null,
      txObj: null,
      error: err
    };
  }
}

async function invokeJvmDAppMethod(
  dappContract,
  method,
  params,
  rollback = true,
  destinationNetworkLabel = EVM_NETWORK_LABEL,
  jvmXCallContract = JVM_XCALL_ADDRESS,
  service = JVM_SERVICE,
  wallet = JVM_WALLET,
  nid = JVM_NID
) {
  try {
    const fee = await getXcallJvmFee(
      destinationNetworkLabel,
      rollback,
      jvmXCallContract,
      service
    );
    if (typeof fee !== "string" && fee.error) {
      throw new Error(fee.error);
    }
    return await invokeJvmContractMethod(
      method,
      dappContract,
      wallet,
      nid,
      service,
      params,
      fee
    );
  } catch (err) {
    return {
      txHash: null,
      txObj: null,
      error: err
    };
  }
}
function getNetworkAddress(label, address) {
  return `${label}/${address}`;
}

function decodeMessage(msg) {
  return web3Utils.hexToString(msg);
}

function encodeMessage(msg) {
  return web3Utils.fromUtf8(msg);
}

function filterCallMessageSentEventJvm(eventlogs) {
  return filterEventJvm(eventlogs, "CallMessageSent(Address,str,int)");
}

function filterRollbackExecutedEventJvm(eventlogs) {
  return filterEventJvm(eventlogs, "RollbackExecuted(int)");
}

function filterEventJvm(eventlogs, sig, address = JVM_XCALL_ADDRESS) {
  const result = eventlogs.filter(event => {
    return (
      event.indexed &&
      event.indexed[0] === sig &&
      (!address || address === event.scoreAddress)
    );
  });

  return result;
}

function parseCallMessageSentEventJvm(event) {
  const indexed = event[0].indexed || [];
  const data = event[0].data || [];
  return {
    _from: indexed[1],
    _to: indexed[2],
    _sn: indexed[3],
    _nsn: data[0]
  };
}

function parseEvmEventsFromBlock(block, eventName = "CallExecuted") {
  // const logs = block.events.filter(event => {
  //   return event.event === eventName;
  // });
  // return logs;
  // return JSON.stringify(block);
}

export default {
  initializeJvmContract,
  initializeEvmContract,
  getNetworkAddress,
  isValidHexAddress,
  invokeJvmDAppMethod,
  invokeJvmContractMethod,
  decodeMessage,
  encodeMessage,
  filterCallMessageSentEventJvm,
  parseCallMessageSentEventJvm,
  filterCallMessageEventEvm,
  waitCallMessageEventEvm,
  executeCallEvm,
  filterCallExecutedEventEvm,
  waitCallExecutedEventEvm,
  waitEventJvm,
  waitResponseMessageEventJvm,
  waitEventFromTrackerJvm,
  waitRollbackExecutedEventJvm,
  getBlockJvm,
  parseEvmEventsFromBlock,
  filterRollbackExecutedEventJvm,
  recursivelyParseJSON
};
