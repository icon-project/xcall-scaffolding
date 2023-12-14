import utilIndex from "./utils/index.mjs";
const { utils, config } = utilIndex;

const chains = {
  origin: config.originChain,
  destination: config.destinationChain
};
const {
  customJvmService,
  customJvmWallet,
  deployCosmwasmContract,
  deployEvmContract,
  deployJvmContract,
  getContractPaths,
  getDeployments,
  getEvmContract,
  getTxResult,
  saveDeployments,
  validateCosmwasmConfig,
  validateDeployments,
  validateEvmConfig,
  validateJvmConfig,
  verifyContractsBuild
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
    const result = { ...localDeployments };

    for (const dapp in contractPaths) {
      for (const eachChain in chains) {
        const chain = chains[eachChain];

        // validate and deploy jvm
        if (validateJvmConfig(chain.jvm)) {
          console.log(
            `> Deploying dapp ${dapp} on chain ${chain.jvm.networkLabel}`
          );
          // TODO find a way to handle these condition more gracefully
          if (
            localDeployments[dapp] != null &&
            localDeployments[dapp][chain.jvm.networkLabel] != null &&
            localDeployments[dapp][chain.jvm.networkLabel].contract != null
          ) {
            console.log(
              `> Contract for dApp ${dapp} on chain ${chain.jvm.networkLabel} already deployed`
            );
            // result[dapp][chain.jvm.networkLabel].contract =
            //   localDeployments[dapp][chain.jvm.networkLabel].contract;
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
            `Invalid chain configuration: ${JSON.stringify({
              ...chain.jvm,
              privateKey: chain.jvm.privateKey.slice(0, 5) + "..."
            })}. Bypassing JVM deployment`
          );
        }

        // validate and deploy evm
        if (validateEvmConfig(chain.evm)) {
          console.log(
            `> Deploying dapp ${dapp} on chain ${chain.evm.networkLabel}`
          );
          if (
            localDeployments[dapp] != null &&
            localDeployments[dapp][chain.evm.networkLabel] != null &&
            localDeployments[dapp][chain.evm.networkLabel].contract != null
          ) {
            console.log(
              `> Contract for dApp ${dapp} on chain ${chain.evm.networkLabel} already deployed`
            );
            // result[dapp][chain.evm.networkLabel].contract =
            //   localDeployments[dapp][chain.evm.networkLabel].contract;
            // result[dapp][chain.evm.networkLabel].evmAbi =
            //   localDeployments[dapp][chain.evm.networkLabel].evmAbi;
          } else {
            // deploy to evm chain
            const evmDappPath = contractPaths[dapp].evm;
            const deployed = await deployToEvmChain(evmDappPath);
            result[dapp][chain.evm.networkLabel].contract = deployed.address;
            result[dapp][chain.evm.networkLabel].evmAbi = deployed.abi;
          }
        } else {
          console.log(
            `Invalid chain configuration: ${JSON.stringify({
              ...chain.evm,
              privateKey: chain.evm.privateKey.slice(0, 5) + "..."
            })}. Bypassing EVM deployment`
          );
        }

        // validate and deploy cosmwasm
        if (validateCosmwasmConfig(chain.cosmwasm)) {
          console.log(
            `> Deploying dapp ${dapp} on chain ${chain.cosmwasm.networkLabel}`
          );
          if (
            localDeployments[dapp] != null &&
            localDeployments[dapp][chain.cosmwasm.networkLabel] != null &&
            localDeployments[dapp][chain.cosmwasm.networkLabel].contract != null
          ) {
            console.log(
              `> Contract for dApp ${dapp} on chain ${chain.cosmwasm.networkLabel} already deployed`
            );
            // result[dapp][chain.cosmwasm.networkLabel].contract =
            //   localDeployments[dapp][chain.cosmwasm.networkLabel].contract;
            // result[dapp][chain.cosmwasm.networkLabel].evmAbi =
            //   localDeployments[dapp][chain.cosmwasm.networkLabel].evmAbi;
          } else {
            // deploy to cosmwasm chain
            const cosmwasmDappPath = contractPaths[dapp].cosmwasm;
            const deployed = await deployToCosmwasmChain(cosmwasmDappPath);
            result[dapp][chain.cosmwasm.networkLabel].contract =
              deployed.address;
            result[dapp][chain.cosmwasm.networkLabel].evmAbi = deployed.abi;
          }
        } else {
          console.log(
            `Invalid chain configuration: ${JSON.stringify({
              ...chain.cosmwasm,
              privateKey: chain.cosmwasm.privateKey.slice(0, 5) + "..."
            })}. Bypassing cosmwasm deployment`
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

async function deployToCosmwasmChain(cosmwasmDappPath) {
  try {
    console.log("> Deploying COSMWASM contract", cosmwasmDappPath);
    const deployedCosmwasm = await deployCosmwasmContract(cosmwasmDappPath);
    console.log("> Deployed COSMWASM contract address: ", deployedCosmwasm);
    return { address: deployedCosmwasm, abi: null };
  } catch (err) {
    console.log("> Error deploying COSMWASM contract:", err.message);
    console.log("> ByPassing COSMWASM contract deployment");
  }
}

main();
