const { getDeployments } = require("../utils");
const { helloWorldE2E } = require("./e2e-helloWorld");

async function main() {
  const deployments = await getDeployments();

  console.log("\n>>>>>> Running E2E tests");
  console.log(">>>> Running helloWorldE2E");
  await helloWorldE2E(deployments);
}

main();
