const { utils } = require("../utils");
const { getDeployments } = utils;
const { helloWorldE2E } = require("./e2e-helloWorld");
const { votingDappE2E } = require("./e2e-votingDapp");
const singleTest = process.env.SINGLE_TEST;

async function main() {
  const deployments = await getDeployments();
  console.log("\n>>>>>> Running E2E tests");
  switch (singleTest) {
    case "helloWorldE2E":
      console.log("\n>>>> Running helloWorldE2E");
      await helloWorldE2E(deployments);
      break;
    case "votingDappE2E":
      console.log("\n>>>> Running votingDappE2E");
      await votingDappE2E(deployments);
      break;
    default:
      console.log("\n>>>> Running helloWorldE2E");
      await helloWorldE2E(deployments);
      console.log("\n>>>> Running votingDappE2E");
      await votingDappE2E(deployments);
  }
}

main();
