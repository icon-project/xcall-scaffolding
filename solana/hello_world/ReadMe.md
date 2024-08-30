
# Xcall Scaffolding Contract Setup

This guide walks you through setting up and running the `xcall` scaffolding contract on a local Solana network.

## Prerequisites

- Solana CLI
- Anchor CLI
- Git

## Steps

### 1. Spin Up Local Solana Network

Start a local Solana test validator:

```bash
solana-test-validator
```

### 2. Fetch `xcall` Multi Solana Repo

Clone the `xcall` multi Solana repository:

```bash
git clone -b solana/xcall-multi --single-branch https://github.com/icon-project/xcall-multi.git

cd xcall-multi/contracts/solana
```

### 3. Deploy `Xcall` and `Centralized Connection`

Deploy the `xcall` program and `centralized connection`:

```bash
anchor deploy --program xcall
anchor deploy --program centralized-connection
```

### 4. Deploy the `hello_world` Program

Navigate to the `solana-xcall-scaffolding` project directory and deploy the `hello_world` program:

```bash
cd xcall-scaffolding
anchor deploy --program hello_world
```

### 5. Initialize and Send a "Hello World" Message

Run the script to initialize and send a hello world message:

```bash
anchor run hello_world
```


***Important: Make sure the program id of xcall and connection in target/types is sync with your local xcall and connection deployment***

***Note: The target folder in this repo contains the types and idl for xcall and connection program. Donot delete target folder***