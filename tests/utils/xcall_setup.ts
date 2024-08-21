import * as anchor from "@coral-xyz/anchor";

import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import xcall_idl from "../target/idl/xcall.json"
import { TxnHelpers, uint128ToArray } from ".";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const xcallProgram = new anchor.Program(xcall_idl as anchor.Idl , provider);


export class XcallContext {
  networkId: string;
  dstNetworkId: string;
  connection: Connection;
  txnHelpers: TxnHelpers;

  constructor(connection: Connection, txnHelpers: TxnHelpers) {
    this.networkId = "solana";
    this.dstNetworkId = "icon";
    this.connection = connection;
    this.txnHelpers = txnHelpers;
  }

  async getConfig() {
    let { pda } = XcallPDA.config();
    return await xcallProgram.account.config.fetch(pda);
  }
}


export class XcallPDA {
  constructor() {}

  static config() {
    let [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      xcallProgram.programId
    );

    return { bump, pda };
  }

  static proxyRequest(requestId: number) {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("proxy"), uint128ToArray(requestId)],
      xcallProgram.programId
    );

    return { pda, bump };
  }

  static defaultConnection(netId: String) {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("conn"), Buffer.from(netId)],
      xcallProgram.programId
    );

    return { pda, bump };
  }

  static pendingRequest(messageBytes: Buffer) {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("req"), messageBytes],
      xcallProgram.programId
    );

    return { pda, bump };
  }

  static pendingResponse(messageBytes: Buffer) {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("res"), messageBytes],
      xcallProgram.programId
    );

    return { pda, bump };
  }

  static rollback(sequenceNo: number) {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("rollback"), uint128ToArray(sequenceNo)],
      xcallProgram.programId
    );

    return { pda, bump };
  }

  static reply() {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("reply")],
      xcallProgram.programId
    );

    return { pda, bump };
  }
}
