// ===== App config =====
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';

const useCloudStorage = SUPABASE_URL && SUPABASE_URL !== 'https://YOUR-PROJECT.supabase.co' && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'YOUR-ANON-KEY';

let currentUser = null;
let transactions = [];
let currentGoogleFxRate = 86.42;
let chartInstance = null;
let gaugeTotalChart = null;
let gaugeAvgChart = null;
let activeChartTab = 'monthly';
let isUsingCloud = false;
let supabase = null;

// ===== Init =====
document.getElementById('tx-date').valueAsDate = new Date();

if (useCloudStorage && window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const authLoginTab = document.getElementById('auth-login-tab');
const authSignupTab = document.getElementById('auth-signup-tab');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authForm = document.getElementById('auth-form');
const authShell = document.getElementById('auth-shell');
const appShell = document.getElementById('app-shell');

let authMode = 'login';

function setAuthMode(mode) {
  authMode = mode;
  const isLogin = mode === 'login';

  authLoginTab.classList.toggle('active', isLogin);
  authSignupTab.classList.toggle('active', !isLogin);
  authLoginTab.classList.toggle('text-white', isLogin);
  authLoginTab.classList.toggle('text-slate-400', !isLogin);
  authSignupTab.classList.toggle('text-white', !isLogin);
  authSignupTab.classList.toggle('text-slate-400', isLogin);

  authSubmitBtn.innerHTML = isLogin ? '<i class="fas fa-sign-in-alt"></i> <span>Login</span>' : '<i class="fas fa-user-plus"></i> <span>Create Account</span>';
}

authLoginTab.addEventListener('click', () => setAuthMode('login'));
authSignupTab.addEventListener('click', () => setAuthMode('signup'));

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value.trim();

  if (!email || !password) {
    showToast('Please fill in your email and password.', 'error');
    return;
  }

  if (!supabase && !useCloudStorage) {
    showToast('Cloud storage is not configured yet. Use demo mode or add Supabase credentials in app.js.', 'info');
    return;
  }

  try {
    if (authMode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      currentUser = data.user;
      showToast('Logged in successfully.', 'success');
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      currentUser = data.user;
      showToast('Account created. Check your email to confirm sign-in.', 'success');
    }

    await initializeSession();
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Authentication failed.', 'error');
  }
});

document.getElementById('demo-mode-btn').addEventListener('click', () => {
  currentUser = { id: 'demo-user', email: 'demo@local' };
  isUsingCloud = false;
  initializeSession();
});

async function initializeSession() {
  if (!supabase || !currentUser) {
    // fallback local mode
    const localData = JSON.parse(localStorage.getItem('tzs_usdt_transactions_demo')) || [];
    transactions = localData;
    isUsingCloud = false;
    showApp();
    renderAll();
    return;
  }

  isUsingCloud = true;
  const { data: transactionData, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('date', { ascending: false });

  if (error) {
    console.error(error);
    showToast('Could not load cloud data. Falling back to local data.', 'info');
    transactions = JSON.parse(localStorage.getItem(`tzs_usdt_transactions_${currentUser.id}`)) || [];
  } else {
    transactions = (transactionData || []).map((tx) => ({
      id: tx.id,
      date: tx.date,
      credited: Number(tx.credited),
      usdt: Number(tx.usdt),
      googleRate: Number(tx.google_rate),
      binanceRate: Number(tx.binance_rate),
      bonus25: Number(tx.bonus25),
      netProfit: Number(tx.net_profit)
    }));
    localStorage.setItem(`tzs_usdt_transactions_${currentUser.id}`, JSON.stringify(transactions));
  }

  showApp();
  renderAll();
}

async function logoutUser() {
  if (supabase && currentUser) {
    await supabase.auth.signOut();
  }

  currentUser = null;
  transactions = [];
  authShell.classList.remove('hidden');
  appShell.classList.add('hidden');
  authForm.reset();
  showToast('Logged out successfully.', 'success');
}

function showApp() {
  authShell.classList.add('hidden');
  appShell.classList.remove('hidden');

  const label = currentUser ? currentUser.email || 'Account user' : 'Demo mode';
  const userTag = document.getElementById('user-tag');
  userTag.innerText = label;
  userTag.classList.remove('hidden');
}

function normalizeTransactions(list = []) {
  return list.map((tx) => ({
    id: tx.id || Date.now() + Math.random(),
    date: tx.date,
    credited: Number(tx.credited || 0),
    usdt: Number(tx.usdt || 0),
    googleRate: Number(tx.googleRate || tx.google_rate || 0),
    binanceRate: Number(tx.binanceRate || tx.binance_rate || 0),
    bonus25: Number(tx.bonus25 || 0),
    netProfit: Number(tx.netProfit || tx.net_profit || 0)
  }));
}

function persistTransactions() {
  if (isUsingCloud && currentUser && supabase) {
    return;
  }

  const key = currentUser ? `tzs_usdt_transactions_${currentUser.id}` : 'tzs_usdt_transactions_demo';
  localStorage.setItem(key, JSON.stringify(transactions));
}

async function syncTransactionsToCloud() {
  if (!isUsingCloud || !currentUser || !supabase) return;

  const rows = transactions.map((tx) => ({
    id: tx.id,
    user_id: currentUser.id,
    date: tx.date,
    credited: tx.credited,
    usdt: tx.usdt,
    google_rate: tx.googleRate,
    binance_rate: tx.binanceRate,
    bonus25: tx.bonus25,
    net_profit: tx.netProfit
  }));

  const { error } = await supabase.from('transactions').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error(error);
    showToast('Cloud sync failed. Local data remains intact.', 'error');
  }
}

