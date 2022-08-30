const qs = require("qs");
const Web3 = require("web3");
const { default: BigNumber } = require("bignumber.js");

let currentTrade = {};
let currentSelectSide;
let tokens;

async function init() {
  await listAvailableTokens();
}

async function listAvailableTokens() {
  console.log("initializing");
  //   let response = await fetch("https://tokens.coingecko.com/uniswap/all.json");
  // let tokenListJSON = await response.json();
//   let response =
//     '{"name":"CoinGecko","logoURI":"https://www.coingecko.com/assets/thumbnail-007177f3eca19695592f0b8b0eabbdae282b54154e1be912285c9034ea6cbaf2.png","keywords":["defi"],"timestamp":"2022-08-17T04:08:12.925+00:00","tokens":[{"chainId":1,"address":"0xdac17f958d2ee523a2206206994597c13d831ec7","name":"Tether","symbol":"USDT","decimals":6,"logoURI":"https://assets.coingecko.com/coins/images/325/thumb/Tether-logo.png?1598003707"},{"chainId":1,"address":"0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0","name":"Polygon","symbol":"Matic","decimals":18,"logoURI":"https://assets.coingecko.com/coins/images/4713/thumb/matic-token-icon.png?1624446912"}],"version":{"major":975,"minor":1,"patch":0}}';

  //   let tokenListJSON = JSON.parse(response);
  let response = await fetch("https://gateway.ipfs.io/ipns/tokens.uniswap.org");
     let tokenListJSON = await response.json();
  //     console.log("Listing available tokens: ", tokenListJSON);
      tokens = tokenListJSON.tokens.filter((token) => token.chainId === 137);
  //     console.log("tokens: ", tokens);
//   tokens = [
//     {
//       chainId: 1,
//       address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
//       name: "Polygon",
//       symbol: "MATIC",
//       decimals: 18,
//       logoURI:
//         "https://assets.coingecko.com/coins/images/4713/thumb/matic-token-icon.png?1624446912",
//       extensions: {
//         bridgeInfo: {
//           42161: {
//             tokenAddress: "0x561877b6b3DD7651313794e5F2894B2F18bE0766",
//           },
//         },
//       },
//     },
//     {
//       name: "Tether USD",
//       address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
//       symbol: "USDT",
//       decimals: 6,
//       chainId: 1,
//       logoURI:
//         "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
//       extensions: {
//         bridgeInfo: {
//           10: {
//             tokenAddress: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
//           },
//           137: {
//             tokenAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
//           },
//           42161: {
//             tokenAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
//           },
//         },
//       },
//     },
//   ];
  //     // console.log("tokens: ", tokens);
  //   let response = await fetch("https://gateway.ipfs.io/ipns/tokens.uniswap.org");
  //   let tokenListJSON = await response.json();
  //   console.log("listing available tokens: ", tokenListJSON);
  //   tokens = tokenListJSON.tokens;
  //   console.log("tokens: ", tokens);

  let parent = document.getElementById("token_list");
  for (const i in tokens) {
    let div = document.createElement("div");
    div.className = "token_row";

    let html = `<img class="token_list_img" src="${tokens[i].logoURI}">
                <span class="token_list_text">${tokens[i].symbol}</span>`;
    div.innerHTML = html;
    div.onclick = () => {
      selectToken(tokens[i]);
    };
    parent.appendChild(div);
  }
}

function selectToken(token) {
  closeModal();
  currentTrade[currentSelectSide] = token;
  console.log("currentTrade: ", currentTrade);
  renderInterface();
}

function renderInterface() {
  if (currentTrade.from) {
    document.getElementById("from_token_img").src = currentTrade.from.logoURI;
    document.getElementById("from_token_text").innerHTML =
      currentTrade.from.symbol;
  }
  if (currentTrade.to) {
    document.getElementById("to_token_img").src = currentTrade.to.logoURI;
    document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
  }
}

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      console.log("Connecting");
      await ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.log(error);
    }
    document.getElementById("login_button").innerHTML = "Connected";
    document.getElementById("swap_button").disabled = false;
  } else {
    document.getElementById("login_button").innerHTML =
      "Please install Metamask";
  }
}

