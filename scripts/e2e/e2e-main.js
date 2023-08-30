const { utils } = require("../utils");
const { getDeployments } = utils;
const { helloWorldE2E } = require("./e2e-helloWorld");
const { votingDappE2E } = require("./e2e-votingDapp");

async function main() {
  const deployments = await getDeployments();

  console.log("\n>>>>>> Running E2E tests");
  console.log(">>>> Running helloWorldE2E");
  // await helloWorldE2E(deployments);
  console.log(">>>> Running helloWorldE2E");
  await votingDappE2E(deployments);
}

main();
