const fs = require("fs");
const IconService = require("icon-sdk-js");
const { Web3 } = require("web3");
const { DirectSecp256k1Wallet } = require("@cosmjs/proto-signing");
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { calculateFee, GasPrice } = require("@cosmjs/stargate");
const { destinationChain, originChain, config } = require("./config");
const customRequest = require("./customRequest");

const {
  IconBuilder,
  IconConverter,
  SignedTransaction,
  HttpProvider,
  IconWallet
} = IconService.default;

const { EventMonitorSpec, EventFilter, BigNumber } = IconService;

// validate config
validateConfig();

const HTTP_PROVIDER = new HttpProvider(originChain.jvm.rpc);
const JVM_SERVICE = new IconService.default(HTTP_PROVIDER);
const JVM_WALLET = IconWallet.loadPrivateKey(originChain.jvm.privateKey);

const EVM_SERVICE_WEB3 = new Web3(destinationChain.evm.rpc);
const EVM_WALLET_WEB3 = EVM_SERVICE_WEB3.eth.accounts.privateKeyToAccount(
  destinationChain.evm.privateKey,
  true
);
EVM_SERVICE_WEB3.eth.accounts.wallet.add(EVM_WALLET_WEB3);

function customJvmService(rpc) {
  const httpProvider = new HttpProvider(rpc);
  return new IconService.default(httpProvider);
}

function customJvmWallet(privateKey) {
  return IconWallet.loadPrivateKey(privateKey);
}

/*
 *
 */
function contractEventMonitor(height, sig, contract) {
  // const heightAsBigNumber = BigNumber.isBigNumber(height)
  //   ? height
  //   : BigNumber(height);
  // const eventFilter = new EventFilter(sig, contract);
  // const spec = new EventMonitorSpec(heightAsBigNumber, eventFilter, true, 20);
  // const onData = event => {
  //   console.log("Event", event);
  // };
  // const onError = error => {
  //   console.log("Error", error);
  // };
  // const onProgress = data => {
  //   console.log("Progress", data);
  // };
  // const url = "ws://" + originChain.jvm.rpc.replace("http://", "").replace("https://", "");
  // console.log("url", url);
  // return new Monitor(url, spec, onData, onError, onProgress);
}

/*
 */
async function fetchEventsFromTracker(network = "berlin") {
  try {
    let url = null;
    switch (network) {
      case "berlin":
        url = config.tracker.berlin;
        break;
      case "lisbon":
        url = config.tracker.lisbon;
        break;
      default:
        url = config.tracker.berlin;
    }

    const response = await customRequest(
      `${config.tracker.logs}${originChain.jvm.xcallAddress}`,
      false,
      url
    );
    return response;
  } catch (e) {
    console.log("Error fetching events from tracker", e.message);
    throw new Error("Error fetching events from tracker");
  }
}

/*
 *
 */
