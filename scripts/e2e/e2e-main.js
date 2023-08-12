const { JVM_XCALL_ADDRESS, EVM_NETWORK_LABEL } = require("../config");
const { getDeployments } = require("../utils");
const { getTxResult } = require("../utils");
const { initializeJvmContract, getBtpAddress } = require("./utils");

async function main() {
  const deployments = await getDeployments();
  console.log("> deployments", deployments);

  // initialize jvm contract
  const evmDappBtpAddress = getBtpAddress(
    EVM_NETWORK_LABEL,
    deployments.HelloWorld.evm
  );
  const response_01 = await initializeJvmContract(deployments.HelloWorld.jvm, {
    _sourceXCallContract: JVM_XCALL_ADDRESS,
    _destinationBtpAddress: evmDappBtpAddress
  });
  console.log("> tx hash", response_01);
  const txResult_01 = await getTxResult(response_01);
  console.log("> tx result", txResult_01);
}

main();
