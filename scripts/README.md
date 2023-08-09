# xCall Scaffolding - Contract deployment.

To deploy the contracts for each example dApp you have to create an environment file (`.env` file) inside the `/scripts/` folder at the root of the project.

Inside the environment file you MUST specify the following variables:
```env
EVM_RPC="Url for the evm rpc node"
JVM_RPC="Url for the jvm/icon rpc node"
EVM_PRIVATE_KEY="private key of the evm wallet to use"
JVM_PRIVATE_KEY="private key of the jvm/icon wallet to use"
```

The following is an example of how the `.env` file should look like:

```env
EVM_RPC="https://sepolia.infura.io/v3/ffbf8ebe228f4758ae82e175640275e0"
JVM_RPC="https://berlin.net.solidwallet.io/api/v3/icon_dex"
EVM_PRIVATE_KEY="0xabc01..234"
JVM_PRIVATE_KEY="abc01..234"
```

The wallets for each chain should have enough funds to pay for the gas required to deploy the contracts.

Once the `.env` file has been defined correctly you can run the following command inside the `/scripts/` folder to deploy the contracts:

```bash
npm run deploy
```
