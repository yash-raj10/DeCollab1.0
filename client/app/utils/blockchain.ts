// Blockchain utilities for Collabify smart contract interaction on Rootstock testnet
import Web3 from "web3";

declare global {
  interface Window {
    ethereum?: any;
    web3?: any;
  }
}

// Interface definitions
export interface BlockchainDocument {
  docId: string;
  cid: string;
  createdBy: string; // Ethereum address
  createdAt: number;
  updatedAt: number;
}

export interface BlockchainResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  error?: string;
}

export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
  balance?: string;
}

// Global web3 instance
let web3: Web3;

// Smart contract configuration for Rootstock Testnet
const CONTRACT_CONFIG = {
  contractAddress: "0x1DEd050b744aA4e62F4CAE06E7b636E5E50896DE",
  rpcUrl: "https://public-node.testnet.rsk.co",
  chainId: 31,
  currency: "tRBTC",
  explorerUrl: "https://explorer.testnet.rootstock.io",
  // Contract ABI - will be set after adding ABI
  abi: [
    {
      inputs: [
        {
          internalType: "string",
          name: "docId",
          type: "string",
        },
        {
          internalType: "string",
          name: "cid",
          type: "string",
        },
      ],
      name: "createDocument",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "string",
          name: "docId",
          type: "string",
        },
        {
          indexed: false,
          internalType: "string",
          name: "cid",
          type: "string",
        },
        {
          indexed: true,
          internalType: "address",
          name: "createdBy",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "createdAt",
          type: "uint256",
        },
      ],
      name: "DocumentCreated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "string",
          name: "docId",
          type: "string",
        },
        {
          indexed: false,
          internalType: "string",
          name: "cid",
          type: "string",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "updatedAt",
          type: "uint256",
        },
      ],
      name: "DocumentUpdated",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "docId",
          type: "string",
        },
        {
          internalType: "string",
          name: "newCid",
          type: "string",
        },
      ],
      name: "updateDocument",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "docId",
          type: "string",
        },
      ],
      name: "doesDocumentExist",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "docId",
          type: "string",
        },
      ],
      name: "getDocument",
      outputs: [
        {
          internalType: "string",
          name: "cid",
          type: "string",
        },
        {
          internalType: "address",
          name: "createdBy",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "createdAt",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "updatedAt",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "docId",
          type: "string",
        },
      ],
      name: "getDocumentCid",
      outputs: [
        {
          internalType: "string",
          name: "cid",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "docId",
          type: "string",
        },
      ],
      name: "getDocumentOwner",
      outputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "docId",
          type: "string",
        },
      ],
      name: "isDocumentOwner",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ], // TO BE FILLED WITH ABI
  // Contract bytecode - will be set for deployment
  bytecode:
    "6080604052348015600e575f5ffd5b5061161f8061001c5f395ff3fe608060405234801561000f575f5ffd5b506004361061007b575f3560e01c80637ccb6a64116100595780637ccb6a64146100fb57806393ebc4c81461012e578063aca360821461014a578063cb356d911461017a5761007b565b80634d300e0c1461007f5780634d5e504b1461009b57806377ed83a7146100cb575b5f5ffd5b61009960048036038101906100949190610e47565b6101aa565b005b6100b560048036038101906100b09190610ebd565b6103fa565b6040516100c29190610f1e565b60405180910390f35b6100e560048036038101906100e09190610ebd565b610472565b6040516100f29190610f97565b60405180910390f35b61011560048036038101906101109190610ebd565b6105d3565b604051610125949392919061100e565b60405180910390f35b61014860048036038101906101439190610e47565b610860565b005b610164600480360381019061015f9190610ebd565b610ada565b6040516101719190610f1e565b60405180910390f35b610194600480360381019061018f9190610ebd565b610c01565b6040516101a19190611058565b60405180910390f35b815f8151116101ee576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101e5906110bb565b60405180910390fd5b815f815111610232576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161022990611123565b60405180910390fd5b83600181604051610243919061117b565b90815260200160405180910390205f9054906101000a900460ff1661029d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610294906111db565b60405180910390fd5b843373ffffffffffffffffffffffffffffffffffffffff165f826040516102c4919061117b565b90815260200160405180910390206002015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461034b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161034290611269565b60405180910390fd5b5f429050855f8860405161035f919061117b565b9081526020016040518091039020600101908161037c9190611484565b50805f8860405161038d919061117b565b908152602001604051809103902060040181905550866040516103b0919061117b565b60405180910390207f34f40519c9caa557b771c93dab87a0fb696e607d059aef50d5906c368a7605c687836040516103e9929190611553565b60405180910390a250505050505050565b5f815f81511161043f576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610436906110bb565b60405180910390fd5b60018360405161044f919061117b565b90815260200160405180910390205f9054906101000a900460ff16915050919050565b6060815f8151116104b8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104af906110bb565b60405180910390fd5b826001816040516104c9919061117b565b90815260200160405180910390205f9054906101000a900460ff16610523576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161051a906111db565b60405180910390fd5b5f84604051610532919061117b565b9081526020016040518091039020600101805461054e906112b4565b80601f016020809104026020016040519081016040528092919081815260200182805461057a906112b4565b80156105c55780601f1061059c576101008083540402835291602001916105c5565b820191905f5260205f20905b8154815290600101906020018083116105a857829003601f168201915b505050505092505050919050565b60605f5f5f845f81511161061c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610613906110bb565b60405180910390fd5b8560018160405161062d919061117b565b90815260200160405180910390205f9054906101000a900460ff16610687576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161067e906111db565b60405180910390fd5b5f5f88604051610697919061117b565b90815260200160405180910390206040518060a00160405290815f820180546106bf906112b4565b80601f01602080910402602001604051908101604052809291908181526020018280546106eb906112b4565b80156107365780601f1061070d57610100808354040283529160200191610736565b820191905f5260205f20905b81548152906001019060200180831161071957829003601f168201915b5050505050815260200160018201805461074f906112b4565b80601f016020809104026020016040519081016040528092919081815260200182805461077b906112b4565b80156107c65780601f1061079d576101008083540402835291602001916107c6565b820191905f5260205f20905b8154815290600101906020018083116107a957829003601f168201915b50505050508152602001600282015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001600382015481526020016004820154815250509050806020015181604001518260600151836080015196509650965096505050509193509193565b815f8151116108a4576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161089b906110bb565b60405180910390fd5b815f8151116108e8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108df90611123565b60405180910390fd5b6001846040516108f8919061117b565b90815260200160405180910390205f9054906101000a900460ff1615610953576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161094a906115cb565b60405180910390fd5b5f4290506040518060a001604052808681526020018581526020013373ffffffffffffffffffffffffffffffffffffffff168152602001828152602001828152505f866040516109a3919061117b565b90815260200160405180910390205f820151815f0190816109c49190611484565b5060208201518160010190816109da9190611484565b506040820151816002015f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550606082015181600301556080820151816004015590505060018086604051610a49919061117b565b90815260200160405180910390205f6101000a81548160ff0219169083151502179055503373ffffffffffffffffffffffffffffffffffffffff1685604051610a92919061117b565b60405180910390207f3da153696446a6a6d1987b6d5dbe21cf0cec82bb90179933930cb134d23d3aa28684604051610acb929190611553565b60405180910390a35050505050565b5f815f815111610b1f576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b16906110bb565b60405180910390fd5b82600181604051610b30919061117b565b90815260200160405180910390205f9054906101000a900460ff16610b8a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b81906111db565b60405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff165f85604051610bb0919061117b565b90815260200160405180910390206002015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161492505050919050565b5f815f815111610c46576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c3d906110bb565b60405180910390fd5b82600181604051610c57919061117b565b90815260200160405180910390205f9054906101000a900460ff16610cb1576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ca8906111db565b60405180910390fd5b5f84604051610cc0919061117b565b90815260200160405180910390206002015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1692505050919050565b5f604051905090565b5f5ffd5b5f5ffd5b5f5ffd5b5f5ffd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b610d5982610d13565b810181811067ffffffffffffffff82111715610d7857610d77610d23565b5b80604052505050565b5f610d8a610cfa565b9050610d968282610d50565b919050565b5f67ffffffffffffffff821115610db557610db4610d23565b5b610dbe82610d13565b9050602081019050919050565b828183375f83830152505050565b5f610deb610de684610d9b565b610d81565b905082815260208101848484011115610e0757610e06610d0f565b5b610e12848285610dcb565b509392505050565b5f82601f830112610e2e57610e2d610d0b565b5b8135610e3e848260208601610dd9565b91505092915050565b5f5f60408385031215610e5d57610e5c610d03565b5b5f83013567ffffffffffffffff811115610e7a57610e79610d07565b5b610e8685828601610e1a565b925050602083013567ffffffffffffffff811115610ea757610ea6610d07565b5b610eb385828601610e1a565b9150509250929050565b5f60208284031215610ed257610ed1610d03565b5b5f82013567ffffffffffffffff811115610eef57610eee610d07565b5b610efb84828501610e1a565b91505092915050565b5f8115159050919050565b610f1881610f04565b82525050565b5f602082019050610f315f830184610f0f565b92915050565b5f81519050919050565b5f82825260208201905092915050565b8281835e5f83830152505050565b5f610f6982610f37565b610f738185610f41565b9350610f83818560208601610f51565b610f8c81610d13565b840191505092915050565b5f6020820190508181035f830152610faf8184610f5f565b905092915050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610fe082610fb7565b9050919050565b610ff081610fd6565b82525050565b5f819050919050565b61100881610ff6565b82525050565b5f6080820190508181035f8301526110268187610f5f565b90506110356020830186610fe7565b6110426040830185610fff565b61104f6060830184610fff565b95945050505050565b5f60208201905061106b5f830184610fe7565b92915050565b7f446f63756d656e742049442063616e6e6f7420626520656d70747900000000005f82015250565b5f6110a5601b83610f41565b91506110b082611071565b602082019050919050565b5f6020820190508181035f8301526110d281611099565b9050919050565b7f4349442063616e6e6f7420626520656d707479000000000000000000000000005f82015250565b5f61110d601383610f41565b9150611118826110d9565b602082019050919050565b5f6020820190508181035f83015261113a81611101565b9050919050565b5f81905092915050565b5f61115582610f37565b61115f8185611141565b935061116f818560208601610f51565b80840191505092915050565b5f611186828461114b565b915081905092915050565b7f446f63756d656e7420646f6573206e6f742065786973740000000000000000005f82015250565b5f6111c5601783610f41565b91506111d082611191565b602082019050919050565b5f6020820190508181035f8301526111f2816111b9565b9050919050565b7f4f6e6c7920646f63756d656e74206f776e65722063616e20706572666f726d205f8201527f7468697320616374696f6e000000000000000000000000000000000000000000602082015250565b5f611253602b83610f41565b915061125e826111f9565b604082019050919050565b5f6020820190508181035f83015261128081611247565b9050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806112cb57607f821691505b6020821081036112de576112dd611287565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026113407fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82611305565b61134a8683611305565b95508019841693508086168417925050509392505050565b5f819050919050565b5f61138561138061137b84610ff6565b611362565b610ff6565b9050919050565b5f819050919050565b61139e8361136b565b6113b26113aa8261138c565b848454611311565b825550505050565b5f5f905090565b6113c96113ba565b6113d4818484611395565b505050565b5b818110156113f7576113ec5f826113c1565b6001810190506113da565b5050565b601f82111561143c5761140d816112e4565b611416846112f6565b81016020851015611425578190505b611439611431856112f6565b8301826113d9565b50505b505050565b5f82821c905092915050565b5f61145c5f1984600802611441565b1980831691505092915050565b5f611474838361144d565b9150826002028217905092915050565b61148d82610f37565b67ffffffffffffffff8111156114a6576114a5610d23565b5b6114b082546112b4565b6114bb8282856113fb565b5f60209050601f8311600181146114ec575f84156114da578287015190505b6114e48582611469565b86555061154b565b601f1984166114fa866112e4565b5f5b82811015611521578489015182556001820191506020850194506020810190506114fc565b8683101561153e578489015161153a601f89168261144d565b8355505b6001600288020188555050505b505050505050565b5f6040820190508181035f83015261156b8185610f5f565b905061157a6020830184610fff565b9392505050565b7f446f63756d656e7420616c7265616479206578697374730000000000000000005f82015250565b5f6115b5601783610f41565b91506115c082611581565b602082019050919050565b5f6020820190508181035f8301526115e2816115a9565b905091905056fea2646970667358221220f07899e331a5a6bcb6e56850647fb2c35a1aba5866dffaec98ee56526430fe8764736f6c634300081e0033", // TO BE FILLED WITH BYTECODE
};