async function getPrice() {
  console.log("Getting Price");

  if (
    !currentTrade.from ||
    !currentTrade.to ||
    !document.getElementById("from_amount").value
  )
    return;
  let amount = Number(
    document.getElementById("from_amount").value *
      10 ** currentTrade.from.decimals
  );

  const params = {
    sellToken: currentTrade.from.address,
    buyToken: currentTrade.to.address,
    sellAmount: amount,
  };

  // Fetch the swap price
  const response = await fetch(
    `https://polygon.api.0x.org/swap/v1/price?${qs.stringify(params)}`
  );

  swapPriceJSON = await response.json();
  console.log("Price: ", swapPriceJSON);

  document.getElementById("to_amount").value =
    swapPriceJSON.buyAmount / 10 ** currentTrade.to.decimals;
  document.getElementById("gas_estimate").innerHTML =
    swapPriceJSON.estimatedGas;
}

async function getQuote(account) {
  console.log("Getting Quote");

  if (
    !currentTrade.from ||
    !currentTrade.to ||
    !document.getElementById("from_amount").value
  )
    return;
  let amount = Number(
    document.getElementById("from_amount").value *
      10 ** currentTrade.from.decimals
  );

  const params = {
    sellToken: 'MATIC',
    buyToken: currentTrade.to.symbol,
    sellAmount: amount,
    takerAddress: account,
    slippagePercentage: 0.05,
  };

  // Fetch the swap price
  const response = await fetch(
    `https://polygon.api.0x.org/swap/v1/quote?${qs.stringify(params)}`
  );

  swapQuoteJSON = await response.json();
  console.log("Quote: ", swapQuoteJSON);

  // document.getElementById("to_amount").value = swapQuoteJSON.price;
  document.getElementById("gas_estimate").innerHTML =
    swapQuoteJSON.estimatedGas;

  return swapQuoteJSON;
}

async function trySwap() {
  let accounts = await ethereum.request({ method: "eth_accounts" });
  let takerAddress = accounts[0];

  console.log("takerAddress:", takerAddress);

  const swapQuoteJSON = await getQuote(takerAddress);

  // Set Token Allowance
  // Interact with ERC20TokenContract
  const web3 = new Web3(Web3.givenProvider);
  const fromTokenAddress = currentTrade.from.address;
  const erc20abi = [
    {
      inputs: [
        { internalType: "string", name: "name", type: "string" },
        { internalType: "string", name: "symbol", type: "string" },
        { internalType: "uint256", name: "max_supply", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
      name: "burn",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "account", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "burnFrom",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "subtractedValue", type: "uint256" },
      ],
      name: "decreaseAllowance",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "addedValue", type: "uint256" },
      ],
      name: "increaseAllowance",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "sender", type: "address" },
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transferFrom",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];
  console.log("trying swap");

  const ERC20TokenContract = new web3.eth.Contract(erc20abi, fromTokenAddress);
  console.log("setup ERC20TokenContract: ", ERC20TokenContract);

  const maxApproval = new BigNumber(2).pow(256).minus(1);
  console.log("approval amount: ", maxApproval);

  const tx = await ERC20TokenContract.methods
    .approve(swapQuoteJSON.allowanceTarget, maxApproval)
    .send({ from: takerAddress })
    .then((tx) => {
      console.log("tx: ", tx);
    });

  const receipt = await web3.eth.sendTransaction(swapQuoteJSON);
  console.log("receipt: ", receipt);
}

init();

function openModal(side) {
  currentSelectSide = side;
  document.getElementById("token_modal").style.display = "block";
}

function closeModal() {
  document.getElementById("token_modal").style.display = "none";
}

document.getElementById("login_button").onclick = connect;
document.getElementById("from_token_select").onclick = () => {
  openModal("from");
};
document.getElementById("to_token_select").onclick = () => {
  openModal("to");
};
document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_amount").onblur = getPrice;
document.getElementById("swap_button").onclick = trySwap;
