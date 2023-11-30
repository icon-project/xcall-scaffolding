use std::str::from_utf8;

#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_json_binary, Binary, CosmosMsg, Deps, DepsMut, Empty, Env, Event, MessageInfo, Response,
    StdResult, WasmMsg,
};
use cw2::set_contract_version;
use cw_xcall_lib::network_address::NetworkAddress;
use cw_xcall_lib::xcall_msg::ExecuteMsg as XCallExecuteMsg;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::state::XCALL_ADDRESS;

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:hello-world";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    let xcall_address = deps
        .api
        .addr_validate(&msg.xcall_address)
        .map_err(ContractError::Std)?;
    XCALL_ADDRESS
        .save(deps.storage, &xcall_address)
        .map_err(ContractError::Std)?;
    Ok(Response::new())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::SendCallMessage { to, data, rollback } => {
            send_call_message(deps, info, to, data, rollback)
        }
        ExecuteMsg::HandleCallMessage { from, data } => handle_call_message(deps, info, from, data),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(_deps: Deps, _env: Env, _msg: QueryMsg) -> StdResult<Binary> {
    unimplemented!()
}

pub fn send_call_message(
    deps: DepsMut,
    info: MessageInfo,
    to: NetworkAddress,
    data: Vec<u8>,
    rollback: Option<Vec<u8>>,
) -> Result<Response, ContractError> {
    let xcall_address = XCALL_ADDRESS.load(deps.as_ref().storage)?;

    let msg = XCallExecuteMsg::SendCallMessage {
        to,
        data,
        sources: None,
        destinations: None,
        rollback,
    };
    let message: CosmosMsg<Empty> = CosmosMsg::Wasm(WasmMsg::Execute {
        contract_addr: xcall_address.to_string(),
        msg: to_json_binary(&msg).unwrap(),
        funds: info.funds,
    });

    Ok(Response::new()
        .add_attribute("Action", "SendMessage")
        .add_message(message))
}

pub fn handle_call_message(
    deps: DepsMut,
    info: MessageInfo,
    from: NetworkAddress,
    data: Vec<u8>,
) -> Result<Response, ContractError> {
    let caller = info.sender;
    let xcall_address = XCALL_ADDRESS.load(deps.as_ref().storage)?;
    let payload = from_utf8(&data).map_err(|e| ContractError::DecodeError {
        error: e.to_string(),
    })?;
    if caller != xcall_address {
        return Err(ContractError::Unauthorized {});
    }
    let mut response = Response::new();
    // The following event is raised to notify that a message has been received
    response = response.add_event(event_message_received(&from.to_string(), payload));
    if payload == "ExecuteRollback" {
        // Setup any required logic to handle the rollback here
        response = response.add_event(event_rollbackdata_received(&from.to_string(), payload));
    }

    Ok(response)
}

pub fn event_message_received(from: &str, data: &str) -> Event {
    Event::new("MessageReceived")
        .add_attribute("from", from)
        .add_attribute("data", data)
}

pub fn event_rollbackdata_received(from: &str, data: &str) -> Event {
    Event::new("RollbackDataReceived")
        .add_attribute("from", from)
        .add_attribute("data", data)
}

#[cfg(test)]
mod tests {}