// Network configuration for Rootstock testnet
const ROOTSTOCK_TESTNET_CONFIG = {
  chainId: "0x1f", // 31 in hex
  chainName: "Rootstock Testnet",
  nativeCurrency: {
    name: "Test Bitcoin",
    symbol: "tRBTC",
    decimals: 18,
  },
  rpcUrls: ["https://public-node.testnet.rsk.co"],
  blockExplorerUrls: ["https://explorer.testnet.rootstock.io"],
};

/**565b80634d300e0c1461007f5780634d5e504b1461009b57806377ed83a7146100cb575b5f5ffd5b61009960048036038101906100949190610e47565b6101aa565b005b6100b560048036038101906100b09190610ebd565b6103fa565b6040516100c29190610f1e565b60405180910390f35b6100e560048036038101906100e09190610ebd565b610472565b6040516100f29190610f97565b60405180910390f35b61011560048036038101906101109190610ebd565b6105d3565b604051610125949392919061100e565b60405180910390f35b61014860048036038101906101439190610e47565b610860565b005b610164600480360381019061015f9190610ebd565b610ada565b6040516101719190610f1e565b60405180910390f35b610194600480360381019061018f9190610ebd565b610c01565b6040516101a19190611058565b60405180910390f35b815f8151116101ee576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101e5906110bb565b60405180910390fd5b815f815111610232576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161022990611123565b60405180910390fd5b83600181604051610243919061117b565b90815260200160405180910390205f9054906101000a900460ff1661029d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610294906111db565b60405180910390fd5b843373ffffffffffffffffffffffffffffffffffffffff165f826040516102c4919061117b565b90815260200160405180910390206002015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461034b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161034290611269565b60405180910390fd5b5f429050855f8860405161035f919061117b565b9081526020016040518091039020600101908161037c9190611484565b50805f8860405161038d919061117b565b908152602001604051809103902060040181905550866040516103b0919061117b565b60405180910390207f34f40519c9caa557b771c93dab87a0fb696e607d059aef50d5906c368a7605c687836040516103e9929190611553565b60405180910390a250505050505050565b5f815f81511161043f576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610436906110bb565b60405180910390fd5b60018360405161044f919061117b565b90815260200160405180910390205f9054906101000a900460ff16915050919050565b6060815f8151116104b8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104af906110bb565b60405180910390fd5b826001816040516104c9919061117b565b90815260200160405180910390205f9054906101000a900460ff16610523576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161051a906111db565b60405180910390fd5b5f84604051610532919061117b565b9081526020016040518091039020600101805461054e906112b4565b80601f016020809104026020016040519081016040528092919081815260200182805461057a906112b4565b80156105c55780601f1061059c576101008083540402835291602001916105c5565b820191905f5260205f20905b8154815290600101906020018083116105a857829003601f168201915b505050505092505050919050565b60605f5f5f845f81511161061c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610613906110bb565b60405180910390fd5b8560018160405161062d919061117b565b90815260200160405180910390205f9054906101000a900460ff16610687576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161067e906111db565b60405180910390fd5b5f5f88604051610697919061117b565b90815260200160405180910390206040518060a00160405290815f820180546106bf906112b4565b80601f01602080910402602001604051908101604052809291908181526020018280546106eb906112b4565b80156107365780601f1061070d57610100808354040283529160200191610736565b820191905f5260205f20905b81548152906001019060200180831161071957829003601f168201915b5050505050815260200160018201805461074f906112b4565b80601f016020809104026020016040519081016040528092919081815260200182805461077b906112b4565b80156107c65780601f1061079d576101008083540402835291602001916107c6565b820191905f5260205f20905b8154815290600101906020018083116107a957829003601f168201915b50505050508152602001600282015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001600382015481526020016004820154815250509050806020015181604001518260600151836080015196509650965096505050509193509193565b815f8151116108a4576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161089b906110bb565b60405180910390fd5b815f8151116108e8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108df90611123565b60405180910390fd5b6001846040516108f8919061117b565b90815260200160405180910390205f9054906101000a900460ff1615610953576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161094a906115cb565b60405180910390fd5b5f4290506040518060a001604052808681526020018581526020013373ffffffffffffffffffffffffffffffffffffffff168152602001828152602001828152505f866040516109a3919061117b565b90815260200160405180910390205f820151815f0190816109c49190611484565b5060208201518160010190816109da9190611484565b506040820151816002015f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550606082015181600301556080820151816004015590505060018086604051610a49919061117b565b90815260200160405180910390205f6101000a81548160ff0219169083151502179055503373ffffffffffffffffffffffffffffffffffffffff1685604051610a92919061117b565b60405180910390207f3da153696446a6a6d1987b6d5dbe21cf0cec82bb90179933930cb134d23d3aa28684604051610acb929190611553565b60405180910390a35050505050565b5f815f815111610b1f576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b16906110bb565b60405180910390fd5b82600181604051610b30919061117b565b90815260200160405180910390205f9054906101000a900460ff16610b8a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b81906111db565b60405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff165f85604051610bb0919061117b565b90815260200160405180910390206002015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161492505050919050565b5f815f815111610c46576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c3d906110bb565b60405180910390fd5b82600181604051610c57919061117b565b90815260200160405180910390205f9054906101000a900460ff16610cb1576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ca8906111db565b60405180910390fd5b5f84604051610cc0919061117b565b90815260200160405180910390206002015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1692505050919050565b};tions for Collabify smart contract interaction
// Note: This is a simplified version without actual Web3 libraries for demo purposes

// Utility functions
/**
 * Check if MetaMask or compatible wallet is available
 */
