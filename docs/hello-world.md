# Hello World dApp

## Overview

The following dApp is a simple "hello world" to showcase xCall functionality, a message is send from the origin chain and received in the destination chain.

## Detailed Design

### EVM contract

After deployment and before interacting with the contract is necessary to first sign a transaction calling the `initialize(address _xcallContractAddress, string calldata _destinationBtpAddress)` method. The params required for this method call are the address of the xCall contract in the EVM chain and the BTP formatted address of the dApp contract in the destination chain.

The solidity contract for the EVM chain has a public (payable) method called `sendMessage(bytes calldata _data, bytes calldata _rollback)` which is used to send a cross chain message to the contract in the destination chain.

A functions called `handleCallMessage(string calldata _from, bytes calldata _data)` is implemented to handle the interaction with the xCall contract (ie receive a crosschain message or handling a rollback).

Two events are defined one is `event MessageReceived(string _from, string _msgData)` for when a message is received and `event RollbackDataReceived(string _from, string _msgData)` for when a rollback is trigger.

### JVM contract

Just like the case for the EVM contract, after deployment and before interacting with this contract a transaction is necessary to call the `public void initialize(Address _sourceXCallContract, String _destinationBtpAddress)` method. The params for the method call are the address of the xCall contract in the JVM chain and the BTP formatted address of the dApp contract in the destination chain.

The Java contract for the JVM chain has a public (payable) method called `public void sendMessage(byte[] payload, @Optional byte[] rollback)` which is used to send a cross chain message to the contract in the destination chain.

A functions called `public void handleCallMessage(string _from, byte[] _data)` is implemented to handle the interaction with the xCall contract (ie receive a crosschain message or handling a rollback).

Two events are defined one is `public void MessageReceived(String _from, byte[] _msgData)` for when a message is received and `public void RollbackDataReceived(String _from, byte[] _rollback)` for when a rollback is trigger.
