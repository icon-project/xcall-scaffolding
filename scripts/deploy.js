const {
  deployJvmContract,
  deployEvmContract,
  getContractPaths,
  verifyContractsBuild,
  getTxResult,
  getDeployments,
  saveDeployments,
  getEvmContract
  // getDappsNames
} = require("./utils");

async function main() {
  try {
    // check if contracts have already been deployed
    console.log("\n> Checking if contracts have already been deployed");
    const localDeployments = await getDeployments();

    if (localDeployments !== null) {
      console.log(
        "\n> Contracts have already been deployed. If you want to re-deploy the contracts delete the file 'deployments.json'"
      );
      console.log("Deployments", localDeployments);
      return;
    } else {
      console.log("\n> Contracts have not been deployed yet");
    }

    // verify contracts are built
    await verifyContractsBuild();

    // get contract paths
    const contractPaths = getContractPaths();

    // deployments
    const result = {};

    for (const dapp in contractPaths) {
      result[dapp] = {};
      console.log(`\n> Deploying contracts for dApp -> ${dapp}`);
      console.log("> Deploying JVM contract", contractPaths[dapp].jvm);
      const deployedJvm = await deployJvmContract(contractPaths[dapp].jvm);
      console.log("> JVM contract deployment tx hash: ", deployedJvm);
      const txResult = await getTxResult(deployedJvm);
      console.log(
        `> JVM contract deployment status: ${
          txResult.status == 1 ? "SUCCESS" : "FAILED"
        }`
      );
      console.log(
        "> Deployed JVM contract address: ",
        txResult["scoreAddress"]
      );
      result[dapp].jvm = txResult["scoreAddress"];

      console.log("> Deploying EVM contract", contractPaths[dapp].evm);
      const { abi } = getEvmContract(contractPaths[dapp].evm);
      const deployedEvm = await deployEvmContract(contractPaths[dapp].evm);
      console.log("> Deployed EVM contract address: ", deployedEvm);
      result[dapp].evm = deployedEvm;
      result[dapp].evmAbi = abi;
    }

    console.log("> Deployments", result);
    saveDeployments(result);
  } catch (e) {
    console.log("Error deploying contracts", e.message);
    throw new Error("Error deploying contracts");
  }
}

main();