export function isWalletAvailable(): boolean {
  return typeof window !== "undefined" && (!!window.ethereum || !!window.web3);
}

/**
 * Initialize Web3 instance
 */
function initWeb3(): Web3 {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
  } else if (window.web3) {
    web3 = new Web3(window.web3.currentProvider);
  } else {
    web3 = new Web3(new Web3.providers.HttpProvider(CONTRACT_CONFIG.rpcUrl));
  }
  return web3;
}

/**
 * Get Web3 instance
 */
function getWeb3(): Web3 {
  if (!web3) {
    return initWeb3();
  }
  return web3;
}

/**
 * Connect to wallet and add/switch to Rootstock testnet
 */
export async function connectWallet(): Promise<WalletConnection> {
  if (!isWalletAvailable()) {
    throw new Error("MetaMask or compatible wallet is required");
  }

  try {
    const web3Instance = initWeb3();

    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please connect your wallet.");
    }

    // Get current chain ID
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    const chainIdDecimal = parseInt(chainId, 16);

    // If not on Rootstock testnet, try to switch
    if (chainIdDecimal !== CONTRACT_CONFIG.chainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ROOTSTOCK_TESTNET_CONFIG.chainId }],
        });
      } catch (switchError: any) {
        // If the chain hasn't been added yet, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [ROOTSTOCK_TESTNET_CONFIG],
          });
        } else {
          throw switchError;
        }
      }
    }

    // Get balance
    const balance = await web3Instance.eth.getBalance(accounts[0]);
    const balanceInEther = web3Instance.utils.fromWei(balance, "ether");

    return {
      address: accounts[0],
      chainId: CONTRACT_CONFIG.chainId,
      isConnected: true,
      balance: balanceInEther,
    };
  } catch (error) {
    console.error("Wallet connection failed:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to connect wallet"
    );
  }
}

