const {
  EVM_RPC,
  JVM_RPC,
  EVM_PRIVATE_KEY,
  JVM_PRIVATE_KEY,
  EVM_XCALL_ADDRESS,
  JVM_XCALL_ADDRESS,
  JVM_NETWORK_LABEL,
  EVM_NETWORK_LABEL,
  JVM_NID
} = require("../config");
const { isValidHexAddress } = require("../utils");
const { Web3 } = require("web3");
const { ethers } = require("ethers");
const { xcallAbi } = require("./xcallAbi");
const web3Utils = Web3.utils;

const IconService = require("icon-sdk-js");
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
    return getContractObjectEvm(xcallAbi, JVM_XCALL_ADDRESS);
  } catch (e) {
    console.log("Error getting xcall contract object: ", e);
    throw new Error("Error getting xcall contract object");
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
  return eventlogs.filter(event => {
    return (
      event.indexed &&
      event.indexed[0] === sig &&
      (!address || address === event.scoreAddress)
    );
  });
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
  getBtpAddress,
  isValidHexAddress,
  invokeJvmDAppMethod,
  decodeMessage,
  encodeMessage,
  filterCallMessageSentEventJvm,
  parseCallMessageSentEventJvm,
  filterCallMessageEventEvm
};
