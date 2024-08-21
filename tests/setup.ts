import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import { HelloWorld } from "../target/types/hello_world";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { TxnHelpers } from "../tests/utils";

const helloWorldProgram: anchor.Program<HelloWorld> =
  anchor.workspace.hello_world;

export class HelloWorldContext {
  program: anchor.Program<HelloWorld>;
  signer: Keypair;
  admin: Keypair;
  connection: Connection;
  networkId: string;
  txnHelpers: TxnHelpers;
  isInitialized: boolean;
  xcall_program_id: PublicKey;
  source: string;
  destination: string;

  constructor(connection: Connection, txnHelpers: TxnHelpers, admin: Keypair) {
    let provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    this.program = anchor.workspace.hello_world;
    this.signer = admin;
    this.admin = admin;
    this.connection = connection;
    this.txnHelpers = txnHelpers;
    this.networkId = "solana";
    this.isInitialized = false;
    this.xcall_program_id = new PublicKey("GzoCoosp8fJg7Qci1HbywnSCVr3RVcngBtB5MTUD8vuf");
    this.source = "A3mNjdSgQWg9EauiMUktr7tg6hwZZ9QqAcY4b6PdWDmN";
    this.destination = "A3mNjdSgQWg9EauiMUktr7tg6hwZZ9QqAcY4b6PdWDmN";
  }

  async initialize() {
    const networkAddress = { "0": "solana/abc" };
    await this.program.methods
      .initialize(
        this.xcall_program_id,
        networkAddress,
        this.source,
        this.destination
      )
      .signers([this.signer])
      .accountsStrict({
        signer: this.signer.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
        config: HelloWorldPDA.config().pda,
      })
      .rpc();

    this.isInitialized = true;
  }

  async getConfig() {
    return await this.program.account.config.fetch(
      HelloWorldPDA.config().pda,
      "confirmed"
    );
  }
}

export class HelloWorldPDA {
  constructor() {}

   static config() {
    let [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      helloWorldProgram.programId
    );

    return { bump, pda };
  }
}


