use cosmwasm_schema::{cw_serde, QueryResponses};
use cw_xcall_lib::network_address::NetworkAddress;

#[cw_serde]
pub struct InstantiateMsg {
    pub xcall_address: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    SendCallMessage {
        to: NetworkAddress,
        data: Vec<u8>,
        rollback: Option<Vec<u8>>,
    },
    HandleCallMessage {
        from: NetworkAddress,
        data: Vec<u8>,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {}

#[cw_serde]
pub enum XCallQueryMsg {
    GetNetworkAddress {},
}