async function getBlockJvm(label) {
  try {
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

/*
 */
async function getTxResult(txHash, jvmService = JVM_SERVICE, spinner = null) {
  const maxLoops = 10;
  let loop = 0;
  const spinnerInitText = spinner != null ? spinner.suffixText : null;
  while (loop < maxLoops) {
    try {
      return await jvmService.getTransactionResult(txHash).execute();
    } catch (e) {
      if (spinner != null) {
        spinner.suffixText = `${spinnerInitText}. txResult (pass ${loop}): ${e}`;
      }
      // console.log(`txResult (pass ${loop}): ${e}`);
      loop++;
      await sleep(1000);
    }
  }
}

/*
 * deployJvmContract
 */
async function deployJvmContract(
  compiledContractPath,
  jvmService = JVM_SERVICE,
  jvmWallet = JVM_WALLET,
  nid = originChain.jvm.nid
) {
  try {
    console.log(jvmWallet.getAddress());
    const content = getJvmContractBytecode(compiledContractPath);
    const payload = new IconBuilder.DeployTransactionBuilder()
      .contentType("application/java")
      .content(`0x${content}`)
      // .params(params)
      .from(jvmWallet.getAddress())
      .to(config.icon.contract.chain)
      .nid(nid)
      .version(3)
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(10000000000))
      .build();

    const signedTx = new SignedTransaction(payload, jvmWallet);
    return await jvmService.sendTransaction(signedTx).execute();
  } catch (e) {
    console.log(`Error deploying contract: ${compiledContractPath}`);
    console.log(e);
    throw new Error("Error deploying contract on JVM chain");
  }
}

/*
 * getJvmContractBytecode
 * @param {string} contractPath
 * @returns {string} bytecode
 */
function getJvmContractBytecode(contractPath) {
  try {
    return fs.readFileSync(contractPath).toString("hex");
  } catch (e) {
    console.log("Error reading contract bytecode", e);
    throw new Error("Error reading contract bytecode");
  }
}

/*
 * deployEvmContract
 */
async function deployEvmContract(compiledContractPath) {
  try {
    const { abi, bytecode } = getEvmContract(compiledContractPath);
    const contract = new EVM_SERVICE_WEB3.eth.Contract(abi);
    const deployTx = contract.deploy({
      data: bytecode
    });
    const deployedContract = await deployTx
      .send({
        from: EVM_WALLET_WEB3.address,
        gas: await deployTx.estimateGas()
      })
      .once("transactionHash", hash => {
        console.log("Mining deployment transaction...");
        console.log("Transaction hash:", hash);
      });
    return deployedContract.options.address;
  } catch (e) {
    console.log(`Error deploying contract: ${compiledContractPath}`, e.message);
    throw new Error("Error deploying contract on EVM chain");
  }
}

/*
 */
function getEvmContract(compiledContractPath) {
  try {
    const result = {
      abi: null,
      bytecode: null
    };
    const contract = JSON.parse(fs.readFileSync(compiledContractPath));
    result.abi = contract.abi;
    result.bytecode = contract.bytecode;
    return result;
  } catch (e) {
    console.log("Error getting EVM contract", e.message);
    throw new Error("Error getting EVM contract");
  }
}

async function deployCosmwasmContract(compiledContractPath) {
  try {
    if (compiledContractPath == null) {
      console.log("> No contract path provided. Bypassing deployment");
    } else {
      const COSMWASM_WALLET = await DirectSecp256k1Wallet.fromKey(
        Buffer.from(destinationChain.cosmwasm.privateKey, "hex"),
        "archway"
      );
      const COSMWASM_SERVICE = await SigningCosmWasmClient.connectWithSigner(
        destinationChain.cosmwasm.rpc,
        COSMWASM_WALLET
      );
      const gasPrice = GasPrice.fromString("1000000000000aconst");
      const uploadFee = calculateFee(1_500_000, gasPrice);
      const contractByteCode = fs.readFileSync(compiledContractPath);
      const uploadReceipt = await COSMWASM_SERVICE.upload(
        COSMWASM_WALLET.address,
        contractByteCode,
        uploadFee
      );
      const instantiateFee = calculateFee(500_000, gasPrice);
      const instantiateReceipt = await COSMWASM_SERVICE.instantiate(
        COSMWASM_WALLET.address,
        uploadReceipt.codeId,
        {
          xcall_address: destinationChain.cosmwasm.xcallAddress
        },
        "HelloWorld",
        instantiateFee
      );
      return instantiateReceipt.contractAddress;
    }
  } catch (e) {
    console.log(`Error deploying contract: ${compiledContractPath}`, e.message);
    throw new Error("Error deploying contract on COSMWASM chain");
  }
}

/*
 */
function getDappsNames() {
  const roots = Object.keys(config.paths).map(key => config.paths[key].root);
  const folderNamesEvm = getDirectories(roots[0]);
  const folderNamesEvmAndJvm = getDirectories(roots[1]).filter(folder =>
    folderNamesEvm.includes(folder)
  );
  return folderNamesEvmAndJvm;
}

/*
 */
function getContractPaths() {
  try {
    const results = {};
    const folderNamesEvmAndJvm = getDappsNames();

    folderNamesEvmAndJvm.forEach(folder => {
      let jvmPath = `${config.paths.jvm.build}${folder}/${config.paths.jvm.post}${folder}-optimized.jar`;
      let evmPath = `${config.paths.evm.build}${config.paths.evm.post}${folder}.json`;
      let cosmwasmPath = `${config.paths.cosmwasm.build}${config.paths.cosmwasm.post}${folder}.wasm`;

      if (!fs.existsSync(jvmPath)) {
        jvmPath = null;
      }
      if (!fs.existsSync(evmPath)) {
        evmPath = null;
      }
      if (!fs.existsSync(cosmwasmPath)) {
        cosmwasmPath = null;
      }

      results[folder] = {
        evm: evmPath,
        jvm: jvmPath,
        cosmwasm: cosmwasmPath
      };
    });
    return results;
  } catch (e) {
    console.log("Error getting contract paths", e);
    throw new Error("Error getting contract paths");
  }
}

/*
 */
function getDirectories(path) {
  return fs
    .readdirSync(path, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

/*
 */
function verifyContractsBuild() {
  const paths = getContractPaths();
  try {
    for (const dapp in paths) {
      const path = paths[dapp];
      if (!fs.existsSync(path.evm)) {
        throw new Error(`EVM contract build not found: ${path.evm}`);
      }
      if (!fs.existsSync(path.jvm)) {
        throw new Error(`JVM contract build not found: ${path.jvm}`);
      }
    }
    return true;
  } catch (e) {
    console.log("> Error verifying contract build.", e.message);
    // throw new Error("Error verifying contract build.");
  }
}

/*
 */
function validateConfig(bypass = false) {
  if (bypass) {
    return true;
  }
  try {
    console.log(">>>>>> Validating configurations");
    // verify private key for EVM chain
    if (
      destinationChain.evm.privateKey == null ||
      (typeof destinationChain.evm.privateKey !== "string" &&
        destinationChain.evm.privateKey.slice(0, 2) !== "0x")
    ) {
      throw new Error("EVM_DESTINATION_WALLET_PK not set");
    } else {
      console.log(`> EVM_DESTINATION_WALLET_PK validated`);
    }

    // verify private key for JVM chain
    if (originChain.jvm.privateKey == null) {
      throw new Error("JVM_ORIGIN_WALLET_PK not set");
    } else {
      console.log("> JVM_ORIGIN_WALLET_PK validated");
    }

    // verify rpc endpoints
    if (destinationChain.evm.rpc == null) {
      throw new Error("EVM_DESTINATION_RPC not set");
    } else {
      console.log(
        `> EVM_DESTINATION_RPC validated. ${destinationChain.evm.rpc}`
      );
    }
    if (originChain.jvm.rpc == null) {
      throw new Error("JVM_ORIGIN_RPC not set");
    } else {
      console.log(`> JVM_ORIGIN_RPC validated. ${originChain.jvm.rpc}`);
    }

    // verify xCall address on EVM Chain
    if (
      destinationChain.evm.xcallAddress == null ||
      destinationChain.evm.xcallAddress == "" ||
      isValidEVMContract(destinationChain.evm.xcallAddress) == false
    ) {
      console.error(
        `> Invalid EVM_DESTINATION_XCALL_ADDRESS: ${destinationChain.evm.xcallAddress}.\n> Contract deployment of dApps will success but running e2e tests will fail.`
      );
    } else {
      console.log("> EVM_DESTINATION_XCALL_ADDRESS validated");
    }

    // verify xCall address on JVM Chain
    if (
      originChain.jvm.xcallAddress == null ||
      originChain.jvm.xcallAddress == "" ||
      isValidJVMContract(originChain.jvm.xcallAddress) == false
    ) {
      console.error(
        `> Invalid JVM_ORIGIN_XCALL_ADDRESS: ${originChain.jvm.xcallAddress}.\n> Contract deployment of dApps will success but running e2e tests will fail.`
      );
    } else {
      console.log("> JVM_ORIGIN_XCALL_ADDRESS validated");
    }

    // verify JVM network label
    if (
      originChain.jvm.networkLabel == null ||
      originChain.jvm.networkLabel == "" ||
      isValidNetworkLabel(originChain.jvm.networkLabel) == false
    ) {
      console.error(
        `> Invalid JVM_ORIGIN_NETWORK_LABEL: ${originChain.jvm.networkLabel}.\n> Contract deployment of dApps will success but running e2e tests will fail.`
      );
    } else {
      console.log("> JVM_ORIGIN_NETWORK_LABEL validated");
    }

    // verify EVM network label
    if (
      destinationChain.evm.networkLabel == null ||
      destinationChain.evm.networkLabel == "" ||
      isValidNetworkLabel(destinationChain.evm.networkLabel) == false
    ) {
      console.error(
        `> Invalid EVM_DESTINATION_NETWORK_LABEL: ${destinationChain.evm.networkLabel}.\n> Contract deployment of dApps will success but running e2e tests will fail.`
      );
    } else {
      console.log("> EVM_DESTINATION_NETWORK_LABEL validated");
    }

    // verify JVM nid
    if (originChain.jvm.nid == null || originChain.jvm.nid == "") {
      throw new Error("JVM_ORIGIN_NID not set");
    } else {
      console.log("> JVM_ORIGIN_NID validated");
    }
    // verify contracts are built
    // const contractsAreBuilt = verifyContractsBuild();
    // if (!contractsAreBuilt) {
    //   throw new Error("Contracts are not built");
    // } else {
    //   console.log("> Contracts are built");
    // }
  } catch (e) {
    console.log("Error validating config", e.message);
    throw new Error("Error validating config");
  }
}

/*
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*
 */
function saveDeployments(deployments) {
  try {
    fs.writeFileSync(config.paths.deployments, JSON.stringify(deployments));
  } catch (e) {
    console.log("Error saving deployments", e.message);
    throw new Error("Error saving deployments");
  }
}

/*
 */
function getDeployments() {
  try {
    const deployments = fs.readFileSync(config.paths.deployments);
    return JSON.parse(deployments);
  } catch (e) {
    console.log(">> Error getting deployments", e.message);
    return null;
  }
}

function validateDeployments(deployments) {
  if (deployments == null) {
    throw new Error("Deployments not found");
  }
  if (deployments.evm == null) {
    throw new Error("EVM deployments not found");
  }
  if (deployments.jvm == null) {
    throw new Error("JVM deployments not found");
  }
}

function isValidJVMContract(address) {
  return isValidHexAddress(address, "c");
}

function isValidEVMContract(address) {
  return isValidHexAddress(address, "0");
}

function isValidHexAddress(address, stringStartsWith, length = 42) {
  return (
    address &&
    address.length === length &&
    address.startsWith(stringStartsWith.toLowerCase())
  );
}

function isValidNetworkLabel(label) {
  const [nid, chain] = label.split(".");
  return nid != null && chain != null && nid !== "" && chain !== "";
}

function validateJvmConfig(config) {
  if (config.rpc == null || config.rpc == "") {
    console.log("> JVM_RPC not set");
    return false;
  }
  if (config.privateKey == null || config.privateKey == "") {
    console.log("> JVM_WALLET_PK not set");
    return false;
  }
  if (config.nid == null || config.nid == "") {
    console.log("> JVM_NID not set");
    return false;
  }
  if (config.networkLabel == null || config.networkLabel == "") {
    console.log("> JVM_NETWORK_LABEL not set");
    return false;
  }
  if (config.xcallAddress == null || config.xcallAddress == "") {
    console.log("> JVM_XCALL_ADDRESS not set");
    return false;
  }

  return true;
}

function validateEvmConfig(config) {
  if (config.rpc == null || config.rpc == "") {
    console.log("> EVM_RPC not set");
    return false;
  }
  if (config.privateKey == null || config.privateKey == "") {
    console.log("> EVM_WALLET_PK not set");
    return false;
  }
  if (config.networkLabel == null || config.networkLabel == "") {
    console.log("> EVM_NETWORK_LABEL not set");
    return false;
  }
  if (config.xcallAddress == null || config.xcallAddress == "") {
    console.log("> EVM_XCALL_ADDRESS not set");
    return false;
  }

  return true;
}

function validateCosmwasmConfig(config) {
  if (config.rpc == null || config.rpc == "") {
    console.log("> COSMWASM_RPC not set");
    return false;
  }
  if (config.privateKey == null || config.privateKey == "") {
    console.log("> COSMWASM_WALLET_PK not set");
    return false;
  }
  if (config.networkLabel == null || config.networkLabel == "") {
    console.log("> COSMWASM_NETWORK_LABEL not set");
    return false;
  }
  if (config.xcallAddress == null || config.xcallAddress == "") {
    console.log("> COSMWASM_XCALL_ADDRESS not set");
    return false;
  }

  return true;
}

module.exports = {
  EVM_SERVICE_WEB3,
  EVM_WALLET_WEB3,
  IconBuilder,
  IconConverter,
  JVM_SERVICE,
  JVM_WALLET,
  SignedTransaction,
  contractEventMonitor,
  customJvmService,
  customJvmWallet,
  customRequest,
  deployEvmContract,
  deployJvmContract,
  fetchEventsFromTracker,
  getBlockJvm,
  getContractPaths,
  getDappsNames,
  getDeployments,
  getEvmContract,
  getTxResult,
  isValidHexAddress,
  saveDeployments,
  sleep,
  validateCosmwasmConfig,
  validateDeployments,
  validateEvmConfig,
  validateJvmConfig,
  verifyContractsBuild,
  deployCosmwasmContract
};
