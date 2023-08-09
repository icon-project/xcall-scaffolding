const {
  deployJvmContract,
  deployEvmContract,
  getContractPaths,
  verifyContractsBuild,
  getTxResult
} = require("./utils");

async function main() {
  try {
    // verify contracts are built
    await verifyContractsBuild();

    // get contract paths
    const contractPaths = getContractPaths();

    // deploy JVM contracts
    for (const contractPath of contractPaths.jvm) {
      console.log("\n>Deploying JVM contract", contractPath);
      const deployed = await deployJvmContract(contractPath);
      console.log("Deployed JVM contract", deployed);
      const txResult = await getTxResult(deployed);
      console.log("Tx result", txResult);
    }

    // deploy EVM contracts
    for (const contractPath of contractPaths.evm) {
      console.log("\n>Deploying EVM contract", contractPath);
      const deployed = await deployEvmContract(contractPath);
      console.log("Deployed EVM contract", deployed);
    }
  } catch (e) {
    console.log("Error deploying contracts", e.message);
    throw new Error("Error deploying contracts");
  }
}

main();
