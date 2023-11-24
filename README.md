# xCall Scaffolding

This repository showcases examples of dApps that integrate with xCall, ICON's arbitrary cross-chain call service standard.

## Prerequisites

xCall is currently deployed in several testnets networks for different chains so you can directly deploy your dApp contracts to these networks.

### Icon Lisbon Testnet
- **Network Id** : `0x2.icon`
- **RPC URL** : `https://lisbon.net.solidwallet.io/api/v3`
- **Tracket URL** : [Tracker](https://tracker.lisbon.icon.community/)
- **Faucet URL**: [Faucet](https://faucet.iconosphere.io/)
- **BTP Network Id**:
    - Havah: 0x3
    - BSC: 0x4
    - Sepolia: 0x6
- **Contracts**:

    | Contract    	| Address                                    	| Note 	|
    |-------------	|--------------------------------------------	|------	|
    | BMC         	| cx2e230f2f91f7fe0f0b9c6fe1ce8dbba9f74f961a 	|      	|
    | Havah BMV   	| cxbc1c4a86ed97875ea6571fd51f44d3e5a453a9c1 	|      	|
    | BSC BMV     	| cx5ae1d53ff945700d4f64d2f2ceaf29fce4caab15 	|      	|
    | Sepolia BMV 	| cxa064081adfa7fd12b154c89605279e02d679f9f0 	|      	|
    | xCall       	| cx15a339fa60bd86225050b22ea8cd4a9d7cd8bb83 	|      	|

### Havah Altair Testnet
- **Network Id** : `0x111.icon`
- **RPC URL** : `https://ctz.altair.havah.io/api/v3`
- **Tracket URL** : [Tracker](https://scan.altair.havah.io/)
- **Faucet URL**: [Faucet](https://faucet.altair.havah.io/)
- **Contracts**:

    | Contract    	| Address                                    	| Note 	|
    |-------------	|--------------------------------------------	|------	|
    | BMC         	| cx60c1557a511326d16768b735c944023b514b55dc 	|      	|
    | ICON BMV   	| cx00efa7b16d70aba51998767a54dca70bdc5e4a98 	|      	|
    | xCall       	| cxf35c6158382096ea8cf7c54ee338ddfcaf2869a3 	|      	|

### BSC Testnet
- **Network Id** : `0x61.bsc`
- **RPC URL** : `https://data-seed-prebsc-1-s1.binance.org:8545/`
- **Tracket URL** : [Tracker](https://testnet.bscscan.com/)
- **Faucet URL**: [Faucet](https://testnet.bnbchain.org/faucet-smart)
- **Contracts**:

    | Contract       	| Address                                    	| Note 	|
    |----------------	|--------------------------------------------	|------	|
    | BMC            	| 0x759211c693728f731e1E06B7CE9Ed7b50359CE03 	|      	|
    | BMC Service    	| 0x9A39cF64707C44d013D49cB09aB50F5b5f820fb0 	|      	|
    | BMC Management 	| 0x7D93905698CF0014655AE111fA8A8933CFA0e29f 	|      	|
    | BMV Icon       	| 0x32DDeE8fE1F2D95875BDA61e8b9bf89F4C329090 	|      	|
    | xCall          	| 0xC938B1B7C20D080Ca3B67eebBfb66a75Fb3C4995 	|      	|

### Eth2 Sepolia Testnet
- **Network Id** : `0xaa36a7.eth2`
- **RPC URL** : `https://rpc.sepolia.org`
- **Tracket URL** : [Tracker](https://sepolia.etherscan.io/)
- **Faucet URL**: [Faucet](https://sepoliafaucet.com/)
- **Contracts**:

    | Contract       	| Address                                    	| Note 	|
    |----------------	|--------------------------------------------	|------	|
    | BMC            	| 0xB8e71dDE8d1A7aC5155E0c9d006FFDFfc2d3c7Eb 	|      	|
    | BMC Service    	| 0xaB4fACc9d827890bf1598816bab2706E00cBed83 	|      	|
    | BMC Management 	| 0xC4EdF38698De55aCa72f35b6cEcdF11560dA8e3a 	|      	|
    | BMV Icon       	| 0xD97f55D75a293e702213472014901479E4f28D01 	|      	|
    | xCall          	| 0x8E302b2fD7C10A0033e48EB0602Db3C7d6E0F506 	|      	|

## Build

Each directory represents xCall integrations for specific blockchain networks. Please navigate to a network subdirectory to see more details on building the contracts.
