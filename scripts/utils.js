const fs = require("fs");
const IconService = require("icon-sdk-js");
const { Web3 } = require("web3");
const {
  EVM_RPC,
  JVM_RPC,
  EVM_PRIVATE_KEY,
  JVM_PRIVATE_KEY,
  // EVM_XCALL_ADDRESS,
  // JVM_XCALL_ADDRESS,
  config
} = require("./config");

const {
  IconBuilder,
  IconConverter,
  SignedTransaction,
  HttpProvider,
  IconWallet
} = IconService.default;

// validate config
validateConfig();

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
 */
async function getTxResult(txHash) {
  const maxLoops = 10;
  let loop = 0;
  while (loop < maxLoops) {
    try {
      return await JVM_SERVICE.getTransactionResult(txHash).execute();
    } catch (e) {
      console.log(`txResult (pass ${loop}): ${e.message}`);
      loop++;
      await sleep(1000);
    }
  }
}

/*
 * deployJvmContract
 */
async function deployJvmContract(compiledContractPath) {
  try {
    const content = getJvmContractBytecode(compiledContractPath);
    const payload = new IconBuilder.DeployTransactionBuilder()
      .contentType("application/java")
      .content(`0x${content}`)
      // .params(params)
      .from(JVM_WALLET.getAddress())
      .to(config.icon.contract.chain)
      .nid(config.icon.nid)
      .version(3)
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(10000000000))
      .build();

    const signedTx = new SignedTransaction(payload, JVM_WALLET);
    return await JVM_SERVICE.sendTransaction(signedTx).execute();
  } catch (e) {
    console.log(`Error deploying contract: ${compiledContractPath}`, e.message);
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
    const contract = new EVM_SERVICE.eth.Contract(abi);
    const deployTx = contract.deploy({
      data: bytecode
    });
    const deployedContract = await deployTx
      .send({
        from: EVM_WALLET.address,
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
      results[folder] = {
        evm: `${config.paths.evm.build}${config.paths.evm.post}${folder}.json`,
        jvm: `${config.paths.jvm.build}${folder}/${config.paths.jvm.post}${folder}-optimized.jar`
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
    console.log("Error verifying contract build.", e.message);
    throw new Error("Error verifying contract build.");
  }
}

/*
 */
function validateConfig() {
  try {
    // verify private key for EVM chain
    if (
      EVM_PRIVATE_KEY == null ||
      (typeof EVM_PRIVATE_KEY !== "string" &&
        EVM_PRIVATE_KEY.slice(0, 2) !== "0x")
    ) {
      throw new Error("EVM_PRIVATE_KEY not set");
    } else {
      console.log("> EVM_PRIVATE_KEY validated");
    }

    // verify private key for JVM chain
    if (JVM_PRIVATE_KEY == null) {
      throw new Error("JVM_PRIVATE_KEY not set");
    } else {
      console.log("> JVM_PRIVATE_KEY validated");
    }

    // verify rpc endpoints
    if (EVM_RPC == null) {
      throw new Error("EVM_RPC not set");
    } else {
      console.log("> EVM_RPC validated");
    }
    if (JVM_RPC == null) {
      throw new Error("JVM_RPC not set");
    } else {
      console.log("> JVM_RPC validated");
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

module.exports = {
  deployJvmContract,
  deployEvmContract,
  getContractPaths,
  verifyContractsBuild,
  getTxResult,
  saveDeployments,
  getDeployments,
  getDappsNames
};
