import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection, Keypair } from "@solana/web3.js";

import connection_idl from "../target/idl/centralized_connection.json"

import { CentralizedConnection } from "../target/types/centralized_connection";
import { TxnHelpers, uint128ToArray } from "../utils";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);


const connectionProgram = new anchor.Program(connection_idl as anchor.Idl, provider);

export class CentralizedContext {
  program: anchor.Program<CentralizedConnection>;
  connection: Connection;
  networkId: string;
  dstNetworkId: string;
  txnHelpers: TxnHelpers;

  constructor(connection: Connection, txnHelpers: TxnHelpers, admin: Keypair) {
    let provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    this.program = anchor.workspace.CentralizedConnection;
    this.connection = connection;
    this.txnHelpers = txnHelpers;
    this.networkId = "solana";
    this.dstNetworkId = "icon";
  } 
}

export class ConnectionPDA {
  constructor() {}

  static config() {
    let [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      connectionProgram.programId
    );

    return { bump, pda };
  }

  static network_fee(networkId: string) {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee"), Buffer.from(networkId)],
      connectionProgram.programId
    );

    return { pda, bump };
  }

  static claimFees() {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("claim_fees")],
      connectionProgram.programId
    );

    return { pda, bump };
  }

  static receipt(sn: number) {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("receipt"), uint128ToArray(sn)],
      connectionProgram.programId
    );

    return { pda, bump };
  }
}
