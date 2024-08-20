import * as anchor from "@project-serum/anchor";
import { Program, web3 } from "@project-serum/anchor";
import { Voting } from "../target/types/voting";

const { SystemProgram } = web3;

describe("voting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Voting as Program<Voting>;
  const user = provider.wallet;

  it("Creates a proposal", async () => {
    const proposalAccount = anchor.web3.Keypair.generate();

    await program.rpc.createProposal("Proposal Title", "Proposal Description", {
      accounts: {
        proposalAccount: proposalAccount.publicKey,
        user: user.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [proposalAccount],
    });

    const account = await program.account.proposalAccount.fetch(proposalAccount.publicKey);
    console.log("Proposal Account: ", account);
  });

  it("Votes on a proposal", async () => {
    const proposalAccount = // Fetch the proposal account public key

    await program.rpc.vote(new anchor.BN(0), true, {
      accounts: {
        proposalAccount: proposalAccount,
        user: user.publicKey,
      },
    });

    const account = await program.account.proposalAccount.fetch(proposalAccount);
    console.log("Updated Proposal Account: ", account);
  });

  it("Fetches proposals", async () => {
    const proposalAccount = // Fetch the proposal account public key

    const proposals = await program.rpc.fetchProposals({
      accounts: {
        proposalAccount: proposalAccount,
      },
    });

    console.log("Proposals: ", proposals);
  });

  it("Votes from another chain", async () => {
    const proposalAccount = // Fetch the proposal account public key
    const signature = // Signature from cross-chain messaging service

    await program.rpc.voteFromOtherChain(new anchor.BN(0), true, signature, {
      accounts: {
        proposalAccount: proposalAccount,
        signer: user.publicKey,
      },
    });

    const account = await program.account.proposalAccount.fetch(proposalAccount);
    console.log("Updated Proposal Account from Cross-Chain Vote: ", account);
  });
});
