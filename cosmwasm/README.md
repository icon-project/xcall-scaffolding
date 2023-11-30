# Cosmwasm Integration

The rust source code for the contracts can be found in the `./contracts/` folder.

## Design Documents

Read the design documents for each example project:

1. [Cross Chain Voting dApp](../docs/cross-chain-voting-dapp.md)
2. [Hello World dApp](../docs/hello-world.md)

## Prerequisites

Install Rust

```bash
curl https://sh.rustup.rs -sSf | sh
rustup default 1.69.0


```


## Build

Run the following command to compile the contracts.

```bash
./build.sh
```

## Test

Run the following command to run the tests.

```bash
cargo test
```
