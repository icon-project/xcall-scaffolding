# xCall Scaffolding - Contract deployment and Demos.

## Installation

Before running the deployment and the demos you need to first install the required packages in the project by running the following command:

```bash
npm install
```

## Deployment and Running Demos

To deploy the contracts for each example dApp you have to create an environment file (`.env.testnet` file) inside the `/demo/` folder at the root of the project.

Inside the environment file you MUST specify the following variables:
```env
EVM_RPC="Url for the evm rpc node"
JVM_RPC="Url for the jvm/icon rpc node"
EVM_PRIVATE_KEY="private key of the evm wallet to use"
JVM_PRIVATE_KEY="private key of the jvm/icon wallet to use"
EVM_XCALL_ADDRESS="xCall address on evm chain"
JVM_XCALL_ADDRESS="xCall address on jvm chain"
EVM_NETWORK_LABEL="Network chain id for evm chain"
JVM_NETWORK_LABEL="Network chain id for jvm chain"
JVM_NID="Network id for jvm chain"
```

The following is an example of how the `.env.testnet` file should look like when working with Berlin and Sepolia networks:

```env
# url of the evm chain rpc node
EVM_RPC="https://sepolia.infura.io/v3/ffbf8ebe228f4758ae82e175640275e0"

# url of the jvm chain rpc node
JVM_RPC="https://berlin.net.solidwallet.io/api/v3/icon_dex"

# private key of the evm chain wallet
EVM_PRIVATE_KEY="0x1d0.....79b"

# private key of the jvm chain wallet
JVM_PRIVATE_KEY="0a0.....e03"

# address of the xcall contract on the evm chain
EVM_XCALL_ADDRESS="0x8E302b2fD7C10A0033e48EB0602Db3C7d6E0F506"

# address of the xcall contract on the jvm chain
JVM_XCALL_ADDRESS="cx15a339fa60bd86225050b22ea8cd4a9d7cd8bb83"

# BTP network ID of the jvm chain
JVM_NETWORK_LABEL="0x2.icon"

# BTP network ID of the evm chain
EVM_NETWORK_LABEL="0xaa36a7.eth2"

# network if of the jvm chain
JVM_NID=2
```

The wallets for each chain should have enough funds to pay for the gas required to deploy the contracts.

Once the `.env.testnet` file has been defined correctly you can run the following command inside the `/demo/` folder to deploy the contracts:

```bash
npm run deploy-testnet
```

The following command will execute the demo:
```bash
npm run demo-testnet-helloWorld
```