async function fetchLiveGoogleRate() {
  const display = document.getElementById('live-fx-display');
  display.innerText = 'Updating...';

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (data && data.rates && data.rates.INR) {
      currentGoogleFxRate = parseFloat(data.rates.INR.toFixed(2));
      display.innerText = `₹${currentGoogleFxRate} / USDT`;
      document.getElementById('tx-google-cost').value = currentGoogleFxRate;
      calculateLiveProfitPreview();
      showToast(`Google FX Rate updated: ₹${currentGoogleFxRate}`, 'success');
    } else {
      throw new Error('Invalid rate response');
    }
  } catch (err) {
    display.innerText = `₹${currentGoogleFxRate} (Fallback)`;
    document.getElementById('tx-google-cost').value = currentGoogleFxRate;
    showToast('Using standard Google FX rate', 'info');
  }
}

function calculateLiveProfitPreview() {
  const credited = parseFloat(document.getElementById('tx-credited').value) || 0;
  const usdt = parseFloat(document.getElementById('tx-usdt').value) || 0;
  const googleRate = parseFloat(document.getElementById('tx-google-cost').value) || 0;
  const binanceRate = parseFloat(document.getElementById('tx-binance-sell').value) || 0;

  let baseMarginUSDT = 0;
  if (binanceRate > 0 && googleRate > 0 && usdt > 0) {
    baseMarginUSDT = (usdt * (binanceRate - googleRate)) / binanceRate;
  }

  let bonusUSDT = 0;
  if (credited > 100000 && usdt > 0) {
    bonusUSDT = usdt * 0.025;
  }

  const netProfit = baseMarginUSDT + bonusUSDT;
  document.getElementById('prev-margin').innerText = `${baseMarginUSDT.toFixed(2)} USDT`;
  document.getElementById('prev-bonus').innerText = `${bonusUSDT.toFixed(2)} USDT`;
  document.getElementById('prev-total-profit').innerText = `${netProfit.toFixed(2)} USDT`;
}

function handleFormSubmit(e) {
  e.preventDefault();

  const date = document.getElementById('tx-date').value;
  const credited = parseFloat(document.getElementById('tx-credited').value);
  const usdt = parseFloat(document.getElementById('tx-usdt').value);
  const googleRate = parseFloat(document.getElementById('tx-google-cost').value);
  const binanceRate = parseFloat(document.getElementById('tx-binance-sell').value);

  if (!date || isNaN(credited) || isNaN(usdt) || isNaN(googleRate) || isNaN(binanceRate)) {
    showToast('Please fill out all required fields properly.', 'error');
    return;
  }

  const baseProfit = (usdt * (binanceRate - googleRate)) / binanceRate;
  const bonus25 = credited > 100000 ? usdt * 0.025 : 0;
  const netProfit = baseProfit + bonus25;

  const newTx = {
    id: Date.now(),
    date,
    credited,
    usdt,
    googleRate,
    binanceRate,
    bonus25,
    netProfit
  };

  transactions.unshift(newTx);
  transactions = normalizeTransactions(transactions);
  saveAndRender();

  document.getElementById('tx-credited').value = '';
  document.getElementById('tx-usdt').value = '';
  document.getElementById('tx-binance-sell').value = '';
  calculateLiveProfitPreview();

  showToast('Transaction logged successfully!', 'success');
}

