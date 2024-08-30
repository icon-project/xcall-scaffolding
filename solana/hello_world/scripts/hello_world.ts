import * as anchor from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { SYSVAR_INSTRUCTIONS_ID, TxnHelpers, sleep } from "./utils";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";

import { ConnectionContext as ConnectionTestContext, ConnectionPDA } from "./setups/connection_setup";
import { DappContext as DappTestCtx, DappPDA } from "./setups/hello_world_setup";
import { XcallContext as XcallTestCtx, XcallPDA } from "./setups/xcall_setup";

import { Xcall } from "../target/types/xcall";
import { Envelope, CallMessage, MessageType } from "./types";
import { CentralizedConnection } from "../target/types/centralized_connection";
import { HelloWorld } from "../target/types/hello_world";

import xcallIdlJson from "../target/idl/xcall.json";
import centralizedIdlJson from "../target/idl/centralized_connection.json";

async function initializePrograms() {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  const wallet = provider.wallet as anchor.Wallet;

  const xcallProgram: anchor.Program<Xcall> = new anchor.Program(
    xcallIdlJson as anchor.Idl, 
    provider
  ) as unknown as anchor.Program<Xcall>;

  const connectionProgram: anchor.Program<CentralizedConnection> = new anchor.Program(
    centralizedIdlJson as anchor.Idl, 
    provider
  ) as unknown as anchor.Program<CentralizedConnection>;

  const dappProgram: anchor.Program<HelloWorld> = anchor.workspace.HelloWorld;

  const txnHelpers = new TxnHelpers(connection, wallet.payer);
  const connectionCtx = new ConnectionTestContext(connection, txnHelpers, wallet.payer);
  const xcallCtx = new XcallTestCtx(connection, txnHelpers, wallet.payer);
  const dappCtx = new DappTestCtx(connection, txnHelpers, wallet.payer);

  await dappCtx.add_connection(
    connectionCtx.dstNetworkId,
    connectionProgram.programId.toString(),
    connectionProgram.programId.toString()
  );
  await sleep(2);

  return { xcallProgram, connectionProgram, dappProgram, connection, wallet, txnHelpers, ctx: dappCtx, connectionCtx, xcallCtx };
}

async function initializeXcallProgram(xcallCtx: XcallTestCtx) {
  let networkId = "solana";

  await xcallCtx.initialize(networkId);
  await sleep(2);

  console.log("Xcall program initialized.");
}

async function initializeConnectionProgram(connectionCtx: ConnectionTestContext) {
  await connectionCtx.initialize();
  await sleep(2);

  console.log("Centralized connection program initialized.");
}

async function initializeDappProgram(dappCtx: DappTestCtx) {
  await dappCtx.initialize();
  await sleep(2);

  console.log("Hello World Dapp program initialized.");
}

async function sendMessage(dappProgram: anchor.Program<HelloWorld>, ctx: DappTestCtx, txnHelpers: TxnHelpers, xcallProgram: anchor.Program<Xcall>, connectionProgram: anchor.Program<CentralizedConnection>, wallet: anchor.Wallet, connection: anchor.web3.Connection) {
  const xcall_context = new XcallTestCtx(connection, txnHelpers, wallet.payer);

  const envelope = new Envelope(
    MessageType.CallMessage,
    new CallMessage(Buffer.from("Hello World")).encode(),
    [connectionProgram.programId.toString()],
    [wallet.publicKey.toString()]
  ).encode();

  const to = { "0": "0x3.icon/abc" };
  const msg_type = 0;
  const rollback = Buffer.from("rollback");
  const message = Buffer.from(envelope);

  const remaining_accounts = [
    {
      pubkey: SYSVAR_INSTRUCTIONS_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: XcallPDA.config().pda,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: (await xcall_context.getConfig()).feeHandler,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: xcallProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: connectionProgram.programId,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: ConnectionPDA.config().pda,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: ConnectionPDA.network_fee(ctx.networkId).pda,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: xcallProgram.programId,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: connectionProgram.programId,
      isSigner: false,
      isWritable: true,
    },
  ];

  try {
    const sendCallIx = await dappProgram.methods
      .sendCallMessage(to, message, msg_type, rollback)
      .accountsStrict({
        config: DappPDA.config().pda,
        systemProgram: SYSTEM_PROGRAM_ID,
        connectionsAccount: DappPDA.connections(ctx.networkId).pda,
        sender: wallet.payer.publicKey,
        authority: DappPDA.authority().pda,
      })
      .remainingAccounts(remaining_accounts)
      .instruction();

    const sendCallTx = await txnHelpers.buildV0Txn([sendCallIx], [wallet.payer]);
    await connection.sendTransaction(sendCallTx);

    console.log("Message sent successfully.");
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

async function setAdminAndNetworkFees(connectionCtx: ConnectionTestContext, txnHelpers: TxnHelpers) {
  let newAdmin = Keypair.generate();
  await connectionCtx.setAdmin(newAdmin);
  await sleep(2);

  let msgFee = 50;
  let resFee = 100;

  await txnHelpers.airdrop(connectionCtx.admin.publicKey, 1e9);
  await sleep(2);

  await connectionCtx.setNetworkFee(connectionCtx.dstNetworkId, msgFee, resFee);
  await sleep(2);

  console.log("Centralized-connection admin set and network fees configured.");
}

async function main() {
  const { xcallProgram, connectionProgram, dappProgram, connection, wallet, txnHelpers, ctx, connectionCtx, xcallCtx } = await initializePrograms();

  // Initialize the programs
  await initializeXcallProgram(xcallCtx);
  await initializeConnectionProgram(connectionCtx);
  await initializeDappProgram(ctx);

  // Set admin and network fees
  await setAdminAndNetworkFees(connectionCtx, txnHelpers);
  // Send a message
  await sendMessage(dappProgram, ctx, txnHelpers, xcallProgram, connectionProgram, wallet, connection);

}

main().catch((err) => console.error("Error in execution:", err));
