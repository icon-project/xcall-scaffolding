use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Storage};
use cw_storage_plus::Item;

use crate::ContractError;

pub const XCALL_ADDRESS: Item<Addr> = Item::new("XCALL_ADDRESS");