function saveAndRender() {
  persistTransactions();
  if (isUsingCloud && currentUser && supabase) {
    syncTransactionsToCloud();
  }
  renderAll();
}

async function deleteTx(id) {
  if (confirm('Are you sure you want to delete this transaction entry?')) {
    transactions = transactions.filter((t) => t.id !== id);
    if (isUsingCloud && supabase && currentUser) {
      const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', currentUser.id);
      if (error) {
        console.error(error);
        showToast('Cloud delete failed.', 'error');
      }
    }
    saveAndRender();
    showToast('Transaction deleted.', 'info');
  }
}

function clearAllData() {
  if (confirm('Are you sure you want to clear ALL transaction ledger data?')) {
    transactions = [];
    saveAndRender();
    showToast('All transactions cleared.', 'info');
  }
}

function renderAll() {
  renderKPIsAndGauges();
  renderLedgerTable();
  renderSummaryTables();
  renderPerformanceChart();
}

function renderKPIsAndGauges() {
  const totalCredited = transactions.reduce((acc, t) => acc + t.credited, 0);
  const totalUSDT = transactions.reduce((acc, t) => acc + t.usdt, 0);
  const totalBonus = transactions.reduce((acc, t) => acc + (t.bonus25 || 0), 0);
  const qualifiedCount = transactions.filter((t) => t.credited > 100000).length;
  const totalNetProfit = transactions.reduce((acc, t) => acc + t.netProfit, 0);

  const uniqueMonths = new Set(transactions.map((t) => t.date.substring(0, 7)));
  const monthCount = uniqueMonths.size || 1;
  const avgMonthlyProfit = totalNetProfit / monthCount;

  document.getElementById('kpi-total-credited').innerText = `${totalCredited.toLocaleString()} TZS`;
  document.getElementById('kpi-tx-count').innerText = transactions.length;
  document.getElementById('kpi-total-usdt').innerText = totalUSDT.toFixed(2);
  document.getElementById('kpi-bonus-profit').innerText = `${totalBonus.toFixed(2)} USDT`;
  document.getElementById('kpi-qualified-count').innerText = qualifiedCount;
  document.getElementById('gauge-total-val').innerText = totalNetProfit.toFixed(2);
  document.getElementById('gauge-avg-val').innerText = avgMonthlyProfit.toFixed(2);

  updateGaugeChart('gaugeTotalProfit', totalNetProfit, 1000, '#10b981', gaugeTotalChart, chart => gaugeTotalChart = chart);
  updateGaugeChart('gaugeAvgMonthlyProfit', avgMonthlyProfit, 300, '#f59e0b', gaugeAvgChart, chart => gaugeAvgChart = chart);
}

function updateGaugeChart(canvasId, value, targetMax, color, chartVar, setChartVar) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  if (chartVar) chartVar.destroy();

  const remaining = Math.max(0, targetMax - value);

  const newChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [value, remaining],
        backgroundColor: [color, '#334155'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '78%',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { tooltip: { enabled: false } }
    }
  });

  setChartVar(newChart);
}

function renderLedgerTable() {
  const search = document.getElementById('ledger-search').value.toLowerCase();
  const body = document.getElementById('ledger-body');
  body.innerHTML = '';

  const filtered = transactions.filter((t) =>
    String(t.date).includes(search) ||
    String(t.credited).includes(search) ||
    String(t.netProfit.toFixed(2)).includes(search)
  );

  if (filtered.length === 0) {
    body.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-slate-500 text-sm">No transaction records found.</td></tr>';
    return;
  }

  filtered.forEach((t) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-700/30 transition';

    const bonusBadge = t.credited > 100000
      ? `<span class="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">+${(t.bonus25 || 0).toFixed(2)} USDT</span>`
      : '<span class="text-slate-500 text-xs">-</span>';

    tr.innerHTML = `
      <td class="px-4 py-3 font-medium text-slate-200">${t.date}</td>
      <td class="px-4 py-3 font-semibold text-white">${Number(t.credited).toLocaleString()} TZS</td>
      <td class="px-4 py-3 text-emerald-400 font-semibold">${Number(t.usdt).toFixed(2)} USDT</td>
      <td class="px-4 py-3 text-slate-300">₹${Number(t.googleRate).toFixed(2)}</td>
      <td class="px-4 py-3 text-slate-300">₹${Number(t.binanceRate).toFixed(2)}</td>
      <td class="px-4 py-3">${bonusBadge}</td>
      <td class="px-4 py-3 font-bold text-emerald-400">+${Number(t.netProfit).toFixed(2)} USDT</td>
      <td class="px-4 py-3 text-center">
        <button onclick="deleteTx(${t.id})" class="text-slate-400 hover:text-rose-400 transition p-1"><i class="fas fa-trash-alt text-xs"></i></button>
      </td>
    `;

    body.appendChild(tr);
  });
}

