import utilIndex from "../utils/index.mjs";
const { utils } = utilIndex;
const { getDeployments } = utils;
import helloWorldE2E from "./e2e-helloWorld.mjs";
// const { votingDappE2E } = require("./e2e-votingDapp");
const singleTest = process.env.SINGLE_TEST;

async function main() {
  try {
    // Get deployments
    const deployments = await getDeployments();
    if (deployments == null) {
      console.log(
        "> No deployments found. Run deploy command before running tests. Exiting."
      );
      return;
    }
    console.log("\n>>>>>> Running E2E tests");
    switch (singleTest) {
      case "helloWorldE2E":
        console.log("\n>>>> Running helloWorldE2E");
        await helloWorldE2E(deployments);
        break;
      // case "votingDappE2E":
      //   console.log("\n>>>> Running votingDappE2E");
      //   await votingDappE2E(deployments);
      //   break;
      default:
        console.log("\n>>>> Running helloWorldE2E");
        await helloWorldE2E(deployments);
      // console.log("\n>>>> Running votingDappE2E");
      // await votingDappE2E(deployments);
    }
  } catch (err) {
    //
  }
}

main();
