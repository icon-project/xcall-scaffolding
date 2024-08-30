use anchor_lang::prelude::*;
use xcall_lib::{network_address::*, query_account_type::QueryAccountsResponse, xcall_dapp_type};

pub mod constants;
pub mod error;
pub mod event;
pub mod helpers;
pub mod instructions;
pub mod state;
pub mod xcall;

use error::*;
use instructions::*;
use state::*;

declare_id!("Hwi5JUPCFhgZ42rPmCKQ7FcqShr69Sapu5DRc3jc98kN");

#[program]
pub mod hello_world {
    use super::*;

    pub fn initialize(ctx: Context<InitializeCtx>, xcall_address: Pubkey) -> Result<()> {
        ctx.accounts.config.set_inner(Config {
            xcall_address,
            sn: 0,
            bump: ctx.bumps.config,
        });
        ctx.accounts.authority.set_inner(Authority {
            bump: ctx.bumps.authority,
        });
        Ok(())
    }

    pub fn send_call_message<'info>(
        ctx: Context<'_, '_, '_, 'info, CallMessageCtx<'info>>,
        to: NetworkAddress,
        data: Vec<u8>,
        msg_type: u32,
        rollback: Vec<u8>,
    ) -> Result<()> {
        let _ = instructions::send_message::send_message(ctx, to, data, msg_type, rollback);
        Ok(())
    }

    pub fn add_connection(
        ctx: Context<AddConnectionCtx>,
        network_id: String,
        src_endpoint: String,
        dst_endpoint: String,
    ) -> Result<()> {
        instructions::send_message::add_connection(ctx, network_id, src_endpoint, dst_endpoint)?;
        Ok(())
    }
}