function renderSummaryTables() {
  const monthlyData = {};
  const weeklyData = {};
  const dailyData = {};

  transactions.forEach((t) => {
    const monthKey = t.date.substring(0, 7);
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { trades: 0, credited: 0, usdt: 0, bonus: 0, profit: 0 };
    monthlyData[monthKey].trades++;
    monthlyData[monthKey].credited += t.credited;
    monthlyData[monthKey].usdt += t.usdt;
    monthlyData[monthKey].bonus += t.bonus25 || 0;
    monthlyData[monthKey].profit += t.netProfit;

    const dayKey = t.date;
    if (!dailyData[dayKey]) dailyData[dayKey] = { trades: 0, credited: 0, usdt: 0, bonus: 0, profit: 0 };
    dailyData[dayKey].trades++;
    dailyData[dayKey].credited += t.credited;
    dailyData[dayKey].usdt += t.usdt;
    dailyData[dayKey].bonus += t.bonus25 || 0;
    dailyData[dayKey].profit += t.netProfit;

    const d = new Date(t.date);
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    const weekKey = `${d.getFullYear()} - Week ${weekNum}`;
    if (!weeklyData[weekKey]) weeklyData[weekKey] = { trades: 0, credited: 0, usdt: 0, bonus: 0, profit: 0 };
    weeklyData[weekKey].trades++;
    weeklyData[weekKey].credited += t.credited;
    weeklyData[weekKey].usdt += t.usdt;
    weeklyData[weekKey].bonus += t.bonus25 || 0;
    weeklyData[weekKey].profit += t.netProfit;
  });

  populateSummaryRows('summary-monthly-body', monthlyData);
  populateSummaryRows('summary-weekly-body', weeklyData);
  populateSummaryRows('summary-daily-body', dailyData);
}

function populateSummaryRows(elementId, dataObj) {
  const tbody = document.getElementById(elementId);
  tbody.innerHTML = '';

  const keys = Object.keys(dataObj).sort().reverse();
  if (keys.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-slate-500 text-xs">No transaction history available.</td></tr>';
    return;
  }

  keys.forEach((key) => {
    const item = dataObj[key];
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-700/30 transition';
    tr.innerHTML = `
      <td class="px-4 py-3 font-semibold text-slate-200">${key}</td>
      <td class="px-4 py-3 text-slate-300">${item.trades} trades</td>
      <td class="px-4 py-3 font-semibold text-white">${Number(item.credited).toLocaleString()} TZS</td>
      <td class="px-4 py-3 text-emerald-400 font-medium">${Number(item.usdt).toFixed(2)} USDT</td>
      <td class="px-4 py-3 text-purple-400 font-medium">+${Number(item.bonus).toFixed(2)} USDT</td>
      <td class="px-4 py-3 text-right font-bold text-emerald-400">+${Number(item.profit).toFixed(2)} USDT</td>
    `;
    tbody.appendChild(tr);
  });
}

function switchTableTab(tab) {
  document.getElementById('summary-monthly-view').classList.add('hidden');
  document.getElementById('summary-weekly-view').classList.add('hidden');
  document.getElementById('summary-daily-view').classList.add('hidden');

  document.getElementById('tbl-btn-monthly').className = 'px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition';
  document.getElementById('tbl-btn-weekly').className = 'px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition';
  document.getElementById('tbl-btn-daily').className = 'px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition';

  if (tab === 'monthly-summary') {
    document.getElementById('summary-monthly-view').classList.remove('hidden');
    document.getElementById('tbl-btn-monthly').className = 'px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white transition';
  } else if (tab === 'weekly-summary') {
    document.getElementById('summary-weekly-view').classList.remove('hidden');
    document.getElementById('tbl-btn-weekly').className = 'px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white transition';
  } else if (tab === 'daily-summary') {
    document.getElementById('summary-daily-view').classList.remove('hidden');
    document.getElementById('tbl-btn-daily').className = 'px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white transition';
  }
}

