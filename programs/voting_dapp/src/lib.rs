use anchor_lang::prelude::*;
use xcall_lib::network_address::NetworkAddress;
declare_id!("DyBuFmULF32if3fC3VQH382RifBDadWST38o8JP2BmQk");

#[program]
mod voting {
    use core::str;

    use super::*;
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
    ) -> Result<()> {
        let proposal = Proposal {
            title,
            description,
            proposer: *ctx.accounts.user.key,
            yes_votes: 0,
            no_votes: 0,
        };
        let proposal_account = &mut ctx.accounts.proposal_account;
        proposal_account.proposals.push(proposal);
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, proposal_index: u64, vote: bool) -> Result<()> {
        let proposal_account = &mut ctx.accounts.proposal_account;
        let proposal = &mut proposal_account.proposals[proposal_index as usize];

        if vote {
            proposal.yes_votes += 1;
        } else {
            proposal.no_votes += 1;
        }

        Ok(())
    }
 
//  call this function from other chain to add "yes" vote to "proposal index" in data param
    pub fn handle_call_message(
        ctx: Context<CrossChainVoting>,
        _from: NetworkAddress,
        data: Vec<u8>,
        _protocols: Option<Vec<String>>,
    ) -> Result<()> {

        let proposal_index_data = str::from_utf8(&data).unwrap();
        let proposal_index = proposal_index_data.parse::<u8>().unwrap();
        let proposal_account = &mut ctx.accounts.proposal_account;
        let proposal = &mut proposal_account.proposals[proposal_index as usize];

        proposal.yes_votes += 1;

        Ok(())
    }

    pub fn fetch_proposals(ctx: Context<FetchProposals>) -> Result<Vec<Proposal>> {
        let proposal_account = &ctx.accounts.proposal_account;
        Ok(proposal_account.proposals.clone())
    }
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(init, payer = user, space = 8 + 1024)]
    pub proposal_account: Account<'info, ProposalAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub proposal_account: Account<'info, ProposalAccount>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct FetchProposals<'info> {
    pub proposal_account: Account<'info, ProposalAccount>,
}

#[derive(Accounts)]
pub struct CrossChainVoting<'info> {
    #[account(mut)]
    pub proposal_account: Account<'info, ProposalAccount>,
    pub signer: Signer<'info>,
}

#[account]
pub struct ProposalAccount {
    pub proposals: Vec<Proposal>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Proposal {
    pub title: String,
    pub description: String,
    pub proposer: Pubkey,
    pub yes_votes: u64,
    pub no_votes: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid signature for cross-chain vote.")]
    InvalidSignature,
}
