/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/xcall.json`.
 */
export type Xcall = {
  "address": "NKhVQnb8vybeo9dcJvUJKmxdXWAWYott5aiUKWk69ju",
  "metadata": {
    "name": "xcall",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "decodeCsMessage",
      "docs": [
        "Instruction: Decode CS Message",
        "",
        "Decodes a cross-chain message into its constituent parts.",
        "",
        "This function takes a serialized cross-chain message (`CSMessage`) and decodes it into",
        "a structured format (`CSMessageDecoded`). Depending on the message type, it will decode",
        "the message as either a `CSMessageRequest` or `CSMessageResult`. The decoded message",
        "is returned as a `CSMessageDecoded` struct, which contains either the request or the result.",
        "",
        "# Parameters",
        "- `ctx`: The context of the solana program instruction",
        "- `message`: A vector of bytes representing the serialized cross-chain message to be decoded",
        "",
        "# Returns",
        "- `Result<CSMessageDecoded>`: Returns the decoded message as a `CSMessageDecoded` struct",
        "if successful, otherwise returns an error."
      ],
      "discriminator": [
        144,
        173,
        76,
        110,
        143,
        132,
        199,
        222
      ],
      "accounts": [
        {
          "name": "systemProgram",
          "docs": [
            "The solana system program account, used for creating and managing accounts."
          ]
        }
      ],
      "args": [
        {
          "name": "message",
          "type": "bytes"
        }
      ],
      "returns": {
        "defined": {
          "name": "csMessageDecoded"
        }
      }
    },
    {
      "name": "executeCall",
      "docs": [
        "Instruction: Execute Call",
        "",
        "Executes a call of specified `req_id`.",
        "",
        "This instruction processes a call by verifying the provided data against the request's data",
        "and then invoking the `handle_call_message` instruction on the DApp. Depending on the message",
        "type, it handles the response accordingly, potentially sending a result back through the",
        "connection program.",
        "",
        "# Parameters",
        "- `ctx`: The context of the solana program instruction",
        "- `req_id`: The unique identifier for the request being processed.",
        "- `data`: The data associated with the call request, which will be verified and processed.",
        "",
        "# Returns",
        "- `Result<()>`: Returns `Ok(())` if the call was executed successfully, or an error if it failed."
      ],
      "discriminator": [
        62,
        92,
        205,
        53,
        148,
        71,
        217,
        96
      ],
      "accounts": [
        {
          "name": "signer",
          "docs": [
            "The account that signs and pays for the transaction. This account is mutable",
            "because it will be debited for any fees or rent required during the transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "The solana system program account, used for creating and managing accounts."
          ]
        },
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings and counters for the program."
          ]
        },
        {
          "name": "admin",
          "docs": [
            "it is valid."
          ],
          "writable": true
        },
        {
          "name": "proxyRequest",
          "docs": [
            "The proxy request account, identified by a request ID, which is used for executing",
            "calls. The account is closed after use, with any remaining funds sent to the `admin`."
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "reqId",
          "type": "u128"
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "executeRollback",
      "docs": [
        "Instruction: Execute Rollback",
        "",
        "Executes a rollback operation using the stored rollback data.",
        "",
        "This function initiates a rollback process by delegating to the `instructions::execute_rollback`.",
        "It handles the rollback of a operation with the specified context and sequence number.",
        "",
        "# Arguments",
        "- `ctx`: The context containing all the necessary accounts and program state.",
        "- `sn`: The sequence number associated with the rollback operation.",
        "",
        "# Returns",
        "- `Result<()>`: Returns `Ok(())` if the rollback was executed successfully, or an error if it",
        "failed."
      ],
      "discriminator": [
        10,
        217,
        27,
        106,
        53,
        35,
        82,
        17
      ],
      "accounts": [
        {
          "name": "signer",
          "docs": [
            "The account that signs and pays for the transaction. This account is mutable",
            "because it will be debited for any fees or rent required during the transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "The solana system program account, used for creating and managing accounts."
          ]
        },
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings and counters for the program."
          ]
        },
        {
          "name": "admin",
          "docs": [
            "it is valid."
          ],
          "writable": true
        },
        {
          "name": "rollbackAccount",
          "docs": [
            "The rollback account, identified by a sequence number (`sn`), used for executing rollback.",
            "The account is closed after use, with any remaining funds sent to the `admin`."
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "sn",
          "type": "u128"
        }
      ]
    },
    {
      "name": "getAdmin",
      "docs": [
        "Instruction: Get Admin",
        "",
        "Retrieves the admin public key from the configuration.",
        "",
        "This function returns the public key of the admin account, as stored in the configuration",
        "account.",
        "",
        "# Arguments",
        "- `ctx`: The context of the solana program instruction",
        "",
        "# Returns",
        "- `Result<Pubkey>`: Returns the public key of the admin account if successful,",
        "otherwise returns an error."
      ],
      "discriminator": [
        136,
        243,
        64,
        106,
        205,
        81,
        211,
        193
      ],
      "accounts": [
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings for the program."
          ]
        }
      ],
      "args": [],
      "returns": "pubkey"
    },
    {
      "name": "getFee",
      "docs": [
        "Instruction: Get Fee",
        "",
        "Calculates and retrieves the total fee for a cross-chain message, including the protocol fee",
        "and connection-specific fees.",
        "",
        "This function computes the total fee required to send a cross-chain message by adding the",
        "protocol fee stored in the configuration account and any additional fees specific to the",
        "connections used in the message.",
        "",
        "# Arguments",
        "- `ctx`: The context of the solana program instruction.",
        "- `nid`: A string representing the network ID for which the fee is being calculated.",
        "- `is_rollback`: A boolean indicating whether a rollback is required, affecting the fee.",
        "- `sources`: A vector of strings representing the source protocols involved in the transaction.",
        "",
        "# Returns",
        "- `Result<u64>`: Returns the total fee as a `u64` value if successful, otherwise returns",
        "an error."
      ],
      "discriminator": [
        115,
        195,
        235,
        161,
        25,
        219,
        60,
        29
      ],
      "accounts": [
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings for the program."
          ]
        }
      ],
      "args": [
        {
          "name": "nid",
          "type": "string"
        },
        {
          "name": "isRollback",
          "type": "bool"
        },
        {
          "name": "sources",
          "type": {
            "option": {
              "vec": "string"
            }
          }
        }
      ],
      "returns": "u64"
    },
    {
      "name": "getNetworkAddress",
      "docs": [
        "Instruction: Get Network Address",
        "",
        "Retrieves the network address from the configuration.",
        "",
        "This function constructs and returns a `NetworkAddress` based on the network ID stored",
        "in the configuration account and the program's ID.",
        "",
        "# Arguments",
        "- `ctx`: The context of the solana program instruction",
        "",
        "# Returns",
        "- `Result<NetworkAddress>`: Returns the constructed `NetworkAddress` if successful,",
        "otherwise returns an error."
      ],
      "discriminator": [
        30,
        225,
        18,
        117,
        173,
        233,
        193,
        79
      ],
      "accounts": [
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings for the program."
          ]
        }
      ],
      "args": [],
      "returns": {
        "defined": {
          "name": "networkAddress"
        }
      }
    },
    {
      "name": "getProtocolFee",
      "docs": [
        "Instruction: Get Protocol Fee",
        "",
        "Retrieves the current protocol fee from the configuration.",
        "",
        "This function returns the protocol fee amount stored in the configuration account.",
        "The protocol fee is a value used to determine the amount charged for each cross-chain",
        "message.",
        "",
        "# Arguments",
        "- `ctx`: The context of the solana program instruction",
        "",
        "# Returns",
        "- `Result<u64>`: Returns the protocol fee as a `u64` value if successful,",
        "otherwise returns an error."
      ],
      "discriminator": [
        196,
        255,
        35,
        46,
        240,
        44,
        38,
        53
      ],
      "accounts": [
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings for the program."
          ]
        }
      ],
      "args": [],
      "returns": "u64"
    },
    {
      "name": "getProtocolFeeHandler",
      "docs": [
        "Instruction: Get Protocol Fee Handler",
        "",
        "Retrieves the protocol fee handler public key from the configuration.",
        "",
        "This function returns the public key of the protocol fee handler account, as stored",
        "in the configuration account.",
        "",
        "# Arguments",
        "- `ctx`: The context of the solana program instruction",
        "",
        "# Returns",
        "- `Result<Pubkey>`: Returns the public key of the fee handler account if successful,",
        "otherwise returns an error."
      ],
      "discriminator": [
        67,
        5,
        253,
        223,
        144,
        117,
        8,
        95
      ],
      "accounts": [
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings for the program."
          ]
        }
      ],
      "args": [],
      "returns": "pubkey"
    },
    {
      "name": "handleError",
      "docs": [
        "Instruction: Handle Error",
        "",
        "Handles an error for a specific sequence of messages, enabling a rollback to revert the state.",
        "This function is called when a rollback message is received for a sequence originally sent from",
        "the Solana chain. It triggers a rollback to revert the state to the point before the error occurred.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context providing access to accounts and program state.",
        "* `sequence_no` - The unique identifier for the message sequence that encountered the error.",
        "",
        "# Returns",
        "",
        "Returns a `Result` indicating the success or failure of the rollback operation."
      ],
      "discriminator": [
        4,
        46,
        187,
        49,
        241,
        125,
        121,
        119
      ],
      "accounts": [
        {
          "name": "signer",
          "docs": [
            "The account that signs and pays for the transaction. This account is mutable",
            "because it will be debited for any fees or rent required during the transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "connection",
          "docs": [
            "The signer account representing the connection through which the message is being processed."
          ],
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "The solana system program account, used for creating and managing accounts."
          ]
        },
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings and counters for the",
            "program. This account is mutable because the last request ID of config will be updated."
          ]
        },
        {
          "name": "admin",
          "docs": [
            "it is valid."
          ],
          "writable": true
        },
        {
          "name": "rollbackAccount",
          "docs": [
            "A rollback account created when initiating a rollback message to a destination chain.",
            "This account stores crucial details about the message, which are necessary for processing",
            "the response from the destination chain. In this instruction, the `rollback_account` is",
            "used to enable and execute the rollback operation within the DApp that originally sent",
            "the message."
          ],
          "writable": true
        },
        {
          "name": "pendingResponse",
          "docs": [
            "An optional account created to track whether a response has been received from each connection",
            "specified in a message. This account is only initialized if multiple connections are used for",
            "sending and receiving messages, enhancing security by avoiding reliance on a single connection."
          ],
          "writable": true,
          "optional": true
        }
      ],
      "args": [
        {
          "name": "sequenceNo",
          "type": "u128"
        }
      ]
    },
    {
      "name": "handleForcedRollback",
      "docs": [
        "Initiates the handling of a forced rollback for a cross-chain message. This function acts",
        "as a wrapper, calling the inner `handle_forced_rollback` instruction to handle the rollback",
        "process.",
        "",
        "The rollback is triggered in response to a failure or error that occurred after a message",
        "was received on the destination chain. It allows the dApp to revert the state by sending",
        "a failure response back to the source chain, ensuring the original message is effectively",
        "rolled back.",
        "",
        "# Arguments",
        "* `ctx` - Context containing the accounts required for processing the forced rollback.",
        "* `req_id` - The unique request ID associated with the message being rolled back.",
        "",
        "# Returns",
        "* `Result<()>` - Returns `Ok(())` on successful execution, or an error if the rollback process",
        "fails."
      ],
      "discriminator": [
        233,
        139,
        22,
        8,
        52,
        93,
        188,
        123
      ],
      "accounts": [
        {
          "name": "signer",
          "docs": [
            "The account that signs and pays for the transaction. This account is mutable because",
            "it will be debited for any fees or rent required during the transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "dappAuthority",
          "docs": [
            "The account representing the dApp authority, which must sign the transaction to enforce",
            "the rollback."
          ],
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "The Solana system program account, used for creating and managing accounts."
          ]
        },
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings and counters for the program.",
            "The `seeds` and `bump` ensure that this account is securely derived."
          ]
        },
        {
          "name": "admin",
          "docs": [
            "it matches the expected admin address."
          ],
          "writable": true
        },
        {
          "name": "proxyRequest",
          "docs": [
            "The proxy request account, identified by a request ID. This account is used for executing",
            "calls and is closed after use, with any remaining funds sent to the `admin`."
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "reqId",
          "type": "u128"
        }
      ]
    },
    {
      "name": "handleMessage",
      "docs": [
        "Instruction: Handle Message",
        "",
        "Entry point for handling cross-chain messages within the xcall program.",
        "",
        "This function delegates the processing of an incoming message to the inner `handle_message`",
        "function, passing along the necessary context and message details. It determines the type of",
        "the message and invokes the appropriate logic to handle requests or responses from other",
        "chains.",
        "",
        "# Parameters",
        "- `ctx`: The context containing all necessary accounts and program-specific information.",
        "- `from_nid`: The network ID of the chain that sent the message.",
        "- `msg`: The encoded message payload received from the chain.",
        "- `sequence_no`: The sequence number associated with the message, used to track message",
        "ordering and responses.",
        "",
        "# Returns",
        "- `Result<()>`: Returns `Ok(())` if the message is successfully handled, or an error if any",
        "validation or processing fails."
      ],
      "discriminator": [
        91,
        215,
        39,
        71,
        108,
        217,
        94,
        89
      ],
      "accounts": [
        {
          "name": "signer",
          "docs": [
            "The account that signs and pays for the transaction. This account is mutable",
            "because it will be debited for any fees or rent required during the transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "connection",
          "docs": [
            "The signer account representing the connection through which the message is being processed."
          ],
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "The solana system program account, used for creating and managing accounts."
          ]
        },
        {
          "name": "admin",
          "docs": [
            "it is valid."
          ],
          "writable": true
        },
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings and counters for the program."
          ]
        },
        {
          "name": "rollbackAccount",
          "docs": [
            "An optional account that is created when sending a rollback message to a destination chain.",
            "It stores essential details related to the message, which are required to handle the response",
            "from the destination chain. The `rollback_account` is only needed if a response is expected",
            "for a specific sequence of the message that was sent from this chain."
          ],
          "optional": true
        },
        {
          "name": "pendingResponse",
          "docs": [
            "An optional account created to track whether a response has been received from each connection",
            "specified in a message. This account is only initialized if multiple connections are used for",
            "sending and receiving messages, enhancing security by avoiding reliance on a single connection."
          ],
          "writable": true,
          "optional": true
        }
      ],
      "args": [
        {
          "name": "fromNid",
          "type": "string"
        },
        {
          "name": "msg",
          "type": "bytes"
        },
        {
          "name": "sequenceNo",
          "type": "u128"
        }
      ]
    },
    {
      "name": "handleRequest",
      "docs": [
        "Instruction: Handle Request",
        "",
        "Invokes the inner `handle_request` function to process an incoming cross-chain request.",
        "",
        "This instruction is specifically designed to be called by the xcall program. It delegates",
        "the processing of the request message to the inner `handle_request` function, passing",
        "along the necessary context and message payload.",
        "",
        "# Parameters",
        "- `ctx`: Context containing all relevant accounts and program-specific information.",
        "- `from_nid`: Network ID of the chain that sent the request.",
        "- `msg_payload`: Encoded payload of the request message.",
        "",
        "# Returns",
        "- `Result<()>`: Returns `Ok(())` if the request is processed successfully, or an error if",
        "validation or processing fails."
      ],
      "discriminator": [
        94,
        58,
        189,
        246,
        63,
        91,
        40,
        241
      ],
      "accounts": [
        {
          "name": "signer",
          "docs": [
            "The account that signs and pays for the transaction. This account is mutable",
            "because it will be debited for any fees or rent required during the transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "connection",
          "docs": [
            "The signer account representing the connection through which the message is being processed."
          ],
          "signer": true
        },
        {
          "name": "xcall",
          "docs": [
            "The xcall signer account, used to verify that the provided signer is authorized",
            "by the xcall program."
          ],
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "The solana system program account, used for creating and managing accounts."
          ]
        },
        {
          "name": "admin",
          "docs": [
            "it is valid."
          ],
          "writable": true
        },
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings and counters for the program.",
            "This account is mutable because the request sequence may be updated during instruction",
            "processing"
          ],
          "writable": true
        },
        {
          "name": "proxyRequest",
          "docs": [
            "Stores details of each cross-chain message request sent from the source to the destination chain."
          ],
          "writable": true
        },
        {
          "name": "pendingRequest",
          "docs": [
            "Tracks the receipt of requests from a multi-connection message. This account is optional and",
            "only created if multiple connections are used to send a message, ensuring the request is fully",
            "received."
          ],
          "writable": true,
          "optional": true
        }
      ],
      "args": [
        {
          "name": "fromNid",
          "type": "string"
        },
        {
          "name": "msgPayload",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "handleResult",
      "docs": [
        "Instruction: Handle Result",
        "",
        "Invokes the inner `handle_result` function to process an incoming cross-chain result.",
        "",
        "This instruction is specifically designed to be called by the xcall program. It forwards",
        "the result message along with its associated sequence number to the inner `handle_result`",
        "function for further processing.",
        "",
        "# Parameters",
        "- `ctx`: Context containing all relevant accounts and program-specific information.",
        "- `from_nid`: Network ID of the chain that sent the result.",
        "- `msg_payload`: Encoded payload of the result message.",
        "- `sequence_no`: Unique sequence number of the result message.",
        "",
        "# Returns",
        "- `Result<()>`: Returns `Ok(())` if the result is processed successfully, or an error if",
        "validation or processing fails."
      ],
      "discriminator": [
        89,
        67,
        72,
        120,
        78,
        209,
        249,
        144
      ],
      "accounts": [
        {
          "name": "signer",
          "docs": [
            "The account that signs and pays for the transaction. This account is mutable",
            "because it will be debited for any fees or rent required during the transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "connection",
          "docs": [
            "The signer account representing the connection through which the message is being processed."
          ],
          "signer": true
        },
        {
          "name": "xcall",
          "docs": [
            "The xcall signer account, used to verify that the provided signer is authorized",
            "by the xcall program."
          ],
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "The solana system program account, used for creating and managing accounts."
          ]
        },
        {
          "name": "admin",
          "docs": [
            "it is valid."
          ],
          "writable": true
        },
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings and counters for the program.",
            "This account is mutable because the request sequence may be updated during instruction",
            "processing"
          ],
          "writable": true
        },
        {
          "name": "rollbackAccount",
          "docs": [
            "A rollback account created when sending a rollback message to a destination chain.",
            "It stores essential details related to the message, necessary for handling the response",
            "from the destination chain. The `rollback_account` is required only if a response is",
            "expected for a specific sequence of the message sent from this chain."
          ],
          "writable": true
        },
        {
          "name": "proxyRequest",
          "docs": [
            "Stores details of each cross-chain message request sent from the source to the destination",
            "chain."
          ],
          "writable": true,
          "optional": true
        },
        {
          "name": "successfulResponse",
          "docs": [
            "Stores details of a successful response received from the destination chain. This account",
            "is optional and created only when a successful response is expected for a specific sequence",
            "number."
          ],
          "writable": true,
          "optional": true
        }
      ],
      "args": [
        {
          "name": "fromNid",
          "type": "string"
        },
        {
          "name": "msgPayload",
          "type": "bytes"
        },
        {
          "name": "sequenceNo",
          "type": "u128"
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Instruction: Initialize",
        "",
        "Initializes the initial program configuration",
        "",
        "This function sets up the initial configuration for the program, including specifying",
        "the network ID.",
        "",
        "# Arguments",
        "- `ctx`: The context of the solana program instruction",
        "- `network_id`: A string representing the network ID to be set in the configuration.",
        "",
        "# Returns",
        "- `Result<()>`: Returns `Ok(())` if the initialization is successful, otherwise returns an",
        "error."
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings for the program.",
            "This account is initialized only once during the lifetime of program and it will",
            "throw error if tries to initialize twice"
          ],
          "writable": true
        },
        {
          "name": "signer",
          "docs": [
            "The account that signs and pays for the transaction. This account is mutable",
            "because it will be debited for any fees or rent required during the transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "The solana system program account, used for creating and managing accounts."
          ]
        }
      ],
      "args": [
        {
          "name": "networkId",
          "type": "string"
        }
      ]
    },
    {
      "name": "queryExecuteCallAccounts",
      "discriminator": [
        82,
        113,
        205,
        53,
        82,
        243,
        72,
        56
      ],
      "accounts": [
        {
          "name": "config"
        },
        {
          "name": "proxyRequest"
        }
      ],
      "args": [
        {
          "name": "reqId",
          "type": "u128"
        },
        {
          "name": "data",
          "type": "bytes"
        },
        {
          "name": "page",
          "type": "u8"
        },
        {
          "name": "limit",
          "type": "u8"
        }
      ],
      "returns": {
        "defined": {
          "name": "queryAccountsPaginateResponse"
        }
      }
    },
    {
      "name": "queryExecuteRollbackAccounts",
      "discriminator": [
        43,
        155,
        204,
        24,
        84,
        216,
        145,
        0
      ],
      "accounts": [
        {
          "name": "config"
        },
        {
          "name": "rollbackAccount"
        }
      ],
      "args": [
        {
          "name": "sn",
          "type": "u128"
        },
        {
          "name": "page",
          "type": "u8"
        },
        {
          "name": "limit",
          "type": "u8"
        }
      ],
      "returns": {
        "defined": {
          "name": "queryAccountsPaginateResponse"
        }
      }
    },
    {
      "name": "queryHandleErrorAccounts",
      "discriminator": [
        98,
        141,
        172,
        5,
        11,
        253,
        99,
        37
      ],
      "accounts": [
        {
          "name": "config"
        },
        {
          "name": "rollbackAccount"
        }
      ],
      "args": [
        {
          "name": "sequenceNo",
          "type": "u128"
        }
      ],
      "returns": {
        "defined": {
          "name": "queryAccountsResponse"
        }
      }
    },
    {
      "name": "queryHandleMessageAccounts",
      "discriminator": [
        53,
        169,
        102,
        122,
        204,
        60,
        45,
        187
      ],
      "accounts": [
        {
          "name": "config"
        },
        {
          "name": "rollbackAccount",
          "optional": true
        }
      ],
      "args": [
        {
          "name": "fromNid",
          "type": "string"
        },
        {
          "name": "msg",
          "type": "bytes"
        },
        {
          "name": "sequenceNo",
          "type": "u128"
        }
      ],
      "returns": {
        "defined": {
          "name": "queryAccountsResponse"
        }
      }
    },
    {
      "name": "sendCall",
      "docs": [
        "Instruction: Send Call",
        "",
        "Sends a cross-chain message to a specified network address.",
        "",
        "This function handles encoding, validation, and sending of a cross-chain message.",
        "It also manages the creation of a rollback account if needed and emits an event upon successful",
        "sending",
        "",
        "# Arguments",
        "- `ctx`: The context of the solana program instruction",
        "- `message`: The `Envelope` payload, encoded as rlp bytes",
        "- `to`: The target network address where the message is to be sent",
        "",
        "# Returns",
        "- `Result<u128>`: The sequence number of the message if successful, wrapped in a `Result`."
      ],
      "discriminator": [
        254,
        95,
        190,
        68,
        194,
        140,
        28,
        103
      ],
      "accounts": [
        {
          "name": "signer",
          "docs": [
            "The account that signs and pays for the transaction. This account is mutable",
            "because it will be debited for any fees or rent required during the transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "dappAuthority",
          "signer": true,
          "optional": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "The solana system program account, used for creating and managing accounts."
          ]
        },
        {
          "name": "instructionSysvar",
          "docs": [
            "program invocation. This account is an unchecked account because the constraints are",
            "verified within the account trait."
          ]
        },
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings and counters for the",
            "program. This account is mutable because the sequence number for messages will be updated."
          ],
          "writable": true
        },
        {
          "name": "feeHandler",
          "docs": [
            "against the `config.fee_handler` to ensure it is valid. This is a safe unchecked account",
            "because the validity of the fee handler is verified during instruction execution"
          ],
          "writable": true
        },
        {
          "name": "rollbackAccount",
          "docs": [
            "An optional rollback account that stores information for undoing the effects of the call",
            "if needed. The account is initialized when necessary, with the `signer` paying for its",
            "creation."
          ],
          "writable": true,
          "optional": true
        }
      ],
      "args": [
        {
          "name": "envelope",
          "type": "bytes"
        },
        {
          "name": "to",
          "type": {
            "defined": {
              "name": "networkAddress"
            }
          }
        }
      ],
      "returns": "u128"
    },
    {
      "name": "setAdmin",
      "docs": [
        "Instruction: Set Admin",
        "",
        "Sets a new admin account in the configuration.",
        "",
        "This function updates the admin account in the program’s configuration. Only the current",
        "admin (as verified by the context) can change the admin account.",
        "",
        "# Arguments",
        "- `ctx`: The context of the solana program instruction",
        "- `account`: The public key of the new admin account to be set.",
        "",
        "# Returns",
        "- `Result<()>`: Returns `Ok(())` if the admin account is successfully updated, otherwise",
        "returns an error."
      ],
      "discriminator": [
        251,
        163,
        0,
        52,
        91,
        194,
        187,
        92
      ],
      "accounts": [
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings for the program.",
            "This account is mutable because the admin of the program will be updated."
          ],
          "writable": true
        },
        {
          "name": "admin",
          "docs": [
            "The account that signs and pays for the transaction. This account is checked",
            "against the `config.admin` to ensure it is valid."
          ],
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "account",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "setProtocolFee",
      "docs": [
        "Instruction: Set Protocol Fee",
        "",
        "Sets the protocol fee in the configuration account.",
        "",
        "This function verifies that the signer is an admin, and updates the protocol fee in the",
        "program's configuration account. The protocol fee is the amount charged for each",
        "cross-chain message sent.",
        "",
        "# Arguments",
        "- `ctx`: The context of the solana program instruction",
        "- `fee`: The new protocol fee to be set, specified as a `u64` value.",
        "",
        "# Returns",
        "- `Result<()>`: Returns `Ok(())` if the protocol fee is successfully set, otherwise returns",
        "an error."
      ],
      "discriminator": [
        173,
        239,
        83,
        242,
        136,
        43,
        144,
        217
      ],
      "accounts": [
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings for the program.",
            "This account is mutable because the fee handler of the protocol will be updated."
          ],
          "writable": true
        },
        {
          "name": "admin",
          "docs": [
            "The account that signs and pays for the transaction. This account is checked",
            "against the `config.admin` to ensure it is valid."
          ],
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "fee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setProtocolFeeHandler",
      "docs": [
        "Instruction: Set Protocol Fee Handler",
        "",
        "Sets the specified pubkey as a protocol fee handler",
        "",
        "This function verifies that the signer is an admin of the program and sets `fee_handler` as",
        "a protocol fee handler. Typically, this is a designated fee collector or treasury account",
        "",
        "# Arguments",
        "- `ctx`: The context of the solana program instruction",
        "- `fee_handler`: The pubkey of the new fee handler.",
        "",
        "# Returns",
        "- `Result<()>`: Returns `Ok(())` if the transaction is successful, or an error if it fails."
      ],
      "discriminator": [
        77,
        67,
        152,
        114,
        71,
        111,
        125,
        231
      ],
      "accounts": [
        {
          "name": "config",
          "docs": [
            "The configuration account, which stores important settings for the program.",
            "This account is mutable because the fee handler of the protocol will be updated."
          ],
          "writable": true
        },
        {
          "name": "admin",
          "docs": [
            "The account that signs and pays for the transaction. This account is checked",
            "against the `config.admin` to ensure it is valid."
          ],
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "feeHandler",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "pendingRequest",
      "discriminator": [
        200,
        54,
        139,
        59,
        132,
        71,
        165,
        140
      ]
    },
    {
      "name": "pendingResponse",
      "discriminator": [
        208,
        29,
        212,
        56,
        57,
        21,
        102,
        91
      ]
    },
    {
      "name": "proxyRequest",
      "discriminator": [
        218,
        221,
        67,
        191,
        4,
        58,
        233,
        238
      ]
    },
    {
      "name": "rollbackAccount",
      "discriminator": [
        134,
        57,
        189,
        69,
        204,
        145,
        207,
        114
      ]
    },
    {
      "name": "successfulResponse",
      "discriminator": [
        159,
        124,
        99,
        153,
        111,
        205,
        107,
        247
      ]
    }
  ],
  "events": [
    {
      "name": "callExecuted",
      "discriminator": [
        237,
        120,
        238,
        142,
        189,
        37,
        65,
        128
      ]
    },
    {
      "name": "callMessage",
      "discriminator": [
        125,
        100,
        225,
        111,
        72,
        201,
        186,
        123
      ]
    },
    {
      "name": "callMessageSent",
      "discriminator": [
        255,
        161,
        224,
        203,
        154,
        117,
        117,
        126
      ]
    },
    {
      "name": "responseMessage",
      "discriminator": [
        125,
        230,
        224,
        74,
        135,
        185,
        132,
        218
      ]
    },
    {
      "name": "rollbackExecuted",
      "discriminator": [
        50,
        154,
        60,
        223,
        193,
        198,
        62,
        240
      ]
    },
    {
      "name": "rollbackMessage",
      "discriminator": [
        207,
        120,
        146,
        208,
        75,
        64,
        28,
        168
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "onlyAdmin",
      "msg": "Only Admin"
    },
    {
      "code": 6001,
      "name": "invalidAdminKey",
      "msg": "Invalid admin key"
    },
    {
      "code": 6002,
      "name": "invalidFeeHandler",
      "msg": "Invalid few handler"
    },
    {
      "code": 6003,
      "name": "invalidSigner",
      "msg": "Invalid signer"
    },
    {
      "code": 6004,
      "name": "maxRollbackSizeExceeded",
      "msg": "Maximum rollback data size exceeded"
    },
    {
      "code": 6005,
      "name": "invalidSn",
      "msg": "Invalid SN"
    },
    {
      "code": 6006,
      "name": "rollbackNotEnabled",
      "msg": "Rollback not enabled"
    },
    {
      "code": 6007,
      "name": "maxDataSizeExceeded",
      "msg": "Maximum data size exceeded"
    },
    {
      "code": 6008,
      "name": "dappAuthorityNotProvided",
      "msg": "Dapp authority not provided"
    },
    {
      "code": 6009,
      "name": "protocolMismatch",
      "msg": "Protocol mismatch"
    },
    {
      "code": 6010,
      "name": "sourceProtocolsNotSpecified",
      "msg": "Source protocols not specified"
    },
    {
      "code": 6011,
      "name": "destinationProtocolsNotSpecified",
      "msg": "Destination protocols not specified"
    },
    {
      "code": 6012,
      "name": "rollbackNotPossible",
      "msg": "Rollback not possible"
    },
    {
      "code": 6013,
      "name": "callRequestNotFound",
      "msg": "Call request not found"
    },
    {
      "code": 6014,
      "name": "noRollbackData",
      "msg": "No rollback data"
    },
    {
      "code": 6015,
      "name": "revertFromDapp",
      "msg": "Revert from dapp"
    },
    {
      "code": 6016,
      "name": "invalidReplyReceived",
      "msg": "Invalid reply received"
    },
    {
      "code": 6017,
      "name": "decodeFailed",
      "msg": "Decode failed"
    },
    {
      "code": 6018,
      "name": "invalidSource",
      "msg": "Invalid source"
    },
    {
      "code": 6019,
      "name": "invalidRequestId",
      "msg": "Invalid request id"
    },
    {
      "code": 6020,
      "name": "dataMismatch",
      "msg": "Data mismatch"
    },
    {
      "code": 6021,
      "name": "invalidPubkey",
      "msg": "Invalid pubkey"
    },
    {
      "code": 6022,
      "name": "invalidResponse",
      "msg": "Invalid response from dapp"
    },
    {
      "code": 6023,
      "name": "requestPending",
      "msg": "Request is still pending"
    },
    {
      "code": 6024,
      "name": "proxyRequestAccountNotSpecified",
      "msg": "Proxy request account is not specified"
    },
    {
      "code": 6025,
      "name": "proxyRequestAccountMustNotBeSpecified",
      "msg": "Proxy request account must not be specified"
    },
    {
      "code": 6026,
      "name": "rollbackAccountNotSpecified",
      "msg": "Rollback account is not specified"
    },
    {
      "code": 6027,
      "name": "rollbackAccountMustNotBeSpecified",
      "msg": "Rollback account must not be specified"
    },
    {
      "code": 6028,
      "name": "pendingRequestAccountNotSpecified",
      "msg": "Pending request account is not specified"
    },
    {
      "code": 6029,
      "name": "pendingRequestAccountMustNotBeSpecified",
      "msg": "Pending request account must not be specified"
    },
    {
      "code": 6030,
      "name": "pendingResponseAccountNotSpecified",
      "msg": "Pending response account is not specified"
    },
    {
      "code": 6031,
      "name": "pendingResponseAccountMustNotBeSpecified",
      "msg": "Pending response account must not be specified"
    },
    {
      "code": 6032,
      "name": "successfulResponseAccountNotSpecified",
      "msg": "Successful response account is not specified"
    },
    {
      "code": 6033,
      "name": "successfulResponseAccountMustNotBeSpecified",
      "msg": "Successful response account must not be specified"
    }
  ],
  "types": [
    {
      "name": "accountMetadata",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pubkey",
            "type": "pubkey"
          },
          {
            "name": "isWritable",
            "type": "bool"
          },
          {
            "name": "isSigner",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "csMessageDecoded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "messageType",
            "type": {
              "defined": {
                "name": "csMessageType"
              }
            }
          },
          {
            "name": "request",
            "type": {
              "option": {
                "defined": {
                  "name": "csMessageRequest"
                }
              }
            }
          },
          {
            "name": "result",
            "type": {
              "option": {
                "defined": {
                  "name": "csMessageResult"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "csMessageRequest",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "from",
            "type": {
              "defined": {
                "name": "networkAddress"
              }
            }
          },
          {
            "name": "to",
            "type": "string"
          },
          {
            "name": "sequenceNo",
            "type": "u128"
          },
          {
            "name": "msgType",
            "type": {
              "defined": {
                "name": "messageType"
              }
            }
          },
          {
            "name": "data",
            "type": "bytes"
          },
          {
            "name": "protocols",
            "type": {
              "vec": "string"
            }
          }
        ]
      }
    },
    {
      "name": "csMessageResult",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sequenceNo",
            "type": "u128"
          },
          {
            "name": "responseCode",
            "type": {
              "defined": {
                "name": "csResponseType"
              }
            }
          },
          {
            "name": "message",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "csMessageType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "csMessageRequest"
          },
          {
            "name": "csMessageResult"
          }
        ]
      }
    },
    {
      "name": "csResponseType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "csResponseFailure"
          },
          {
            "name": "csResponseSuccess"
          }
        ]
      }
    },
    {
      "name": "callExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "reqId",
            "type": "u128"
          },
          {
            "name": "code",
            "type": "u8"
          },
          {
            "name": "msg",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "callMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "from",
            "type": "string"
          },
          {
            "name": "to",
            "type": "string"
          },
          {
            "name": "sn",
            "type": "u128"
          },
          {
            "name": "reqId",
            "type": "u128"
          },
          {
            "name": "data",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "callMessageSent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "from",
            "type": "pubkey"
          },
          {
            "name": "to",
            "type": "string"
          },
          {
            "name": "sn",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "feeHandler",
            "type": "pubkey"
          },
          {
            "name": "networkId",
            "type": "string"
          },
          {
            "name": "protocolFee",
            "type": "u64"
          },
          {
            "name": "sequenceNo",
            "type": "u128"
          },
          {
            "name": "lastReqId",
            "type": "u128"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "messageType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "callMessage"
          },
          {
            "name": "callMessageWithRollback"
          },
          {
            "name": "callMessagePersisted"
          }
        ]
      }
    },
    {
      "name": "networkAddress",
      "type": {
        "kind": "struct",
        "fields": [
          "string"
        ]
      }
    },
    {
      "name": "pendingRequest",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sources",
            "type": {
              "vec": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "pendingResponse",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sources",
            "type": {
              "vec": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "proxyRequest",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "req",
            "type": {
              "defined": {
                "name": "csMessageRequest"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "queryAccountsPaginateResponse",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "accounts",
            "type": {
              "vec": {
                "defined": {
                  "name": "accountMetadata"
                }
              }
            }
          },
          {
            "name": "totalAccounts",
            "type": "u8"
          },
          {
            "name": "limit",
            "type": "u8"
          },
          {
            "name": "page",
            "type": "u8"
          },
          {
            "name": "hasNextPage",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "queryAccountsResponse",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "accounts",
            "type": {
              "vec": {
                "defined": {
                  "name": "accountMetadata"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "responseMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "code",
            "type": "u8"
          },
          {
            "name": "sn",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "rollback",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "from",
            "type": "pubkey"
          },
          {
            "name": "to",
            "type": {
              "defined": {
                "name": "networkAddress"
              }
            }
          },
          {
            "name": "enabled",
            "type": "bool"
          },
          {
            "name": "rollback",
            "type": "bytes"
          },
          {
            "name": "protocols",
            "type": {
              "vec": "string"
            }
          }
        ]
      }
    },
    {
      "name": "rollbackAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rollback",
            "type": {
              "defined": {
                "name": "rollback"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "rollbackExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sn",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "rollbackMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sn",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "successfulResponse",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "success",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