function switchChartTab(type) {
  activeChartTab = type;
  document.getElementById('tab-btn-monthly').className = 'px-3 py-1 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition';
  document.getElementById('tab-btn-weekly').className = 'px-3 py-1 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition';
  document.getElementById('tab-btn-daily').className = 'px-3 py-1 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition';

  document.getElementById(`tab-btn-${type}`).className = 'px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white transition';
  renderPerformanceChart();
}

function renderPerformanceChart() {
  const ctx = document.getElementById('performanceChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  const mapData = {};
  transactions.forEach((t) => {
    let key = t.date;
    if (activeChartTab === 'monthly') key = t.date.substring(0, 7);
    else if (activeChartTab === 'weekly') {
      const d = new Date(t.date);
      const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
      const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      key = `W${weekNum}-${d.getFullYear()}`;
    }

    if (!mapData[key]) mapData[key] = { credited: 0, profit: 0 };
    mapData[key].credited += t.credited;
    mapData[key].profit += t.netProfit;
  });

  const labels = Object.keys(mapData).sort();
  const creditedVals = labels.map((l) => mapData[l].credited);
  const profitVals = labels.map((l) => mapData[l].profit);

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['No Data'],
      datasets: [
        {
          label: 'Total Net Profit (USDT)',
          data: profitVals.length ? profitVals : [0],
          backgroundColor: '#10b981',
          borderRadius: 6,
          yAxisID: 'yProfit'
        },
        {
          label: 'Credited Volume (TZS)',
          data: creditedVals.length ? creditedVals : [0],
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          yAxisID: 'yCredited'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        yProfit: {
          type: 'linear',
          position: 'left',
          ticks: { color: '#10b981' },
          grid: { color: '#334155' },
          title: { display: true, text: 'USDT Profit', color: '#10b981' }
        },
        yCredited: {
          type: 'linear',
          position: 'right',
          ticks: { color: '#3b82f6' },
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'TZS Credited Volume', color: '#3b82f6' }
        }
      }
    }
  });
}

function exportToExcel() {
  if (transactions.length === 0) {
    showToast('No transactions to export!', 'error');
    return;
  }

  const wb = XLSX.utils.book_new();
  const ledgerData = transactions.map((t) => ({
    'Date': t.date,
    'Credited (TZS)': t.credited,
    'USDT Bought': t.usdt,
    'Google Cost Rate (INR)': t.googleRate,
    'Binance Sell Rate (INR)': t.binanceRate,
    '2.5% Cut Added (USDT)': t.bonus25,
    'Total Net Profit (USDT)': t.netProfit
  }));

  const wsLedger = XLSX.utils.json_to_sheet(ledgerData);
  XLSX.utils.book_append_sheet(wb, wsLedger, 'Transaction Ledger');
  XLSX.writeFile(wb, `TZS_USDT_Money_Exchange_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
  showToast('Excel file generated & downloaded!', 'success');
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-icon');

  msgEl.innerText = msg;

  if (type === 'error') {
    toast.className = 'fixed top-5 right-5 z-50 transform transition-transform duration-300 bg-rose-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3';
    iconEl.className = 'fas fa-exclamation-circle text-lg';
  } else if (type === 'info') {
    toast.className = 'fixed top-5 right-5 z-50 transform transition-transform duration-300 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3';
    iconEl.className = 'fas fa-info-circle text-lg';
  } else {
    toast.className = 'fixed top-5 right-5 z-50 transform transition-transform duration-300 bg-emerald-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3';
    iconEl.className = 'fas fa-check-circle text-lg';
  }

  toast.classList.remove('translate-x-full');
  setTimeout(() => toast.classList.add('translate-x-full'), 3000);
}

window.onload = async () => {
  setAuthMode('login');

  if (useCloudStorage && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.auth.getSession();
    if (data?.session?.user) {
      currentUser = data.session.user;
      isUsingCloud = true;
      await initializeSession();
      return;
    }
  }

  authShell.classList.remove('hidden');
  appShell.classList.add('hidden');
  fetchLiveGoogleRate();
};
