use anchor_lang::prelude::*;

#[event]
pub struct MessageReceived {
    pub from: String,
    pub data: Vec<u8>,
}

