pub mod helpers;
use anchor_lang::{
    prelude::*,
    solana_program::{instruction::Instruction, program::invoke_signed},
};

use xcall_lib::network_address::*;

use crate::helpers::*;
use xcall_lib::message::envelope::Envelope;

declare_id!("A3mNjdSgQWg9EauiMUktr7tg6hwZZ9QqAcY4b6PdWDmN");

#[program]
pub mod hello_world {
    use super::*;

    pub fn initialize(
        ctx: Context<InitializeCtx>,
        xcall_address: Pubkey,
        network_address: NetworkAddress,
        source: String, // centralized connection contract address at source chain 
        destination: String, // centralized connection contract address at destination chain 
    ) -> Result<()> {
        ctx.accounts.config.set_inner(Config {
            xcall_address,
            network_address,
            source , 
            destination
        });
        Ok(())
    }

    pub fn send_message<'info>(
        ctx: Context<'_, '_, '_, 'info, CallMessageCtx<'info>>,
        msg: String,
    ) -> Result<()> {
        let config = &ctx.accounts.config ; 
        let xcall_address = &ctx.accounts.config.xcall_address;
        let to = &config.network_address ; 

        let source = &config.source ; 
        let destination = &config.destination ; 

        let network_address = NetworkAddress::from(to.clone());
        let _network_id = network_address.get_parts();

        let data = msg.try_to_vec()?;
        let msg_type = 0; // 0 for simple message; 1 for rollback message
        let rollback: Vec<u8> = Vec::new(); // pass rollback data in argument for rollback message type

        let message = process_message(msg_type as u8, data, rollback).unwrap();

        let envelope = Envelope {
            message,
            sources: vec![source.to_string()],
            destinations: vec![destination.to_string()],
        };

        let encoded_envelope = rlp::encode(&envelope).to_vec();

        let mut data = vec![];

        let args = SendMessageArgs {
            msg: encoded_envelope,
            to: network_address,
        };
        args.serialize(&mut data)?;
        let ix_data = get_instruction_data("send_call", data);

        let mut account_metas: Vec<AccountMeta> = vec![
            AccountMeta::new(ctx.accounts.sender.key(), true), // signer
            AccountMeta::new_readonly(ctx.accounts.system_program.key(), false), // system program
        ];

        let mut account_infos: Vec<AccountInfo> = vec![
            ctx.accounts.sender.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ];

        for (_index, account) in ctx.remaining_accounts.iter().enumerate() {
            account_metas.push(AccountMeta::new(account.key(), account.is_signer));
            account_infos.push(account.to_account_info());
        }

        let ix = Instruction {
            program_id: *xcall_address,
            accounts: account_metas,
            data: ix_data.clone(),
        };
        let signer_seeds: &[&[&[u8]]] = &[&[Config::SEED_PREFIX.as_bytes(), &[ctx.bumps.config]]];

        invoke_signed(&ix, &account_infos, signer_seeds)?;

        Ok(())
    }
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct SendMessageArgs {
    pub msg: Vec<u8>,
    pub to: NetworkAddress,
}

#[derive(Accounts)]
#[instruction(network_address: NetworkAddress )]
pub struct CallMessageCtx<'info> {
    #[account(mut , seeds=[Config::SEED_PREFIX.as_bytes()] , bump )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub sender: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeCtx<'info> {
    #[account(init , payer = signer , space = Config::MAX_SPACE , seeds   = [Config::SEED_PREFIX.as_bytes()] , bump )]
    config: Account<'info, Config>,

    #[account(mut)]
    signer: Signer<'info>,
    system_program: Program<'info, System>,
}

#[account]
pub struct Config {
    pub xcall_address: Pubkey,
    pub network_address: NetworkAddress,
    pub source: String, // centralized connection contract address at source chain 
    pub destination: String, // centralized connection contract address at destination chain 

}

impl Config {
    pub const SEED_PREFIX: &'static str = "config";
    pub const MAX_SPACE: usize = 4 + 256 + 4 + 256;
}
