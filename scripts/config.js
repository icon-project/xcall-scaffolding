require("dotenv").config();
const {
  EVM_RPC,
  JVM_RPC,
  EVM_PRIVATE_KEY,
  JVM_PRIVATE_KEY,
  EVM_XCALL_ADDRESS,
  JVM_XCALL_ADDRESS
} = process.env;

const config = {
  EVM_RPC,
  JVM_RPC,
  EVM_PRIVATE_KEY,
  JVM_PRIVATE_KEY,
  EVM_XCALL_ADDRESS,
  JVM_XCALL_ADDRESS,
  config: {
    icon: {
      contract: {
        chain: "cx0000000000000000000000000000000000000000"
      },
      nid: 3
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
      }
    }
  }
};
module.exports = config;