/**
 * Get connected wallet address
 */
export async function getConnectedAddress(): Promise<string | null> {
  if (!isWalletAvailable()) {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("Failed to get connected address:", error);
    return null;
  }
}

/**
 * Get contract instance using Web3
 */
function getContract(): any {
  const web3Instance = getWeb3();
  return new web3Instance.eth.Contract(
    CONTRACT_CONFIG.abi,
    CONTRACT_CONFIG.contractAddress
  );
}

/**
 * Create a document on the blockchain
 * @param docId - Unique document identifier (UUID)
 * @param cid - IPFS Content Identifier (Supabase document ID)
 * @returns Promise with blockchain transaction result
 */
export async function createDocumentOnChain(
  docId: string,
  cid: string
): Promise<BlockchainResult> {
  try {
    console.log("Creating document on blockchain...", { docId, cid });

    // Ensure wallet is connected
    const walletConnection = await connectWallet();
    console.log("Connected wallet:", walletConnection.address);

    // Get contract instance
    const contract = getContract();
    const web3Instance = getWeb3();

    // Estimate gas
    const gasEstimate = await contract.methods
      .createDocument(docId, cid)
      .estimateGas({
        from: walletConnection.address,
      });
    console.log("Estimated gas:", gasEstimate);

    // Get current gas price (legacy, not EIP-1559)
    const gasPrice = await web3Instance.eth.getGasPrice();

    // Send transaction (legacy gas params only)
    const tx = await contract.methods.createDocument(docId, cid).send({
      from: walletConnection.address,
      gas: Math.floor(Number(gasEstimate) * 1.2), // Add 20% buffer
      gasPrice,
    });

    console.log("Document created on blockchain:", {
      transactionHash: tx.transactionHash,
      blockNumber: tx.blockNumber,
      gasUsed: tx.gasUsed,
    });

    return {
      success: true,
      transactionHash: tx.transactionHash,
      blockNumber: tx.blockNumber,
    };
  } catch (error: any) {
    console.error("Blockchain document creation failed:", error);

    // Handle specific error cases
    let errorMessage = "Unknown blockchain error";
    if (error.code === 4001) {
      errorMessage = "Transaction was rejected by user";
    } else if (error.message && error.message.includes("insufficient funds")) {
      errorMessage = "Insufficient tRBTC balance for transaction";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update a document on the blockchain
 * @param docId - Document identifier
 * @param newCid - New IPFS Content Identifier (Supabase document ID)
 * @returns Promise with blockchain transaction result
 */
export async function updateDocumentOnChain(
  docId: string,
  newCid: string
): Promise<BlockchainResult> {
  try {
    console.log("Updating document on blockchain...", { docId, newCid });

    // Ensure wallet is connected
    const walletConnection = await connectWallet();
    console.log("Connected wallet:", walletConnection.address);

    // Get contract instance
    const contract = getContract();

    // Check if document exists and user owns it
    const isOwner = await contract.methods.isDocumentOwner(docId).call({
      from: walletConnection.address,
    });

    if (!isOwner) {
      throw new Error("Only document owner can update this document");
    }

    // Estimate gas
    const gasEstimate = await contract.methods
      .updateDocument(docId, newCid)
      .estimateGas({
        from: walletConnection.address,
      });
    console.log("Estimated gas:", gasEstimate);

    // Get current gas price (legacy, not EIP-1559)
    const web3Instance = getWeb3();
    const gasPrice = await web3Instance.eth.getGasPrice();

    // Send transaction (legacy gas params only)
    const tx = await contract.methods.updateDocument(docId, newCid).send({
      from: walletConnection.address,
      gas: Math.floor(Number(gasEstimate) * 1.2), // Add 20% buffer
      gasPrice,
    });

    console.log("Document updated on blockchain:", {
      transactionHash: tx.transactionHash,
      blockNumber: tx.blockNumber,
      gasUsed: tx.gasUsed,
    });

    return {
      success: true,
      transactionHash: tx.transactionHash,
      blockNumber: tx.blockNumber,
    };
  } catch (error: any) {
    console.error("Blockchain document update failed:", error);

    let errorMessage = "Unknown blockchain error";
    if (error.code === 4001) {
      errorMessage = "Transaction was rejected by user";
    } else if (error.message && error.message.includes("insufficient funds")) {
      errorMessage = "Insufficient tRBTC balance for transaction";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get a document from the blockchain
 * @param docId - Document identifier
 * @returns Promise with document data or null if not found
 */
export async function getDocumentFromChain(
  docId: string
): Promise<BlockchainDocument | null> {
  try {
    console.log("Getting document from blockchain...", docId);

    // Get Web3 instance with RPC provider for read-only operations
    const web3Instance = new Web3(
      new Web3.providers.HttpProvider(CONTRACT_CONFIG.rpcUrl)
    );
    const contract = new web3Instance.eth.Contract(
      CONTRACT_CONFIG.abi,
      CONTRACT_CONFIG.contractAddress
    );

    // Check if document exists
    const exists = await contract.methods.doesDocumentExist(docId).call();
    if (!exists) {
      return null;
    }

    // Get document details
    const result: any = await contract.methods.getDocument(docId).call();

    return {
      docId,
      cid: result[0] || result.cid,
      createdBy: result[1] || result.createdBy,
      createdAt: Number(result[2] || result.createdAt),
      updatedAt: Number(result[3] || result.updatedAt),
    };
  } catch (error) {
    console.error("Failed to get document from blockchain:", error);
    return null;
  }
}

/**
 * Check if a document exists on the blockchain
 * @param docId - Document identifier
 * @returns Promise<boolean>
 */
export async function documentExistsOnChain(docId: string): Promise<boolean> {
  try {
    const web3Instance = new Web3(
      new Web3.providers.HttpProvider(CONTRACT_CONFIG.rpcUrl)
    );
    const contract = new web3Instance.eth.Contract(
      CONTRACT_CONFIG.abi,
      CONTRACT_CONFIG.contractAddress
    );
    return await contract.methods.doesDocumentExist(docId).call();
  } catch (error) {
    console.error("Failed to check document existence:", error);
    return false;
  }
}

/**
 * Get all documents created by a user
 * @param userAddress - User's wallet address
 * @returns Promise with array of document IDs and metadata
 */
export async function getUserDocumentsFromChain(
  userAddress: string
): Promise<Array<{ docId: string; document: BlockchainDocument }>> {
  try {
    console.log("Getting user documents from blockchain...", userAddress);

    // Get contract instance
    const contract = getContract();

    // Try to fetch events filtered by createdBy
    let events = await contract.getPastEvents("DocumentCreated", {
      filter: { createdBy: userAddress },
      fromBlock: 0,
      toBlock: "latest",
    });
    console.log(
      `[getUserDocumentsFromChain] Filtered events for address ${userAddress}:`,
      events.length
    );

    // If no events found, try fetching all and filter in JS (workaround for filter issues)
    if (!events || events.length === 0) {
      console.warn(
        `[getUserDocumentsFromChain] No events found with filter. Fetching all DocumentCreated events and filtering in JS.`
      );
      const allEvents = await contract.getPastEvents("DocumentCreated", {
        fromBlock: 0,
        toBlock: "latest",
      });
      events = allEvents.filter((event: any) => {
        // Compare addresses case-insensitively
        return (
          event.returnValues.createdBy &&
          event.returnValues.createdBy.toLowerCase() ===
            userAddress.toLowerCase()
        );
      });
      console.log(
        `[getUserDocumentsFromChain] Events after manual filter:`,
        events.length
      );
    }

    // For each event, get the current document data
    const userDocuments = await Promise.all(
      events.map(async (event: any) => {
        try {
          const docId = event.returnValues.docId;
          const document = await getDocumentFromChain(docId);
          if (document) {
            return {
              docId,
              document: {
                docId: document.docId,
                cid: document.cid,
                createdBy: document.createdBy,
                createdAt: document.createdAt,
                updatedAt: document.updatedAt,
              },
            };
          }
          return null;
        } catch (error) {
          console.error(
            `Error fetching document ${event.returnValues.docId}:`,
            error
          );
          return null;
        }
      })
    );

    // Deduplicate by docId (keep latest by updatedAt)
    const docMap = new Map<
      string,
      { docId: string; document: BlockchainDocument }
    >();
    for (const doc of userDocuments) {
      if (doc && doc.docId) {
        const existing = docMap.get(doc.docId);
        if (!existing || doc.document.updatedAt > existing.document.updatedAt) {
          docMap.set(doc.docId, doc);
        }
      }
    }

    // Convert to array and sort by updatedAt descending
    const dedupedSortedDocs = Array.from(docMap.values()).sort(
      (a, b) => b.document.updatedAt - a.document.updatedAt
    );

    console.log(
      `Successfully retrieved ${dedupedSortedDocs.length} unique documents`
    );
    return dedupedSortedDocs;
  } catch (error) {
    console.error("Failed to get user documents from blockchain:", error);
    return [];
  }
}

// Helper functions for blockchain operations

/**
 * Generate UUID for document ID
 * @returns UUID string
 */
export function generateDocumentId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get blockchain explorer URL for a transaction
 * @param txHash - Transaction hash
 * @returns Explorer URL string
 */
export function getTransactionUrl(txHash: string): string {
  return `${CONTRACT_CONFIG.explorerUrl}/tx/${txHash}`;
}

/**
 * Get current gas price from the network
 * @returns Promise with gas price in wei
 */
export async function getCurrentGasPrice(): Promise<string> {
  try {
    const web3Instance = new Web3(
      new Web3.providers.HttpProvider(CONTRACT_CONFIG.rpcUrl)
    );
    const gasPrice = await web3Instance.eth.getGasPrice();
    return gasPrice.toString();
  } catch (error) {
    console.error("Failed to get gas price:", error);
    return "0";
  }
}

/**
 * Get wallet balance in tRBTC
 * @param address - Wallet address
 * @returns Promise with balance as string
 */
export async function getWalletBalance(address: string): Promise<string> {
  try {
    const web3Instance = new Web3(
      new Web3.providers.HttpProvider(CONTRACT_CONFIG.rpcUrl)
    );
    const balance = await web3Instance.eth.getBalance(address);
    return web3Instance.utils.fromWei(balance, "ether");
  } catch (error) {
    console.error("Failed to get wallet balance:", error);
    return "0";
  }
}

/**
 * Validate if a string is a valid Ethereum address
 * @param address - Address to validate
 * @returns boolean
 */
export function isValidAddress(address: string): boolean {
  const web3Instance = getWeb3();
  return web3Instance.utils.isAddress(address);
}

/**
 * Validate if a string is a valid transaction hash
 * @param hash - Hash to validate
 * @returns boolean
 */
export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Listen for contract events
 * @param eventName - Name of the event to listen for
 * @param callback - Callback function to execute when event is emitted
 */
export async function subscribeToContractEvents(
  eventName: string,
  callback: (...args: any[]) => void
): Promise<void> {
  try {
    const web3Instance = new Web3(
      new Web3.providers.HttpProvider(CONTRACT_CONFIG.rpcUrl)
    );
    const contract = new web3Instance.eth.Contract(
      CONTRACT_CONFIG.abi,
      CONTRACT_CONFIG.contractAddress
    );

    // For HTTP provider, we'll use polling instead of websockets
    console.log(
      `Event subscription for ${eventName} would require WebSocket provider for real-time updates`
    );
    console.log("Consider implementing polling mechanism for HTTP providers");
  } catch (error) {
    console.error(`Failed to subscribe to ${eventName} events:`, error);
  }
}

/**
 * Remove event listeners
 */
export async function unsubscribeFromContractEvents(): Promise<void> {
  try {
    console.log(
      "Event unsubscription would need to be handled per subscription"
    );
    // Web3.js handles this differently - you'd need to store and manage individual subscriptions
  } catch (error) {
    console.error("Failed to unsubscribe from contract events:", error);
  }
}
