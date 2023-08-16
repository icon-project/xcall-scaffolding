# xCall Scaffolding - Contract deployment and E2E testing.

## Installation

Before running the deployment and e2e testing scripts you need to first install the required packages in the project by running the following command:

```bash
npm install
```

## Deployment and E2E testing

To deploy the contracts for each example dApp you have to create an environment file (`.env` file) inside the `/scripts/` folder at the root of the project.

Inside the environment file you MUST specify the following variables:
```env
EVM_RPC="Url for the evm rpc node"
JVM_RPC="Url for the jvm/icon rpc node"
EVM_PRIVATE_KEY="private key of the evm wallet to use"
JVM_PRIVATE_KEY="private key of the jvm/icon wallet to use"
EVM_XCALL_ADDRESS="xCall address on evm chain"
JVM_XCALL_ADDRESS="xCall address on jvm chain"
EVM_NETWORK_LABEL="BTP chain id for evm chain"
JVM_NETWORK_LABEL="BTP chain id for jvm chain"
JVM_NID="Network id for jvm chain"
```

The following is an example of how the `.env` file should look like when working with Berlin and Sepolia networks:

```env
EVM_RPC="https://sepolia.infura.io/v3/ffbf8ebe228f4758ae82e175640275e0"
JVM_RPC="https://berlin.net.solidwallet.io/api/v3/icon_dex"
EVM_PRIVATE_KEY="0xabc01..234"
JVM_PRIVATE_KEY="abc01..234"
EVM_XCALL_ADDRESS="0x694C1f5Fb4b81e730428490a1cE3dE6e32428637"
JVM_XCALL_ADDRESS="cxf4958b242a264fc11d7d8d95f79035e35b21c1bb"
JVM_NETWORK_LABEL="0x7.icon"
EVM_NETWORK_LABEL="0xaa36a7.eth2"
JVM_NID=7
```

The wallets for each chain should have enough funds to pay for the gas required to deploy the contracts.

Once the `.env` file has been defined correctly you can run the following command inside the `/scripts/` folder to deploy the contracts:

```bash
npm run deploy
```

The following command will execute the E2E tests:
```bash
npm run test-e2e
```
