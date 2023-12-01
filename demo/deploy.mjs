import utilIndex from "./utils/index.mjs";
const { utils, config } = utilIndex;

const chains = {
  origin: config.originChain,
  destination: config.destinationChain
};
const {
  deployJvmContract,
  deployEvmContract,
  getContractPaths,
  verifyContractsBuild,
  getTxResult,
  getDeployments,
  saveDeployments,
  getEvmContract,
  validateJvmConfig,
  validateEvmConfig,
  validateDeployments,
  customJvmService,
  customJvmWallet
  // getDappsNames
} = utils;

async function main() {
  try {
    // getting deployments
    const localDeployments = getDeployments() ?? {};

    // verify contracts are built
    await verifyContractsBuild();

    // get contract paths
    const contractPaths = getContractPaths();

    // deployments
    const result = {};

    for (const dapp in contractPaths) {
      result[dapp] = {};
      for (const eachChain in chains) {
        const chain = chains[eachChain];

        if (validateJvmConfig(chain.jvm)) {
          console.log(
            `> Deploying dapp ${dapp} on chain ${chain.jvm.networkLabel}`
          );
          result[dapp][chain.jvm.networkLabel] = { contract: null, abi: null };
          if (
            localDeployments[dapp] != null &&
            localDeployments[dapp][chain.jvm.networkLabel] != null &&
            localDeployments[dapp][chain.jvm.networkLabel].contract != null
          ) {
            console.log(
              `> Contract for dApp ${dapp} on chain ${chain.jvm.networkLabel} already deployed`
            );
            result[dapp][chain.jvm.networkLabel].contract =
              localDeployments[dapp][chain.jvm.networkLabel].contract;
          } else {
            // deploy to jvm chain
            const jvmService = customJvmService(chain.jvm.rpc);
            const jvmWallet = customJvmWallet(chain.jvm.privateKey);
            const jvmDappPath = contractPaths[dapp].jvm;
            result[dapp][
              chain.jvm.networkLabel
            ].contract = await deployToJvmChain(
              jvmDappPath,
              jvmService,
              jvmWallet,
              chain.jvm.nid
            );
          }
        } else {
          console.log(
            `Invalid chain configuration: ${JSON.stringify(
              chain.jvm
            )}. Bypassing JVM deployment`
          );
        }

        if (validateEvmConfig(chain.evm)) {
          console.log(
            `> Deploying dapp ${dapp} on chain ${chain.evm.networkLabel}`
          );
          result[dapp][chain.evm.networkLabel] = { contract: null, abi: null };
          if (
            localDeployments[dapp] != null &&
            localDeployments[dapp][chain.evm.networkLabel] != null
          ) {
            console.log(
              `> Contract for dApp ${dapp} on chain ${chain.evm.networkLabel} already deployed`
            );
            result[dapp][chain.evm.networkLabel].contract =
              localDeployments[dapp][chain.evm.networkLabel].contract;
            result[dapp][chain.evm.networkLabel].evmAbi =
              localDeployments[dapp][chain.evm.networkLabel].evmAbi;
          } else {
            // deploy to evm chain
            const evmDappPath = contractPaths[dapp].evm;
            const deployed = await deployToEvmChain(evmDappPath);
            result[dapp][chain.evm.networkLabel].contract = deployed.address;
            result[dapp][chain.evm.networkLabel].evmAbi = deployed.abi;
          }
        } else {
          console.log(
            `Invalid chain configuration: ${JSON.stringify(
              chain.evm
            )}. Bypassing EVM deployment`
          );
        }
      }
    }

    console.log("> Deployments", result);
    saveDeployments(result);
  } catch (e) {
    console.log("Error deploying contracts:", e.message);
    throw new Error("Error deploying contracts");
  }
}

async function deployToJvmChain(dappPath, jvmService, jvmWallet, nid) {
  try {
    console.log("> Deploying JVM contract", dappPath);
    const deployedJvm = await deployJvmContract(
      dappPath,
      jvmService,
      jvmWallet,
      nid
    );
    console.log("> JVM contract deployment tx hash: ", deployedJvm);
    const txResult = await getTxResult(deployedJvm, jvmService);
    console.log(
      `> JVM contract deployment status: ${
        txResult.status == 1 ? "SUCCESS" : "FAILED"
      }`
    );
    console.log("> Deployed JVM contract address: ", txResult["scoreAddress"]);
    return txResult["scoreAddress"];
  } catch (err) {
    console.log("> Error deploying JVM contract:", err.message);
    console.log("> ByPassing JVM contract deployment");
    // throw new Error("Error deploying JVM contract");
  }
}

async function deployToEvmChain(evmDappPath) {
  try {
    console.log("> Deploying EVM contract", evmDappPath);
    const { abi } = getEvmContract(evmDappPath);
    const deployedEvm = await deployEvmContract(evmDappPath);
    console.log("> Deployed EVM contract address: ", deployedEvm);
    return { address: deployedEvm, abi: abi };
  } catch (err) {
    console.log("> Error deploying EVM contract:", err.message);
    console.log("> ByPassing EVM contract deployment");
  }
}

main();
