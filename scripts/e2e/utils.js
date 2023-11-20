const { Web3 } = require("web3");
const { ethers } = require("ethers");
const { config, utils } = require("../utils");
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

async function waitCallMessageEventEvm(eventFilter, maxMinutesToWait = 20) {
  try {
    const xCallContract = getXcallContractObject();
    return await waitEventEvm(xCallContract, eventFilter, maxMinutesToWait);
  } catch (e) {
    console.log("Error waiting for CallMessage event: ", e);
    throw new Error("Error waiting for CallMessage event");
  }
}

async function waitCallExecutedEventEvm(eventFilter, maxMinutesToWait = 20) {
  try {
    const xCallContract = getXcallContractObject();
    return await waitEventEvm(xCallContract, eventFilter, maxMinutesToWait);
  } catch (e) {
    console.log("Error waiting for CallExecuted event: ", e);
    throw new Error("Error waiting for CallExecuted event");
  }
}

async function waitEventEvm(contract, eventFilter, maxMinutesToWait = 20) {
  let height = (await contract.provider.getBlockNumber()) - 5;
  let next = height + 1;
  const maxSecondsToWait = maxMinutesToWait * 60;
  let secondsWaited = 0;
  while (secondsWaited < maxSecondsToWait) {
    if (height == next) {
      await sleep(1000);
      secondsWaited++;
      next = (await contract.provider.getBlockNumber()) + 1;
      continue;
    }
    for (; height < next; height++) {
      console.log(`-- Waiting for event on EVM Chain: block height ${height}`);
      const events = await contract.queryFilter(eventFilter, height);
      if (events.length > 0) {
        return events;
      }
    }
  }
  throw new Error("Timeout waiting for event on EVM Chain");
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
    console.log("Error invoking initialize on EVM Chain: ", e);
    throw new Error("Error invoking initialize on EVM Chain");
  }
}

async function sendSignedTxEvm(contract, method, ...params) {
  try {
    const txParams = {
      gasLimit: 15000000
    };
    const tx = await contract[method](...params, txParams);
    const txHash = await tx.wait(1);
    return txHash;
  } catch (e) {
    console.log("Error sending signed tx on EVM Chain: ", e);
    throw new Error("Error sending signed tx on EVM Chain");
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
    "ResponseMessage(int,int,str)",
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
    const sig = "RollbackExecuted(int,int,str)";
    return await waitEventFromTrackerJvm(sig, JVM_XCALL_ADDRESS, id);
  } catch (e) {
    console.log("Error waiting for ResponseMessage event: ", e.message);
    throw new Error("Error waiting for ResponseMessage event");
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
    console.log("Error getting xcall fee on JVM Chain: ", e.message);
    throw new Error("Error getting xcall fee on JVM Chain");
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
    const signedTx = new SignedTransaction(formattedTxObj, wallet);
    return await service.sendTransaction(signedTx).execute();
  } catch (e) {
    console.log("Error invoking JVM contract method: ", e);
    throw new Error("Error invoking JVM contract method");
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
  const fee = await getXcallJvmFee(
    destinationNetworkLabel,
    rollback,
    contract,
    service
  );
  return await invokeJvmContractMethod(
    "initialize",
    dappContract,
    wallet,
    nid,
    service,
    params,
    fee
  );
}

// dappContract,
// params,
// destinationNetworkLabel = EVM_NETWORK_LABEL,
// rollback = true,
// contract = JVM_XCALL_ADDRESS,
// service = JVM_SERVICE,
// wallet = JVM_WALLET,
// nid = JVM_NID
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
  const fee = await getXcallJvmFee(
    destinationNetworkLabel,
    rollback,
    jvmXCallContract,
    service
  );
  return await invokeJvmContractMethod(
    method,
    dappContract,
    wallet,
    nid,
    service,
    params,
    fee
  );
}
function getBtpAddress(label, address) {
  return `btp://${label}/${address}`;
}

function decodeMessage(msg) {
  return web3Utils.hexToString(msg);
}

function encodeMessage(msg) {
  return web3Utils.fromUtf8(msg);
}

function filterCallMessageSentEventJvm(eventlogs) {
  return filterEventJvm(eventlogs, "CallMessageSent(Address,str,int,int)");
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

module.exports = {
  initializeJvmContract,
  initializeEvmContract,
  getBtpAddress,
  isValidHexAddress,
  invokeJvmDAppMethod,
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
  getBlockJvm
};
