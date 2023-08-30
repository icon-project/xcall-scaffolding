// setting up environment variables
let ENV_PATH = `./.env`;
let DEPLOYMENTS_PATH = `./deployments.json`;

if (process.env.NODE_ENV != null) {
  ENV_PATH = `./.env.${process.env.NODE_ENV}`;
  DEPLOYMENTS_PATH = `./deployments.${process.env.NODE_ENV}.json`;
}

require("dotenv").config({ path: ENV_PATH });
const { xcallAbi } = require("./xcallAbi");
const {
  EVM_RPC,
  JVM_RPC,
  EVM_PRIVATE_KEY,
  JVM_PRIVATE_KEY,
  EVM_XCALL_ADDRESS,
  JVM_XCALL_ADDRESS,
  JVM_NETWORK_LABEL,
  EVM_NETWORK_LABEL,
  JVM_NID
} = process.env;

const config = {
  EVM_RPC,
  JVM_RPC,
  EVM_PRIVATE_KEY,
  JVM_PRIVATE_KEY,
  EVM_XCALL_ADDRESS,
  JVM_XCALL_ADDRESS,
  JVM_NETWORK_LABEL,
  EVM_NETWORK_LABEL,
  JVM_NID,
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
      hostname: "tracker.berlin.icon.community"
    }
  },
  xcallAbi: xcallAbi
};
module.exports = config;
