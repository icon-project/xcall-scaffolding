import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection, Keypair } from "@solana/web3.js";

import { HelloWorld } from "../../target/types/hello_world";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { TxnHelpers } from "../utils";

import { Xcall } from "../../target/types/xcall";  
import { CentralizedConnection } from "../../target/types/centralized_connection";  

import xcallIdlJson from "../../target/idl/xcall.json";
import centralizedIdlJson from "../../target/idl/centralized_connection.json";


let provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
let xcallProgram: anchor.Program<Xcall> = new anchor.Program(xcallIdlJson as anchor.Idl, provider) as unknown as anchor.Program<Xcall> ;
const connectionProgram: anchor.Program<CentralizedConnection> = new anchor.Program(centralizedIdlJson as anchor.Idl, provider) as unknown as anchor.Program<CentralizedConnection> ;


const dappProgram: anchor.Program<HelloWorld> =
  anchor.workspace.HelloWorld;

export class DappContext {
  program: anchor.Program<HelloWorld>;
  signer: Keypair;
  admin: Keypair;
  connection: Connection;
  networkId: string;
  dstNetworkId: string;
  txnHelpers: TxnHelpers;
  isInitialized: boolean;

  constructor(connection: Connection, txnHelpers: TxnHelpers, admin: Keypair) {

    this.program = anchor.workspace.HelloWorld;
    this.signer = admin;
    this.admin = admin;
    this.connection = connection;
    this.txnHelpers = txnHelpers;
    this.networkId = "0x3.icon";
    this.dstNetworkId = "0x3.icon";
    this.isInitialized = false;
  }

  async initialize() {
    await this.program.methods
      .initialize(xcallProgram.programId)
      .signers([this.signer])
      .accountsStrict({
        sender: this.signer.publicKey,
        authority: DappPDA.authority().pda,
        systemProgram: SYSTEM_PROGRAM_ID,
        config: DappPDA.config().pda,
      })
      .rpc();

    this.isInitialized = true;
  }

  async add_connection(
    _networkId: string,
    src_endpoint: string,
    dst_endpoint: string
  ) {
    const result = await this.program.methods
      .addConnection(_networkId, src_endpoint, dst_endpoint)
      .accounts({
        connectionAccount: DappPDA.connections(_networkId).pda,
        sender: this.signer.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([this.admin])
      .rpc();

    return result;
  }

  async getConfig() {
    return await this.program.account.config.fetch(
      DappPDA.config().pda,
      "confirmed"
    );
  }
}

export class DappPDA {
  constructor() {}

  static config() {
    let [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      dappProgram.programId
    );

    return { bump, pda };
  }

  static connections(networkId: string) {
    const buffer1 = Buffer.from("connections");
    const buffer2 = Buffer.from(networkId);
    const seed = [buffer1, buffer2];

    const [pda, bump] = PublicKey.findProgramAddressSync(
      seed,
      dappProgram.programId
    );

    return { pda, bump };
  }

  static authority() {
    let [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("dapp_authority")],
      dappProgram.programId
    );

    return { bump, pda };
  }
}
