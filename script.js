// === Globals ===
let coins = [];  // full coin list from API
const maxCoins = 400; // top 400 coins

// DOM Elements
const investmentInput = document.getElementById('investment');

const buySearchInput = document.getElementById('buySearch');
const buyCoinSelect = document.getElementById('buyCoin');

const sellSearchInput = document.getElementById('sellSearch');
const sellCoinSelect = document.getElementById('sellCoin');

const calculateBtn = document.getElementById('calculateBtn');
const resultDiv = document.getElementById('result');


// --- Fetch top coins from CoinGecko ---
async function fetchTopCoins() {
  const coinsPage1 = await fetchCoinsPage(1);
  const coinsPage2 = await fetchCoinsPage(2);
  coins = coinsPage1.concat(coinsPage2).slice(0, maxCoins);
  populateSelect(buyCoinSelect, coins);
  populateSelect(sellCoinSelect, coins);
}

async function fetchCoinsPage(page) {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch coins');
  const data = await res.json();
  return data;
}

// --- Populate <select> options ---
function populateSelect(selectElem, coinList) {
  selectElem.innerHTML = '';
  coinList.forEach(coin => {
    const option = document.createElement('option');
    option.value = coin.id;
    option.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
    selectElem.appendChild(option);
  });
}

// --- Filter coins by search and update dropdown ---
function filterCoins(searchTerm, selectElem) {
  const filtered = coins.filter(coin =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );
  populateSelect(selectElem, filtered);
}


// --- Fetch live price of a coin in USD ---
async function fetchCoinPrice(coinId) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch price');
  const data = await res.json();
  return data[coinId]?.usd ?? null;
}


// --- Calculate return and display ---
async function calculateReturn() {
  const investment = parseFloat(investmentInput.value);
  if (!investment || investment <= 0) {
    resultDiv.textContent = 'Please enter a valid investment amount.';
    return;
  }

  const buyCoinId = buyCoinSelect.value;
  const sellCoinId = sellCoinSelect.value;

  if (!buyCoinId || !sellCoinId) {
    resultDiv.textContent = 'Please select both buy and sell coins.';
    return;
  }

  try {
    resultDiv.textContent = 'Fetching live prices...';

    const [buyPrice, sellPrice] = await Promise.all([
      fetchCoinPrice(buyCoinId),
      fetchCoinPrice(sellCoinId)
    ]);

    if (buyPrice === null || sellPrice === null) {
      resultDiv.textContent = 'Could not fetch price data. Try again later.';
      return;
    }

    // Calculate quantity bought
    const quantity = investment / buyPrice;
    const finalValue = quantity * sellPrice;
    const profit = finalValue - investment;
    const roi = (profit / investment) * 100;

    const profitStr = profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`;
    const roiStr = roi >= 0 ? `+${roi.toFixed(2)}%` : `${roi.toFixed(2)}%`;

    resultDiv.innerHTML = `
      Bought <strong>${quantity.toFixed(6)}</strong> coins at <strong>$${buyPrice}</strong> each.<br>
      Sold at <strong>$${sellPrice}</strong>.<br>
      Profit/Loss: <span style="color: ${profit >= 0 ? 'green' : 'red'};">${profitStr}</span><br>
      ROI: <span style="color: ${roi >= 0 ? 'green' : 'red'};">${roiStr}</span>
    `;
  } catch (error) {
    resultDiv.textContent = 'Error fetching data: ' + error.message;
  }
}


// --- Event Listeners for search inputs ---
buySearchInput.addEventListener('input', () => {
  filterCoins(buySearchInput.value, buyCoinSelect);
});

sellSearchInput.addEventListener('input', () => {
  filterCoins(sellSearchInput.value, sellCoinSelect);
});

// Calculate button click
calculateBtn.addEventListener('click', calculateReturn);


// --- Init app ---
fetchTopCoins().catch(e => {
  resultDiv.textContent = 'Failed to load coin list. Please refresh.';
});
