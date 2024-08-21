import * as anchor from "@coral-xyz/anchor";
import { XcallContext, XcallPDA } from "./utils/xcall_setup";
import { ConnectionPDA } from "./utils/centralized_setup";
import connection_idl from "./target/idl/centralized_connection.json";

import { HelloWorldContext, HelloWorldPDA } from "../tests/setup";
import { TxnHelpers } from "../tests/utils";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { HelloWorld } from "../target/types/hello_world";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const connectionProgram = new anchor.Program(
  connection_idl as anchor.Idl,
  provider
);

const helloWorldProgram: anchor.Program<HelloWorld> =
  anchor.workspace.HelloWorld;

describe("Hello World", () => {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  const wallet = provider.wallet as anchor.Wallet;

  let txnHelpers = new TxnHelpers(connection, wallet.payer);
  let ctx = new HelloWorldContext(connection, txnHelpers, wallet.payer);

  it("Should initialize", async () => {
    // await ctx.initialize();
    const source = ctx.source;
    const fetch_source = await ctx.getConfig();
    console.log(source, fetch_source);
  });

  it("should send message", async () => {
    const xcall_program_id = ctx.xcall_program_id;

    let xcall_context = new XcallContext(connection, txnHelpers);

    let remaining_accounts = [
      {
        pubkey: XcallPDA.config().pda,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: XcallPDA.reply().pda,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: XcallPDA.defaultConnection(xcall_context.dstNetworkId).pda,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: (await xcall_context.getConfig()).feeHandler,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: XcallPDA.rollback(
          (await xcall_context.getConfig()).sequenceNo.toNumber() + 1
        ).pda,
        isSigner: false,
        isWritable: true,
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
        pubkey: ConnectionPDA.claimFees().pda,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: xcall_program_id,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: connectionProgram.programId,
        isSigner: false,
        isWritable: true,
      },
    ];

    let sendCallIx = await helloWorldProgram.methods
      .sendMessage("send this message cross chain")
      .accountsStrict({
        config: HelloWorldPDA.config().pda,
        systemProgram: SYSTEM_PROGRAM_ID,
        sender: wallet.payer.publicKey,
      })
      .remainingAccounts(remaining_accounts)
      .instruction();

    let sendCallTx = await txnHelpers.buildV0Txn([sendCallIx], [wallet.payer]);

    let sendCallTxSignature = await connection.sendTransaction(sendCallTx);
  });
});
