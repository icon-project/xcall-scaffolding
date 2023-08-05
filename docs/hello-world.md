# Cross chain voting dApp

## Overview

The following dApp is a simple "hello world" to showcase xCall functionality, a message is send from the origin chain and received in the destination chain.

## Detailed Design

### JVM contract

The smart contract on the origin chain in our setup is written in Java.

The implementation of the smart contract will have two public (payable) methods called `voteYes()` and `voteNo()` which will trigger the crosschain transaction.

These methods will internally call the private method `_sendCallMessage(byte[] _data, @Optional byte[] _rollback)`.

The `_sendCallMessage` method in the contract will invoke the `sendCallMessage` method of the xCall contract on the origin chain to initiate the crosschain transfer.

An internal tally of the votes that has been casted will be saved in two variables (BigInteger) named `countOfYes` and `countOfNo` and are initiated with a value of zero at the moment of deployment.

The contract will have a readonly method called `getVotes()` that will return the current state of the votes which should be the same both on the destination and origin chains.

During the deployment of this contract we are going to provide the address of the xcall contract on the origin chain and the btp address of the solidity contract on the destination chain which should be deployed first.

### EVM contract

The smart contract on the destination chain is written in solidity.

The implementation of this smart contracts is comprised of a struct variable named `Votes` that will have two BigInteger params named `countOfYes` and `countOfNo` that will serve as counters for the amount of “yes” and “no” votes and a variable of type Address named `callSvc` that will be setup to the contract address of the xCall contract on the EVM network, this will ensure that only the xCall contract is allowed to modify the tally of votes. These variables are initiated in the constructor, the vote counters start with a value of zero and the `callSvc` variable is setup during deployment.

We have a public function called `getVotes()` that returns the current state of the votes and two internal functions named `addYesVote()` and `addNoVote()` that are called by the `handleCallMessage(string calldata _from, bytes calldata _data)` method of our solidity contract.

The `handleCallMessage` method is a requirement to interact with xCall, once a message is received on the destination chain it is required by the user to sign a transaction calling the `executeCall` method of the xCall contract to initiate the last step of a cross chain message with xCall, this transaction will allow the xCall contract to pass onto our solidity contract the cross chain message and we then handle the logic in our solidity contract in the destination chain, in our specific case, depending on the payload (the message being send) we either increase the votes in the tally for “yes” or the “no” votes.
