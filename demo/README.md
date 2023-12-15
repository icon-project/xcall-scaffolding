# xCall Scaffolding - Contract deployment and Demos.

## Installation

Before running the deployment and the demos you need to first install the required packages in the project by running the following command:

```bash
npm install
```

## Deployment and Running Demos

To deploy the contracts for each example dApp you have to create an environment file (`.env` file) inside the `/demo/` folder at the root of the project.

The only required params that MUST be defined in the `.env` file are the private keys of the wallets of the respective chains you are going to be using but you can also define other params to customize things like the url of the rpc endpoints, network labels of the chains, etc.

the following table describes the params for the `.env` file:

| Param name                          | Is required? | Default value        | Description                              |
| ----------------------------------- | ------------ | -------------------- | ---------------------------------------- |
| EVM_ORIGIN_WALLET_PK                | Yes          | null                 | The private key of the origin EVM wallet. |
| EVM_ORIGIN_RPC                      | No           | null                    | The RPC endpoint of the origin EVM node.  |
| EVM_ORIGIN_XCALL_ADDRESS            | No           | null                    | The xcall address for the origin EVM. |
| EVM_ORIGIN_NETWORK_LABEL            | No           | null                    | The network label of the origin EVM.       |
| EVM_DESTINATION_WALLET_PK           | Yes          | null                    | The private key of the destination EVM wallet. |
| EVM_DESTINATION_RPC                 | No           | "https://go.getblock.io/4725e19710d3470da10b3b6f81ef1a80"  | The RPC endpoint of the destination EVM node.  |
| EVM_DESTINATION_XCALL_ADDRESS       | No           | "0xC938B1B7C20D080Ca3B67eebBfb66a75Fb3C4995" | The xcall address for the destination EVM. |
| EVM_DESTINATION_NETWORK_LABEL       | No           | "0x61.bsc"           | The network label of the destination EVM.       |
| JVM_ORIGIN_WALLET_PK                | Yes          | null                    | The private key of the origin JVM wallet. |
| JVM_ORIGIN_RPC                      | No           | "https://lisbon.net.solidwallet.io/api/v3"  | The RPC endpoint of the origin JVM node.  |
| JVM_ORIGIN_XCALL_ADDRESS            | No           | "cx15a339fa60bd86225050b22ea8cd4a9d7cd8bb83" | The xcall address for the origin JVM. |
| JVM_ORIGIN_NETWORK_LABEL            | No           | "0x2.icon"           | The network label of the origin JVM.       |
| JVM_ORIGIN_NID                      | No           | 2                    | The chain nid of the origin JVM.       |
| JVM_DESTINATION_WALLET_PK           | Yes          | null                 | The private key of the destination JVM wallet. |
| JVM_DESTINATION_RPC                 | No           | "https://ctz.altair.havah.io/api/v3/icon_dex"   | The RPC endpoint of the destination JVM node.  |
| JVM_DESTINATION_XCALL_ADDRESS       | No           | "cxf35c6158382096ea8cf7c54ee338ddfcaf2869a3"    | The xcall address for the destination JVM. |
| JVM_DESTINATION_NETWORK_LABEL       | No           | "0x111.icon"         | The network label of the destination JVM.       |
| JVM_DESTINATION_NID                 | No           | 273                  | The chain nid of the destination JVM.       |
| COSMWASM_ORIGIN_WALLET_PK           | Yes          | null                 | The private key of the origin CosmWasm wallet. |
| COSMWASM_ORIGIN_RPC                 | No           | null                 | The RPC endpoint of the origin CosmWasm node.  |
| COSMWASM_ORIGIN_XCALL_ADDRESS       | No           | null                 | The xcall address for the origin CosmWasm. |
| COSMWASM_ORIGIN_NETWORK_LABEL       | No           | null                 | The network label of the origin CosmWasm.       |
| COSMWASM_DESTINATION_WALLET_PK      | Yes          | null                 | The private key of the destination CosmWasm wallet. |
| COSMWASM_DESTINATION_RPC            | No           | null                 | The RPC endpoint of the destination CosmWasm node.  |
| COSMWASM_DESTINATION_XCALL_ADDRESS  | No           | null                 | The xcall address for the destination CosmWasm. |
| COSMWASM_DESTINATION_NETWORK_LABEL  | No           | null                 | The network label of the destination CosmWasm.       |

The following is an example of the content of the `.env` file

```env
# Data for EVM chains
# - origin
EVM_ORIGIN_WALLET_PK=
EVM_ORIGIN_RPC=
EVM_ORIGIN_XCALL_ADDRESS=
EVM_ORIGIN_NETWORK_LABEL=
# - destination
EVM_DESTINATION_WALLET_PK="0x1d...9b"
EVM_DESTINATION_RPC="https://1rpc.io/sepolia"
EVM_DESTINATION_XCALL_ADDRESS="0x8E302b2fD7C10A0033e48EB0602Db3C7d6E0F506"
EVM_DESTINATION_NETWORK_LABEL="0xaa36a7.eth2"

# Data for JVM chains
# - origin
JVM_ORIGIN_WALLET_PK="0a0082...fe03"
JVM_ORIGIN_RPC="https://lisbon.net.solidwallet.io/api/v3"
JVM_ORIGIN_XCALL_ADDRESS="cx15a339fa60bd86225050b22ea8cd4a9d7cd8bb83"
JVM_ORIGIN_NETWORK_LABEL="0x2.icon"
JVM_ORIGIN_NID=2
# - destination
JVM_DESTINATION_WALLET_PK="8c4dc...62a8"
JVM_DESTINATION_RPC="https://ctz.altair.havah.io/api/v3/icon_dex"
JVM_DESTINATION_XCALL_ADDRESS="cxf35c6158382096ea8cf7c54ee338ddfcaf2869a3"
JVM_DESTINATION_NETWORK_LABEL="0x111.icon"
JVM_DESTINATION_NID=273

# Data for COSMWASM chains
# - origin
COSMWASM_ORIGIN_WALLET_PK=
COSMWASM_ORIGIN_RPC=
COSMWASM_ORIGIN_XCALL_ADDRESS=
COSMWASM_ORIGIN_NETWORK_LABEL=
# - destination
COSMWASM_DESTINATION_WALLET_PK=
COSMWASM_DESTINATION_RPC=
COSMWASM_DESTINATION_XCALL_ADDRESS=
COSMWASM_DESTINATION_NETWORK_LABEL=
```

To reiterate you dont need to define all those params, you can have a `.env` file as simple as the following if you want to simply run the JVM-EVM demo for example and use the default values for the other params.

```env
# Data for EVM chains
# - destination
EVM_DESTINATION_WALLET_PK="0x1d...9b"

# Data for JVM chains
# - origin
JVM_ORIGIN_WALLET_PK="0a0082...fe03"
```

The wallets for each chain should have enough funds to pay for the gas required to deploy the contracts, and execute any transaction needed to run the demos.

Once the `.env` file has been defined correctly you can run the following command inside the `/demo/` folder to deploy the contracts:

```bash
npm run deploy
```

The following command will execute the jvm-jvm demo:
```bash
npm run demo-jvm-jvm
```

The following command will execute the jvm-evm demo:
```bash
npm run demo-jvm-evm
```

The following command will execute the jvm-cosmwasm demo:
```bash
npm run demo-jvm-cosmwasm
```
