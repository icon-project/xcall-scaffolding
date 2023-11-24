import utilIndex from "../utils/index.mjs";
const { utils } = utilIndex;
const { getDeployments } = utils;
import helloWorldDemo from "./jvm-evm-helloWorld.mjs";
// const { votingDappE2E } = require("./e2e-votingDapp");
const singleTest = process.env.SINGLE_TEST;

async function main() {
  try {
    // Get deployments
    const deployments = await getDeployments();
    if (deployments == null) {
      console.log(
        "> No deployments found. Run deploy command before running the demos. Exiting."
      );
      return;
    }
    console.log("\n>>>>>> Running xCall demos");
    switch (singleTest) {
      case "helloWorldDemo":
        console.log("\n>>>> Running JVM-EVM helloWorldDemo");
        await helloWorldDemo(deployments);
        break;
      case "votingDappDemo":
        console.log("\n>>>> Running votingDappDemo");
        console.log("! Not implemented yet");
        //   await votingDappDemo(deployments);
        break;
      default:
        console.log("\n>>>> Running JVM-EVM helloWorldDemo");
        await helloWorldDemo(deployments);
        console.log("\n>>>> Running votingDappDemo");
        console.log("! Not implemented yet");
      //   await votingDappDemo(deployments);
    }
  } catch (err) {
    console.log("Unexpected error while running demo: ", err);
  }
}

main();
