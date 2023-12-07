// setting up environment variables
let ENV_PATH = `./.env`;
let DEPLOYMENTS_PATH = `./deployments.json`;

// if (process.env.NODE_ENV != null) {
//   ENV_PATH = `./.env.${process.env.NODE_ENV}`;
//   DEPLOYMENTS_PATH = `./deployments.${process.env.NODE_ENV}.json`;
// }

require("dotenv").config({ path: ENV_PATH });
const { xcallAbi } = require("./xcallAbi");

const config = {
  originChain: {
    jvm: {
      rpc:
        process.env.JVM_ORIGIN_RPC ??
        "https://lisbon.net.solidwallet.io/api/v3",
      privateKey: process.env.JVM_ORIGIN_WALLET_PK ?? null,
      xcallAddress:
        process.env.JVM_ORIGIN_XCALL_ADDRESS ??
        "cx15a339fa60bd86225050b22ea8cd4a9d7cd8bb83",
      networkLabel: process.env.JVM_ORIGIN_NETWORK_LABEL ?? "0x2.icon",
      nid: process.env.JVM_ORIGIN_NID ?? 2
    },
    evm: {
      rpc: process.env.EVM_ORIGIN_RPC ?? null,
      privateKey: process.env.EVM_ORIGIN_WALLET_PK ?? null,
      xcallAddress: process.env.EVM_ORIGIN_XCALL_ADDRESS ?? null,
      networkLabel: process.env.EVM_ORIGIN_NETWORK_LABEL ?? null
    },
    cosmwasm: {
      rpc: process.env.COSMWASM_ORIGIN_RPC ?? null,
      privateKey: process.env.COSMWASM_ORIGIN_WALLET_PK ?? null,
      xcallAddress: process.env.COSMWASM_ORIGIN_XCALL_ADDRESS ?? null,
      networkLabel: process.env.COSMWASM_ORIGIN_NETWORK_LABEL ?? null
    }
  },
  destinationChain: {
    jvm: {
      rpc:
        process.env.JVM_DESTINATION_RPC ??
        "https://ctz.altair.havah.io/api/v3/icon_dex",
      privateKey: process.env.JVM_DESTINATION_WALLET_PK ?? null,
      xcallAddress:
        process.env.JVM_DESTINATION_XCALL_ADDRESS ??
        "cxf35c6158382096ea8cf7c54ee338ddfcaf2869a3",
      networkLabel: process.env.JVM_DESTINATION_NETWORK_LABEL ?? "0x111.icon",
      nid: process.env.JVM_DESTINATION_NID ?? 273
    },
    evm: {
      rpc:
        process.env.EVM_DESTINATION_RPC ??
        "https://go.getblock.io/4725e19710d3470da10b3b6f81ef1a80",
      privateKey: process.env.EVM_DESTINATION_WALLET_PK ?? null,
      xcallAddress:
        process.env.EVM_DESTINATION_XCALL_ADDRESS ??
        "0xC938B1B7C20D080Ca3B67eebBfb66a75Fb3C4995",
      networkLabel: process.env.EVM_DESTINATION_NETWORK_LABEL ?? "0x61.bsc"
    },
    cosmwasm: {
      rpc: process.env.COSMWASM_DESTINATION_RPC ?? null,
      privateKey: process.env.COSMWASM_DESTINATION_WALLET_PK ?? null,
      xcallAddress: process.env.COSMWASM_DESTINATION_XCALL_ADDRESS ?? null,
      networkLabel: process.env.COSMWASM_DESTINATION_NETWORK_LABEL ?? null
    }
  },
  config: {
    icon: {
      contract: {
        chain: "cx0000000000000000000000000000000000000000"
      }
    },
    paths: {
      evm: {
        root: "../evm/contracts/",
        build: "../evm/build/contracts/",
        post: ""
      },
      jvm: {
        root: "../jvm/contracts/",
        build: "../jvm/contracts/",
        post: "build/libs/"
      },
      deployments: DEPLOYMENTS_PATH
    },
    tracker: {
      logs: "/api/v1/logs?address=",
      berlin: "tracker.berlin.icon.community",
      lisbon: "tracker.lisbon.icon.community"
    }
  },
  xcallAbi: xcallAbi
};
module.exports = config;
