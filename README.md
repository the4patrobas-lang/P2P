<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TZS - USDT - INR Money Exchange Ledger</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="config.js"></script>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen pb-12">

  <div id="toast" class="fixed top-5 right-5 z-50 transform translate-x-full transition-transform duration-300 bg-emerald-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3">
    <i id="toast-icon" class="fas fa-check-circle text-lg"></i>
    <span id="toast-message" class="font-medium text-sm">Action successful</span>
  </div>

  <div id="auth-shell" class="min-h-screen flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-800/90 shadow-2xl shadow-slate-950/40 p-6">
      <div class="flex items-center justify-center mb-6">
        <div class="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-500/20">
          <i class="fas fa-coins text-2xl"></i>
        </div>
      </div>

      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-white">TZS-USDT-INR Ledger</h1>
        <p class="text-sm text-slate-400 mt-2">Secure account-based exchange tracking</p>
      </div>

      <div class="flex bg-slate-900 p-1 rounded-xl border border-slate-700 mb-6">
        <button id="auth-login-tab" class="auth-tab flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white transition">Login</button>
        <button id="auth-signup-tab" class="auth-tab flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-slate-400 transition">Create Account</button>
      </div>

      <form id="auth-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Email</label>
          <input id="auth-email" type="email" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="name@example.com">
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Password</label>
          <input id="auth-password" type="password" required minlength="6" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="At least 6 characters">
        </div>

        <button id="auth-submit-btn" type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2">
          <i class="fas fa-sign-in-alt"></i> <span>Login</span>
        </button>
      </form>

      <div class="mt-4 text-center">
        <button id="demo-mode-btn" class="text-xs text-emerald-400 hover:text-emerald-300 font-medium">Try local demo mode</button>
      </div>
    </div>
  </div>

  <div id="app-shell" class="hidden">
    <header class="bg-slate-800 border-b border-slate-700 sticky top-0 z-40 shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-3">
          <div class="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <i class="fas fa-coins text-xl"></i>
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight text-white">TZS <i class="fas fa-arrow-right text-xs text-blue-400 mx-1"></i> USDT <i class="fas fa-arrow-right text-xs text-emerald-400 mx-1"></i> INR Dashboard</h1>
            <p class="text-xs text-slate-400">Money Exchange Ledger & Automated Arbitrage Profit Tracker</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-3">
            <div class="flex items-center gap-2">
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span class="text-xs font-semibold text-slate-400">Google USD/INR:</span>
            </div>
            <span id="live-fx-display" class="text-sm font-bold text-emerald-400">Fetching...</span>
            <button onclick="fetchLiveGoogleRate()" title="Refresh FX Rate" class="text-slate-400 hover:text-white transition">
              <i class="fas fa-sync-alt text-xs"></i>
            </button>
          </div>

          <div id="user-tag" class="hidden text-xs text-slate-200 bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl"></div>

          <button onclick="logoutUser()" class="bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 rounded-xl text-sm transition flex items-center gap-2">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>

          <button onclick="exportToExcel()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition shadow-lg shadow-emerald-600/20 flex items-center gap-2">
            <i class="fas fa-file-excel"></i> Export Excel
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-slate-800 rounded-2xl p-6 border border-slate-700/60 shadow-lg flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Credited</span>
            <div class="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><i class="fas fa-wallet text-lg"></i></div>
          </div>
          <div class="mt-4">
            <h2 id="kpi-total-credited" class="text-2xl font-bold text-white">0 TZS</h2>
            <p class="text-xs text-slate-400 mt-1">Total TZS inflow received</p>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-700/50 flex justify-between text-xs text-slate-400">
            <span>Transactions: <strong id="kpi-tx-count" class="text-slate-200">0</strong></span>
            <span>USDT Bought: <strong id="kpi-total-usdt" class="text-slate-200">0.00</strong></span>
          </div>
        </div>

        <div class="bg-slate-800 rounded-2xl p-6 border border-slate-700/60 shadow-lg flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">2.5% Trade Cut (&gt;100k)</span>
            <div class="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><i class="fas fa-percentage text-lg"></i></div>
          </div>
          <div class="mt-4">
            <h2 id="kpi-bonus-profit" class="text-2xl font-bold text-purple-400">0.00 USDT</h2>
            <p class="text-xs text-slate-400 mt-1">Extra 2.5% profit on trades &gt; 100k TZS</p>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-700/50 flex justify-between text-xs text-slate-400">
            <span>Qualified Trades: <strong id="kpi-qualified-count" class="text-slate-200">0</strong></span>
            <span class="text-emerald-400 font-medium">+2.5% Auto-Added</span>
          </div>
        </div>

        <div class="bg-slate-800 rounded-2xl p-6 border border-slate-700/60 shadow-lg text-center flex flex-col justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Total Profit (USDT)</span>
          <div class="gauge-container">
            <canvas id="gaugeTotalProfit"></canvas>
            <div class="gauge-center">
              <span id="gauge-total-val" class="text-xl font-extrabold text-emerald-400">0.00</span>
              <span class="block text-[10px] text-slate-400 font-medium">USDT Total</span>
            </div>
          </div>
          <p class="text-xs text-slate-400 mt-2">Combined arbitrage + 2.5% cuts</p>
        </div>

        <div class="bg-slate-800 rounded-2xl p-6 border border-slate-700/60 shadow-lg text-center flex flex-col justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Avg Monthly Profit</span>
          <div class="gauge-container">
            <canvas id="gaugeAvgMonthlyProfit"></canvas>
            <div class="gauge-center">
              <span id="gauge-avg-val" class="text-xl font-extrabold text-amber-400">0.00</span>
              <span class="block text-[10px] text-slate-400 font-medium">USDT / Month</span>
            </div>
          </div>
          <p class="text-xs text-slate-400 mt-2">Average earnings per active month</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-1 bg-slate-800 rounded-2xl p-6 border border-slate-700/60 shadow-lg flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-700">
              <h3 class="text-lg font-bold text-white flex items-center gap-2"><i class="fas fa-plus-circle text-blue-400"></i> Record New Exchange</h3>
              <span class="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-medium">Live Rates</span>
            </div>

            <form id="tx-form" onsubmit="handleFormSubmit(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Transaction Date</label>
                <input type="date" id="tx-date" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Credited Amount (Tanzanian Shilling - TZS)</label>
                <div class="relative">
                  <input type="number" step="any" id="tx-credited" required placeholder="e.g. 250000" oninput="calculateLiveProfitPreview()" class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-12 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <span class="absolute right-3 top-2.5 text-xs font-semibold text-slate-500">TZS</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">USDT Received / Purchased</label>
                <div class="relative">
                  <input type="number" step="any" id="tx-usdt" required placeholder="e.g. 100.00" oninput="calculateLiveProfitPreview()" class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-14 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <span class="absolute right-3 top-2.5 text-xs font-semibold text-emerald-400">USDT</span>
                </div>
              </div>

              <div>
                <div class="flex justify-between items-center mb-1">
                  <label class="block text-xs font-semibold text-slate-300">Google Cost Rate (INR/USDT)</label>
                  <span class="text-[10px] text-emerald-400 font-medium"><i class="fas fa-magic"></i> Auto-fetched</span>
                </div>
                <div class="relative">
                  <input type="number" step="0.01" min="1" max="100" id="tx-google-cost" required placeholder="86.42" oninput="calculateLiveProfitPreview()" class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-12 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <span class="absolute right-3 top-2.5 text-xs font-semibold text-slate-500">INR ₹</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Binance Selling Rate (INR/USDT)</label>
                <div class="relative">
                  <input type="number" step="0.01" min="1" max="100" id="tx-binance-sell" required placeholder="e.g. 89.50" oninput="calculateLiveProfitPreview()" class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-12 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <span class="absolute right-3 top-2.5 text-xs font-semibold text-slate-500">INR ₹</span>
                </div>
              </div>

              <div class="bg-slate-900/90 border border-slate-700 rounded-xl p-4 space-y-2 text-xs">
                <div class="flex justify-between text-slate-400"><span>Arbitrage Margin:</span><span id="prev-margin" class="text-slate-200 font-medium">0.00 USDT</span></div>
                <div class="flex justify-between text-slate-400"><span>2.5% Bonus (&gt;100k TZS):</span><span id="prev-bonus" class="text-purple-400 font-medium">0.00 USDT</span></div>
                <div class="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm"><span class="text-slate-200">Total Net Profit:</span><span id="prev-total-profit" class="text-emerald-400">0.00 USDT</span></div>
              </div>

              <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"><i class="fas fa-save"></i> Log Transaction</button>
            </form>
          </div>
        </div>

        <div class="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700/60 shadow-lg flex flex-col justify-between">
          <div>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
              <div>
                <h3 class="text-lg font-bold text-white flex items-center gap-2"><i class="fas fa-chart-line text-emerald-400"></i> Financial Performance Analytics</h3>
                <p class="text-xs text-slate-400">Credited TZS volume vs USDT net profits gained over time</p>
              </div>
              <div class="flex bg-slate-900 p-1 rounded-xl border border-slate-700 self-start sm:self-auto">
                <button onclick="switchChartTab('monthly')" id="tab-btn-monthly" class="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white transition">Monthly</button>
                <button onclick="switchChartTab('weekly')" id="tab-btn-weekly" class="px-3 py-1 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition">Weekly</button>
                <button onclick="switchChartTab('daily')" id="tab-btn-daily" class="px-3 py-1 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition">Daily</button>
              </div>
            </div>

            <div class="mt-6 relative h-[320px]"><canvas id="performanceChart"></canvas></div>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-400 flex flex-wrap justify-between gap-2">
            <span><i class="fas fa-info-circle text-blue-400 mr-1"></i> Net Profit includes Binance spread arbitrage + automatic 2.5% cut on trades above 100,000 TZS.</span>
          </div>
        </div>
      </div>

      <div class="bg-slate-800 rounded-2xl border border-slate-700/60 shadow-lg overflow-hidden">
        <div class="p-6 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2"><i class="fas fa-table text-amber-400"></i> Aggregated Performance Summaries</h3>
            <p class="text-xs text-slate-400">Breakdown of Total Credited (TZS) & Total Net Profit (USDT)</p>
          </div>

          <div class="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button onclick="switchTableTab('monthly-summary')" id="tbl-btn-monthly" class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white transition">Monthly Breakdown</button>
            <button onclick="switchTableTab('weekly-summary')" id="tbl-btn-weekly" class="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition">Weekly Breakdown</button>
            <button onclick="switchTableTab('daily-summary')" id="tbl-btn-daily" class="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition">Daily Breakdown</button>
          </div>
        </div>

        <div id="summary-monthly-view" class="overflow-x-auto p-4">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900 text-xs uppercase text-slate-400 font-semibold">
              <tr>
                <th class="px-4 py-3 rounded-l-lg">Month / Year</th>
                <th class="px-4 py-3">Total Trades</th>
                <th class="px-4 py-3">Total Credited (TZS)</th>
                <th class="px-4 py-3">Total USDT Volume</th>
                <th class="px-4 py-3">2.5% Bonus Earned</th>
                <th class="px-4 py-3 text-right rounded-r-lg">Total Profit (USDT)</th>
              </tr>
            </thead>
            <tbody id="summary-monthly-body" class="divide-y divide-slate-700/50"></tbody>
          </table>
        </div>

        <div id="summary-weekly-view" class="overflow-x-auto p-4 hidden">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900 text-xs uppercase text-slate-400 font-semibold">
              <tr>
                <th class="px-4 py-3 rounded-l-lg">Week Period</th>
                <th class="px-4 py-3">Total Trades</th>
                <th class="px-4 py-3">Total Credited (TZS)</th>
                <th class="px-4 py-3">Total USDT Volume</th>
                <th class="px-4 py-3">2.5% Bonus Earned</th>
                <th class="px-4 py-3 text-right rounded-r-lg">Total Profit (USDT)</th>
              </tr>
            </thead>
            <tbody id="summary-weekly-body" class="divide-y divide-slate-700/50"></tbody>
          </table>
        </div>

        <div id="summary-daily-view" class="overflow-x-auto p-4 hidden">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900 text-xs uppercase text-slate-400 font-semibold">
              <tr>
                <th class="px-4 py-3 rounded-l-lg">Date</th>
                <th class="px-4 py-3">Total Trades</th>
                <th class="px-4 py-3">Total Credited (TZS)</th>
                <th class="px-4 py-3">Total USDT Volume</th>
                <th class="px-4 py-3">2.5% Bonus Earned</th>
                <th class="px-4 py-3 text-right rounded-r-lg">Total Profit (USDT)</th>
              </tr>
            </thead>
            <tbody id="summary-daily-body" class="divide-y divide-slate-700/50"></tbody>
          </table>
        </div>
      </div>

      <div class="bg-slate-800 rounded-2xl border border-slate-700/60 shadow-lg overflow-hidden">
        <div class="p-6 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2"><i class="fas fa-list-alt text-blue-400"></i> Money Exchange Transaction Ledger</h3>
            <p class="text-xs text-slate-400">All registered exchange entries with individual USDT profit logs</p>
          </div>

          <div class="flex items-center gap-3">
            <input type="text" id="ledger-search" placeholder="Search entries..." oninput="renderAll()" class="bg-slate-900 border border-slate-700 text-xs text-white px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
            <button onclick="clearAllData()" class="text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 px-3 py-2 rounded-xl bg-rose-500/10 transition"><i class="fas fa-trash-alt mr-1"></i> Clear Ledger</button>
          </div>
        </div>

        <div class="overflow-x-auto p-4">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900 text-xs uppercase text-slate-400 font-semibold">
              <tr>
                <th class="px-4 py-3 rounded-l-lg">Date</th>
                <th class="px-4 py-3">Credited (TZS)</th>
                <th class="px-4 py-3">USDT Bought</th>
                <th class="px-4 py-3">Google Rate</th>
                <th class="px-4 py-3">Binance Rate</th>
                <th class="px-4 py-3">2.5% Bonus</th>
                <th class="px-4 py-3">Net Profit (USDT)</th>
                <th class="px-4 py-3 text-center rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody id="ledger-body" class="divide-y divide-slate-700/50"></tbody>
          </table>
        </div>
      </div>
    </main>
  </div>

  <script src="app.js"></script>
</body>
</html>
