const IconService = require("icon-sdk-js");
const { Web3 } = require("web3");
const {
  EVM_RPC,
  JVM_RPC,
  EVM_PRIVATE_KEY,
  JVM_PRIVATE_KEY,
  EVM_XCALL_ADDRESS,
  JVM_XCALL_ADDRESS,
  config
} = require("./config");

const {
  IconBuilder,
  IconConverter,
  SignedTransaction,
  HttpProvider,
  IconWallet
} = IconService.default;
const { CallTransactionBuilder, CallBuilder } = IconBuilder;

const HTTP_PROVIDER = new HttpProvider(JVM_RPC);
const JVM_SERVICE = new IconService.default(HTTP_PROVIDER);
const JVM_WALLET = IconWallet.loadPrivateKey(JVM_PRIVATE_KEY);

const EVM_SERVICE = new Web3(EVM_RPC);
const EVM_WALLET = EVM_SERVICE.eth.accounts.privateKeyToAccount(
  EVM_PRIVATE_KEY,
  true
);
EVM_SERVICE.eth.accounts.wallet.add(EVM_WALLET);

/*
 * deployIconContract
 */
async function deployIconContract(params) {
  try {
    const content = getIconContractBytecode();
    const payload = new IconBuilder.DeployTransactionBuilder()
      .contentType("application/java")
      .content(`0x${content}`)
      .params(params)
      .from(JVM_WALLET.getAddress())
      .to(config.icon.contract.chain)
      .nid(config.icon.nid)
      .version(3)
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(1000000000))
      .build();

    const signedTx = new SignedTransaction(payload, JVM_WALLET);
    return await JVM_SERVICE.sendTransaction(signedTx).execute();
  } catch (e) {
    console.log("Error deploying contract", e);
    throw new Error("Error deploying contract");
  }
}

/*
 */
function getIconContractBytecode() {
  //
}

module.exports = {
  deployIconContract
};
