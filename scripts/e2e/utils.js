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

function getBtpAddress(label, address) {
  return `btp://${label}/${address}`;
}

function decodeMessage(msg) {
  return web3Utils.hexToString(msg);
}

function encodeMessage(msg) {
  return web3Utils.fromUtf8(msg);
}

module.exports = {
  initializeJvmContract,
  getBtpAddress,
  isValidHexAddress
};
