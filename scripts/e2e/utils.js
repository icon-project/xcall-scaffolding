const IconService = require("icon-sdk-js");
const { Web3 } = require("web3");
const { ethers } = require("ethers");
const { config, utils } = require("../utils");
const {
  EVM_RPC,
  JVM_RPC,
  EVM_PRIVATE_KEY,
  JVM_PRIVATE_KEY,
  EVM_XCALL_ADDRESS,
  JVM_XCALL_ADDRESS,
  // JVM_NETWORK_LABEL,
  EVM_NETWORK_LABEL,
  JVM_NID,
  xcallAbi
} = config;
const { isValidHexAddress, sleep } = utils;
const web3Utils = Web3.utils;

const {
  IconWallet,
  HttpProvider,
  IconConverter,
  SignedTransaction,
  IconBuilder
} = IconService.default;

const { CallTransactionBuilder, CallBuilder } = IconBuilder;
const HTTP_PROVIDER = new HttpProvider(JVM_RPC);
const JVM_SERVICE = new IconService.default(HTTP_PROVIDER);
const JVM_WALLET = IconWallet.loadPrivateKey(JVM_PRIVATE_KEY);
const EVM_PROVIDER = new ethers.providers.JsonRpcProvider(EVM_RPC);
const EVM_SIGNER = new ethers.Wallet(EVM_PRIVATE_KEY, EVM_PROVIDER);

function getContractObjectEvm(abi, address) {
  try {
    const contract = new ethers.Contract(address, abi, EVM_SIGNER);
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
  let height = await contract.provider.getBlockNumber();
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

async function getBlockJvm(label) {
  try {
    console.log("block label");
    console.log(label);
    const hashStart = "0x";
    if (label == null || label === "latest") {
      return await JVM_SERVICE.getLastBlock().execute();
    } else if (typeof label === "string" && label.startsWith(hashStart)) {
      return await JVM_SERVICE.getBlockByHash(label).execute();
    } else {
      return await JVM_SERVICE.getBlockByHeight(label).execute();
    }
  } catch (e) {
    console.log("Error getting block on JVM Chain: ", e.message);
    throw new Error("Error getting block on JVM Chain");
  }
}

async function filterEventFromBlockJvm(block, sig, address) {
  try {
    const filtered = [];
    for (const tx of block.confirmedTransactionList) {
      const txResult = await JVM_SERVICE.getTransactionResult(
        tx.txHash
      ).execute();
      console.log("eventlogs");
      console.log(txResult.eventLogs);
      const events = filterEventJvm(txResult.eventLogs, sig, address);
      if (events.length > 0) {
        filtered.concat(events);
      }
    }
    return filtered;
  } catch (e) {
    console.log("Error filtering event on JVM Chain: ", e.message);
    throw new Error("Error filtering event on JVM Chain");
  }
}

async function waitEventJvm(
  sig,
  address,
  fromBlock = null,
  maxMinutesToWait = 20
) {
  console.log("wait event jvm");
  console.log(sig);
  console.log(address);

  const maxSecondsToWait = maxMinutesToWait * 60;
  let secondsWaited = 0;
  let latest = await getBlockJvm("latest");
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

async function waitResponseMessageEventJvm() {
  try {
    const sig = "ResponseMessage(int,int,str)";
    return await waitEventJvm(sig, JVM_XCALL_ADDRESS);
  } catch (e) {
    console.log("Error waiting for ResponseMessage event: ", e.message);
    throw new Error("Error waiting for ResponseMessage event");
  }
}

async function getXcallJvmFee(network, useRollback = true) {
  try {
    const params = {
      _net: network,
      _rollback: useRollback ? "0x1" : "0x0"
    };
    const txObj = new CallBuilder()
      .to(JVM_XCALL_ADDRESS)
      .method("getFee")
      .params(params)
      .build();

    return await JVM_SERVICE.call(txObj).execute();
  } catch (e) {
    console.log("Error getting xcall fee on JVM Chain: ", e.message);
    throw new Error("Error getting xcall fee on JVM Chain");
  }
}

async function invokeJvmContractMethod(
  method,
  contract,
  params = null,
  value = null
) {
  try {
    const txObj = new CallTransactionBuilder()
      .from(JVM_WALLET.getAddress())
      .to(contract)
      .stepLimit(IconConverter.toBigNumber(20000000))
      .nid(IconConverter.toBigNumber(JVM_NID))
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
    const signedTx = new SignedTransaction(formattedTxObj, JVM_WALLET);
    return await JVM_SERVICE.sendTransaction(signedTx).execute();
  } catch (e) {
    console.log("Error invoking JVM contract method: ", e);
    throw new Error("Error invoking JVM contract method");
  }
}

async function initializeJvmContract(dappContract, params) {
  const fee = await getXcallJvmFee(EVM_NETWORK_LABEL);
  return await invokeJvmContractMethod("initialize", dappContract, params, fee);
}

async function invokeJvmDAppMethod(
  dappContract,
  method,
  params,
  rollback = true
) {
  const fee = await getXcallJvmFee(EVM_NETWORK_LABEL, rollback);
  return await invokeJvmContractMethod(method, dappContract, params, fee);
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

  console.log("filter result");
  console.log(result);
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
  waitResponseMessageEventJvm
};
