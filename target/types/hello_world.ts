/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/hello_world.json`.
 */
export type HelloWorld = {
  "address": "Hwi5JUPCFhgZ42rPmCKQ7FcqShr69Sapu5DRc3jc98kN",
  "metadata": {
    "name": "helloWorld",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addConnection",
      "discriminator": [
        40,
        6,
        69,
        0,
        230,
        150,
        215,
        41
      ],
      "accounts": [
        {
          "name": "connectionAccount",
          "writable": true
        },
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "networkId",
          "type": "string"
        },
        {
          "name": "srcEndpoint",
          "type": "string"
        },
        {
          "name": "dstEndpoint",
          "type": "string"
        }
      ]
    },
    {
      "name": "executeForcedRollback",
      "discriminator": [
        67,
        25,
        247,
        229,
        150,
        168,
        58,
        71
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true
        },
        {
          "name": "authority"
        },
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram"
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
      "name": "handleCallMessage",
      "discriminator": [
        70,
        67,
        201,
        55,
        42,
        121,
        72,
        196
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "xcall",
          "signer": true
        },
        {
          "name": "systemProgram"
        },
        {
          "name": "config",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "from",
          "type": {
            "defined": {
              "name": "networkAddress"
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
      ],
      "returns": {
        "defined": {
          "name": "handleCallMessageResponse"
        }
      }
    },
    {
      "name": "initialize",
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
          "writable": true
        },
        {
          "name": "authority",
          "writable": true
        },
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "xcallAddress",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "queryHandleCallMessageAccounts",
      "discriminator": [
        7,
        131,
        192,
        232,
        124,
        51,
        47,
        101
      ],
      "accounts": [
        {
          "name": "config"
        }
      ],
      "args": [
        {
          "name": "from",
          "type": {
            "defined": {
              "name": "networkAddress"
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
      ],
      "returns": {
        "defined": {
          "name": "queryAccountsResponse"
        }
      }
    },
    {
      "name": "sendCallMessage",
      "discriminator": [
        54,
        243,
        6,
        130,
        172,
        171,
        131,
        218
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true
        },
        {
          "name": "authority"
        },
        {
          "name": "connectionsAccount",
          "writable": true
        },
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "to",
          "type": {
            "defined": {
              "name": "networkAddress"
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        },
        {
          "name": "msgType",
          "type": "u32"
        },
        {
          "name": "rollback",
          "type": "bytes"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "authority",
      "discriminator": [
        36,
        108,
        254,
        18,
        167,
        144,
        27,
        36
      ]
    },
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
      "name": "connections",
      "discriminator": [
        33,
        106,
        93,
        180,
        243,
        222,
        76,
        251
      ]
    }
  ],
  "events": [
    {
      "name": "messageReceived",
      "discriminator": [
        231,
        68,
        47,
        77,
        173,
        241,
        157,
        166
      ]
    },
    {
      "name": "rollbackDataReceived",
      "discriminator": [
        98,
        14,
        144,
        7,
        44,
        104,
        247,
        75
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "addressMismatch",
      "msg": "Address Mismatch"
    },
    {
      "code": 6001,
      "name": "rollbackMismatch",
      "msg": "Rollback Mismatch"
    },
    {
      "code": 6002,
      "name": "invalidRollbackMessage",
      "msg": "Invalid Rollback Message"
    },
    {
      "code": 6003,
      "name": "uninitialized",
      "msg": "uninitialized"
    },
    {
      "code": 6004,
      "name": "invalidSource",
      "msg": "Invalid Source"
    },
    {
      "code": 6005,
      "name": "onlyXcall",
      "msg": "Only xcall"
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
      "name": "authority",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
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
            "name": "sn",
            "type": "u128"
          },
          {
            "name": "xcallAddress",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "connection",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "srcEndpoint",
            "type": "string"
          },
          {
            "name": "dstEndpoint",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "connections",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "connections",
            "type": {
              "vec": {
                "defined": {
                  "name": "connection"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "handleCallMessageResponse",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "success",
            "type": "bool"
          },
          {
            "name": "message",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "messageReceived",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "from",
            "type": "string"
          },
          {
            "name": "data",
            "type": "bytes"
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
      "name": "rollbackDataReceived",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "from",
            "type": "string"
          },
          {
            "name": "ssn",
            "type": "u128"
          },
          {
            "name": "rollback",
            "type": "bytes"
          }
        ]
      }
    }
  ]
};
