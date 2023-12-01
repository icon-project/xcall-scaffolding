use cosmwasm_std::Addr;
use cw_storage_plus::Item;

pub const XCALL_ADDRESS: Item<Addr> = Item::new("XCALL_ADDRESS");
