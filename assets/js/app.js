/* ================================================================
   Bottle Credits — Frontend Test App
   Covers every API endpoint.
   ================================================================ */

const API = '/api/v1';

// ─── State ──────────────────────────────────────────────────────
const state = {
  token: localStorage.getItem('bc_token') || null,
  user: JSON.parse(localStorage.getItem('bc_user') || 'null'),
  view: 'wallets',
};

// ─── API Helper ─────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (state.token) opts.headers['Authorization'] = 'Bearer ' + state.token;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── Toast ──────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + type;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 3500);
}

// ─── Modal ──────────────────────────────────────────────────────
function closeModal() { document.getElementById('qr-modal').classList.add('hidden'); }

// ─── Auth Helpers ───────────────────────────────────────────────
function fillLogin(phone, pw) {
  document.getElementById('login-phone').value = phone;
  document.getElementById('login-password').value = pw;
}

function setAuth(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('bc_token', token);
  localStorage.setItem('bc_user', JSON.stringify(user));
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('bc_token');
  localStorage.removeItem('bc_user');
  showAuthScreen();
}

// ─── Screens ────────────────────────────────────────────────────
function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('hidden');
}

function showAppScreen() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  renderHeader();
  renderNav();
  navigate(state.user.role === 'admin' ? 'dashboard' : state.user.role === 'staff' ? 'redeem' : 'wallets');
}

// ─── Header ─────────────────────────────────────────────────────
function renderHeader() {
  const badge = document.getElementById('user-badge');
  badge.textContent = state.user.role;
  badge.className = 'user-badge ' + state.user.role;
  document.getElementById('user-name').textContent = state.user.name;
}

// ─── Navigation ─────────────────────────────────────────────────
function renderNav() {
  const nav = document.getElementById('app-nav');
  const role = state.user.role;
  const items = [];

  if (role === 'customer') {
    items.push({ id: 'wallets', label: 'My Wallets' });
    items.push({ id: 'bars', label: 'Bars & Plans' });
  }
  if (role === 'staff' || role === 'admin') {
    items.push({ id: 'redeem', label: 'Scan & Redeem' });
  }
  if (role === 'admin') {
    items.push({ id: 'dashboard', label: 'Dashboard' });
    items.push({ id: 'plans', label: 'Bottle Plans' });
    items.push({ id: 'assign', label: 'Assign Bottle' });
    items.push({ id: 'transactions', label: 'Transactions' });
    items.push({ id: 'staff-activity', label: 'Staff Activity' });
    items.push({ id: 'customers', label: 'Customers' });
    items.push({ id: 'sales', label: 'Sales' });
    items.push({ id: 'create-staff', label: 'Create Staff' });
  }
  if (role === 'admin' || role === 'staff') {
    items.push({ id: 'admin-wallets', label: 'All Wallets' });
  }
  items.push({ id: 'profile', label: 'Profile' });

  nav.innerHTML = items.map(i =>
    `<button class="nav-btn" data-view="${i.id}">${i.label}</button>`
  ).join('');
}

function navigate(view) {
  state.view = view;
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.view === view)
  );
  const main = document.getElementById('main-content');
  main.innerHTML = '<div class="loading">Loading...</div>';

  const views = {
    wallets: renderWallets,
    bars: renderBars,
    redeem: renderRedeem,
    dashboard: renderDashboard,
    plans: renderPlans,
    assign: renderAssign,
    transactions: renderTransactions,
    'staff-activity': renderStaffActivity,
    customers: renderCustomers,
    sales: renderSales,
    'create-staff': renderCreateStaff,
    'admin-wallets': renderAdminWallets,
    profile: renderProfile,
  };

  (views[view] || renderProfile)();
}

// ─── Util ───────────────────────────────────────────────────────
function ts(epoch) {
  if (!epoch) return '—';
  return new Date(epoch).toLocaleString();
}

function pct(rem, total) {
  return total ? Math.round((rem / total) * 100) : 0;
}

// ================================================================
//  VIEW RENDERERS
// ================================================================

// ─── Customer: My Wallets ───────────────────────────────────────
async function renderWallets() {
  const main = document.getElementById('main-content');
  try {
    const { data } = await api('GET', '/wallets');
    const wallets = data.wallets;

    if (!wallets.length) {
      main.innerHTML = `<div class="empty-state"><div class="empty-icon">🍷</div><p>No wallets yet. Visit a bar and purchase a bottle plan!</p></div>`;
      return;
    }

    main.innerHTML = `
      <div class="section-header"><h2>My Wallets</h2></div>
      ${wallets.map(w => `
        <div class="wallet-card ${w.status}">
          <div class="wallet-info">
            <h4>${w.brandName}</h4>
            <p>Bar: ${w.bar?.name || 'Bar #' + (w.bar?.id || w.bar)} &nbsp; <span class="badge badge-${w.status}">${w.status}</span></p>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct(w.remainingCredits, w.totalCredits)}%"></div></div>
          </div>
          <div class="wallet-credits">
            <div class="credits">${w.remainingCredits}</div>
            <div class="total">/ ${w.totalCredits} ml</div>
          </div>
          <div class="wallet-actions">
            ${w.status === 'active' ? `<button class="btn btn-primary btn-sm" onclick="generateQR(${w.id})">Generate QR</button>` : ''}
            <button class="btn btn-outline btn-sm" onclick="viewTransactions(${w.id})">History</button>
          </div>
        </div>
      `).join('')}
    `;
  } catch (e) { main.innerHTML = `<div class="card">${e.message}</div>`; toast(e.message, 'error'); }
}

// ─── Customer: Generate QR ──────────────────────────────────────
async function generateQR(walletId) {
  try {
    const { data } = await api('POST', `/wallets/${walletId}/qr`);
    const modal = document.getElementById('qr-modal');
    document.getElementById('qr-modal-body').innerHTML = `
      <div class="qr-display">
        <div class="credits-info">${data.qrToken.brandName}</div>
        <img src="${data.qrCode}" alt="QR Code">
        <div class="credits-info">${data.qrToken.remainingCredits} credits remaining</div>
        <div class="token-text">Token: ${data.qrToken.token}</div>
        <div class="expiry">⏰ Expires in 2 minutes</div>
        <button class="btn btn-sm btn-outline" style="margin-top:12px" onclick="navigator.clipboard.writeText('${data.qrToken.token}');toast('Token copied!','success')">Copy Token</button>
      </div>
    `;
    modal.classList.remove('hidden');
    toast('QR code generated!', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

// ─── Customer/Admin: Wallet Transactions ────────────────────────
async function viewTransactions(walletId) {
  const main = document.getElementById('main-content');
  try {
    const { data } = await api('GET', `/wallets/${walletId}/transactions`);
    main.innerHTML = `
      <div class="section-header">
        <h2>${data.brandName} — Transactions</h2>
        <button class="btn btn-sm btn-outline" onclick="navigate('${state.user.role === 'customer' ? 'wallets' : 'admin-wallets'}')">← Back</button>
      </div>
      <div class="card">
        <p style="margin-bottom:12px"><strong>Remaining:</strong> ${data.remainingCredits} ml</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Type</th><th>Amount</th><th>Peg</th><th>Before</th><th>After</th><th>Note</th><th>Time</th></tr></thead>
            <tbody>
              ${data.transactions.map(t => `
                <tr>
                  <td><span class="badge badge-${t.type.toLowerCase()}">${t.type}</span></td>
                  <td>${t.amount} ml</td>
                  <td>${t.pegSize ? t.pegSize + ' ml' : '—'}</td>
                  <td>${t.balanceBefore}</td>
                  <td>${t.balanceAfter}</td>
                  <td>${t.note || '—'}</td>
                  <td>${ts(t.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (e) { toast(e.message, 'error'); }
}

// ─── Customer: Bars & Plans ─────────────────────────────────────
async function renderBars() {
  const main = document.getElementById('main-content');
  try {
    const { data } = await api('GET', '/bars');
    main.innerHTML = `
      <div class="section-header"><h2>Bars & Plans</h2></div>
      ${data.bars.map(b => `
        <div class="card">
          <div class="card-header"><h3>${b.name}</h3><span class="badge badge-active">${b.city}</span></div>
          <p style="color:var(--text-light);margin-bottom:12px">${b.address}</p>
          <div id="bar-plans-${b.id}"><button class="btn btn-sm btn-outline" onclick="loadBarPlans(${b.id})">View Bottle Plans</button></div>
        </div>
      `).join('')}
      ${!data.bars.length ? '<div class="empty-state"><div class="empty-icon">🏪</div><p>No bars available yet.</p></div>' : ''}
    `;
  } catch (e) { toast(e.message, 'error'); }
}

async function loadBarPlans(barId) {
  try {
    const { data } = await api('GET', `/bottle-plans?barId=${barId}`);
    const el = document.getElementById('bar-plans-' + barId);
    if (!data.bottlePlans.length) { el.innerHTML = '<p style="color:var(--text-light)">No plans available.</p>'; return; }
    el.innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Brand</th><th>Category</th><th>Size</th><th>Price</th></tr></thead>
        <tbody>${data.bottlePlans.map(p => `<tr><td>${p.brandName}</td><td>${p.category}</td><td>${p.totalMl} ml</td><td>₹${p.price}</td></tr>`).join('')}</tbody>
      </table></div>
    `;
  } catch (e) { toast(e.message, 'error'); }
}

// ─── Staff/Admin: Scan & Redeem ─────────────────────────────────
function renderRedeem() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="section-header"><h2>Scan & Redeem</h2></div>

    <div class="card">
      <div class="card-header"><h3>Step 1: Validate QR Token</h3></div>
      <div class="form-group">
        <label>QR Token (UUID)</label>
        <input type="text" id="redeem-token" placeholder="Paste the QR token here">
      </div>
      <button class="btn btn-primary" onclick="validateQR()">Validate Token</button>
    </div>

    <div id="redeem-step2" class="hidden">
      <div class="card">
        <div class="card-header"><h3>Step 2: Select Peg Size & Redeem</h3></div>
        <div id="redeem-wallet-info"></div>
        <p style="margin:16px 0;font-weight:600;text-align:center">Select peg size:</p>
        <div class="peg-buttons">
          <button class="peg-btn" data-peg="30" onclick="selectPeg(this)">30<span>ml</span></button>
          <button class="peg-btn" data-peg="60" onclick="selectPeg(this)">60<span>ml</span></button>
          <button class="peg-btn" data-peg="90" onclick="selectPeg(this)">90<span>ml</span></button>
        </div>
        <button class="btn btn-success btn-block" id="redeem-btn" disabled onclick="redeemCredits()">Redeem Credits</button>
      </div>
    </div>

    <div id="redeem-result" class="hidden"></div>
  `;
}

let selectedPeg = null;

function selectPeg(btn) {
  selectedPeg = parseInt(btn.dataset.peg);
  document.querySelectorAll('.peg-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('redeem-btn').disabled = false;
}

async function validateQR() {
  const token = document.getElementById('redeem-token').value.trim();
  if (!token) { toast('Enter a token', 'error'); return; }
  try {
    const { data } = await api('POST', '/qr/validate', { token });
    document.getElementById('redeem-step2').classList.remove('hidden');
    document.getElementById('redeem-wallet-info').innerHTML = `
      <div style="text-align:center">
        <div style="font-size:20px;font-weight:800;color:var(--primary)">${data.brandName}</div>
        <div style="margin:8px 0">
          <span style="font-size:28px;font-weight:800">${data.remainingCredits}</span>
          <span style="color:var(--text-light)"> / ${data.totalCredits} credits</span>
        </div>
        <div class="progress-bar" style="max-width:300px;margin:0 auto"><div class="progress-fill" style="width:${pct(data.remainingCredits, data.totalCredits)}%"></div></div>
      </div>
    `;
    selectedPeg = null;
    document.querySelectorAll('.peg-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('redeem-btn').disabled = true;
    toast('Token is valid!', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

async function redeemCredits() {
  const token = document.getElementById('redeem-token').value.trim();
  if (!token || !selectedPeg) { toast('Validate token and select peg size first', 'error'); return; }
  try {
    const { data } = await api('POST', '/redeem', { token, pegSize: selectedPeg });
    const r = data.redemption;
    document.getElementById('redeem-result').classList.remove('hidden');
    document.getElementById('redeem-result').innerHTML = `
      <div class="card" style="border-left:4px solid var(--success)">
        <h3 style="color:var(--success);margin-bottom:12px">✓ Redemption Successful!</h3>
        <div class="table-wrap"><table>
          <tr><td><strong>Brand</strong></td><td>${r.brandName}</td></tr>
          <tr><td><strong>Peg Size</strong></td><td>${r.pegSize} ml</td></tr>
          <tr><td><strong>Credits Deducted</strong></td><td>${r.creditsDeducted}</td></tr>
          <tr><td><strong>Balance Before</strong></td><td>${r.balanceBefore}</td></tr>
          <tr><td><strong>Balance After</strong></td><td>${r.balanceAfter}</td></tr>
          <tr><td><strong>Wallet Status</strong></td><td><span class="badge badge-${r.walletStatus}">${r.walletStatus}</span></td></tr>
          <tr><td><strong>Staff</strong></td><td>${r.staffName} (#${r.staffId})</td></tr>
        </table></div>
      </div>
    `;
    document.getElementById('redeem-step2').classList.add('hidden');
    document.getElementById('redeem-token').value = '';
    toast(`Redeemed ${r.pegSize}ml of ${r.brandName}`, 'success');
  } catch (e) { toast(e.message, 'error'); }
}

// ─── Admin: Dashboard ───────────────────────────────────────────
async function renderDashboard() {
  const main = document.getElementById('main-content');
  try {
    const { data } = await api('GET', '/admin/dashboard');
    const o = data.overview;
    main.innerHTML = `
      <div class="section-header"><h2>Dashboard</h2></div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${o.totalWallets}</div><div class="stat-label">Total Wallets</div></div>
        <div class="stat-card"><div class="stat-value">${o.activeWallets}</div><div class="stat-label">Active Wallets</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--success)">${o.totalCreditsIssued}</div><div class="stat-label">Credits Issued</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--warning)">${o.totalCreditsRedeemed}</div><div class="stat-label">Credits Redeemed</div></div>
        <div class="stat-card"><div class="stat-value">${o.totalCreditsRemaining}</div><div class="stat-label">Credits Remaining</div></div>
        <div class="stat-card"><div class="stat-value">${o.uniqueCustomers}</div><div class="stat-label">Unique Customers</div></div>
        <div class="stat-card"><div class="stat-value">${o.staffCount}</div><div class="stat-label">Staff Members</div></div>
        <div class="stat-card"><div class="stat-value">${o.activePlans}</div><div class="stat-label">Active Plans</div></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Recent Transactions</h3></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Type</th><th>Brand</th><th>Amount</th><th>Peg</th><th>Wallet</th><th>Customer</th><th>Staff</th><th>Time</th></tr></thead>
          <tbody>${data.recentTransactions.map(t => `
            <tr>
              <td><span class="badge badge-${t.type.toLowerCase()}">${t.type}</span></td>
              <td>${t.brandName}</td>
              <td>${t.amount} ml</td>
              <td>${t.pegSize ? t.pegSize + ' ml' : '—'}</td>
              <td>#${t.walletId}</td>
              <td>#${t.userId}</td>
              <td>${t.staffId ? '#' + t.staffId : '—'}</td>
              <td>${ts(t.createdAt)}</td>
            </tr>
          `).join('')}</tbody>
        </table></div>
      </div>
    `;
  } catch (e) { toast(e.message, 'error'); }
}

// ─── Admin: Bottle Plans ────────────────────────────────────────
async function renderPlans() {
  const main = document.getElementById('main-content');
  try {
    const { data } = await api('GET', '/bottle-plans');
    main.innerHTML = `
      <div class="section-header">
        <h2>Bottle Plans</h2>
        <button class="btn btn-primary btn-sm" onclick="showCreatePlan()">+ New Plan</button>
      </div>
      <div id="plan-form-area"></div>
      <div class="card">
        <div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>Brand</th><th>Category</th><th>Size</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${data.bottlePlans.map(p => `
            <tr>
              <td>${p.id}</td>
              <td>${p.brandName}</td>
              <td>${p.category}</td>
              <td>${p.totalMl} ml</td>
              <td>₹${p.price}</td>
              <td><span class="badge badge-${p.isActive ? 'active' : 'exhausted'}">${p.isActive ? 'Active' : 'Inactive'}</span></td>
              <td><button class="btn btn-sm btn-outline" onclick="togglePlan(${p.id}, ${!p.isActive})">${p.isActive ? 'Disable' : 'Enable'}</button></td>
            </tr>
          `).join('')}</tbody>
        </table></div>
      </div>
    `;
  } catch (e) { toast(e.message, 'error'); }
}

function showCreatePlan() {
  document.getElementById('plan-form-area').innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Create New Plan</h3></div>
      <div class="form-row">
        <div class="form-group"><label>Brand Name</label><input type="text" id="plan-brand" placeholder="e.g. Johnnie Walker"></div>
        <div class="form-group"><label>Category</label>
          <select id="plan-category"><option value="whisky">Whisky</option><option value="vodka">Vodka</option><option value="rum">Rum</option><option value="gin">Gin</option><option value="tequila">Tequila</option><option value="wine">Wine</option><option value="beer">Beer</option><option value="other">Other</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Total ML</label><input type="number" id="plan-ml" value="750"></div>
        <div class="form-group"><label>Price (₹)</label><input type="number" id="plan-price" placeholder="e.g. 4500"></div>
      </div>
      <div class="btn-group"><button class="btn btn-success" onclick="createPlan()">Create Plan</button><button class="btn btn-outline" onclick="document.getElementById('plan-form-area').innerHTML=''">Cancel</button></div>
    </div>
  `;
}

async function createPlan() {
  try {
    await api('POST', '/bottle-plans', {
      brandName: document.getElementById('plan-brand').value,
      category: document.getElementById('plan-category').value,
      totalMl: parseInt(document.getElementById('plan-ml').value),
      price: parseFloat(document.getElementById('plan-price').value),
    });
    toast('Plan created!', 'success');
    renderPlans();
  } catch (e) { toast(e.message, 'error'); }
}

async function togglePlan(id, activate) {
  try {
    await api('PUT', `/bottle-plans/${id}`, { isActive: activate });
    toast(`Plan ${activate ? 'activated' : 'deactivated'}`, 'success');
    renderPlans();
  } catch (e) { toast(e.message, 'error'); }
}

// ─── Admin: Assign Bottle ───────────────────────────────────────
async function renderAssign() {
  const main = document.getElementById('main-content');
  try {
    const { data: planData } = await api('GET', '/bottle-plans');
    main.innerHTML = `
      <div class="section-header"><h2>Assign Bottle to Customer</h2></div>
      <div class="card">
        <div class="form-group"><label>Customer ID</label><input type="number" id="assign-customer" placeholder="Enter customer user ID"></div>
        <div class="form-group"><label>Bottle Plan</label>
          <select id="assign-plan">
            <option value="">Select a plan...</option>
            ${planData.bottlePlans.map(p => `<option value="${p.id}">${p.brandName} — ${p.totalMl}ml — ₹${p.price}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-success" onclick="assignBottle()">Assign & Create Wallet</button>
      </div>
      <div id="assign-result"></div>
    `;
  } catch (e) { toast(e.message, 'error'); }
}

async function assignBottle() {
  const customerId = parseInt(document.getElementById('assign-customer').value);
  const bottlePlanId = parseInt(document.getElementById('assign-plan').value);
  if (!customerId || !bottlePlanId) { toast('Select customer and plan', 'error'); return; }
  try {
    const { data, message } = await api('POST', '/wallets', { customerId, bottlePlanId });
    document.getElementById('assign-result').innerHTML = `
      <div class="card" style="border-left:4px solid var(--success)">
        <h3 style="color:var(--success)">✓ ${message}</h3>
        <p>Wallet ID: <strong>#${data.wallet.id}</strong></p>
        <p>Credits: <strong>${data.wallet.totalCredits}</strong></p>
      </div>
    `;
    toast(message, 'success');
  } catch (e) { toast(e.message, 'error'); }
}

// ─── Admin: Transactions ────────────────────────────────────────
async function renderTransactions() {
  const main = document.getElementById('main-content');
  try {
    const { data } = await api('GET', '/admin/transactions');
    main.innerHTML = `
      <div class="section-header">
        <h2>Transaction Ledger</h2>
        <span style="color:var(--text-light)">${data.pagination.total} total</span>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="form-row" style="align-items:end">
          <div class="form-group"><label>Type</label><select id="txn-type"><option value="">All</option><option value="CREDIT">Credit</option><option value="DEBIT">Debit</option></select></div>
          <div class="form-group"><label>Staff ID</label><input type="number" id="txn-staff" placeholder="Optional"></div>
          <div class="form-group"><label>Customer ID</label><input type="number" id="txn-user" placeholder="Optional"></div>
          <div class="form-group"><label>&nbsp;</label><button class="btn btn-primary btn-block" onclick="filterTransactions()">Filter</button></div>
        </div>
      </div>
      <div id="txn-table" class="card">
        ${renderTxnTable(data.transactions)}
      </div>
    `;
  } catch (e) { toast(e.message, 'error'); }
}

function renderTxnTable(transactions) {
  return `
    <div class="table-wrap"><table>
      <thead><tr><th>Type</th><th>Brand</th><th>Amount</th><th>Peg</th><th>Before→After</th><th>Wallet</th><th>Customer</th><th>Staff</th><th>Time</th></tr></thead>
      <tbody>${transactions.map(t => `
        <tr>
          <td><span class="badge badge-${t.type.toLowerCase()}">${t.type}</span></td>
          <td>${t.brandName}</td>
          <td>${t.amount} ml</td>
          <td>${t.pegSize ? t.pegSize + ' ml' : '—'}</td>
          <td>${t.balanceBefore} → ${t.balanceAfter}</td>
          <td>#${t.walletId}</td>
          <td>#${t.userId}</td>
          <td>${t.staffId ? '#' + t.staffId : '—'}</td>
          <td>${ts(t.createdAt)}</td>
        </tr>
      `).join('')}</tbody>
    </table></div>
  `;
}

async function filterTransactions() {
  const type = document.getElementById('txn-type').value;
  const staffId = document.getElementById('txn-staff').value;
  const userId = document.getElementById('txn-user').value;
  let qs = '?limit=100';
  if (type) qs += `&type=${type}`;
  if (staffId) qs += `&staffId=${staffId}`;
  if (userId) qs += `&userId=${userId}`;
  try {
    const { data } = await api('GET', '/admin/transactions' + qs);
    document.getElementById('txn-table').innerHTML = renderTxnTable(data.transactions);
  } catch (e) { toast(e.message, 'error'); }
}

// ─── Admin: Staff Activity ──────────────────────────────────────
async function renderStaffActivity() {
  const main = document.getElementById('main-content');
  try {
    const { data } = await api('GET', '/admin/staff-activity');
    main.innerHTML = `
      <div class="section-header"><h2>Staff Activity</h2></div>
      ${!data.staffActivity.length ? '<div class="empty-state"><div class="empty-icon">👥</div><p>No staff members yet.</p></div>' : `
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>Staff ID</th><th>Name</th><th>Phone</th><th>Redemptions</th><th>Total ML Redeemed</th><th>Last Active</th></tr></thead>
        <tbody>${data.staffActivity.map(s => `
          <tr>
            <td>#${s.staffId}</td>
            <td>${s.staffName}</td>
            <td>${s.staffPhone}</td>
            <td><strong>${s.totalRedemptions}</strong></td>
            <td>${s.totalMlRedeemed} ml</td>
            <td>${ts(s.lastActive)}</td>
          </tr>
        `).join('')}</tbody>
      </table></div></div>`}
    `;
  } catch (e) { toast(e.message, 'error'); }
}

// ─── Admin: Customers ───────────────────────────────────────────
async function renderCustomers() {
  const main = document.getElementById('main-content');
  try {
    const { data } = await api('GET', '/admin/customers');
    main.innerHTML = `
      <div class="section-header"><h2>Customers</h2></div>
      ${!data.customers.length ? '<div class="empty-state"><div class="empty-icon">👤</div><p>No customers with wallets yet.</p></div>' : data.customers.map(c => `
        <div class="card">
          <div class="card-header">
            <h3>${c.name} <span style="font-weight:400;color:var(--text-light)">(#${c.customerId})</span></h3>
            <span style="color:var(--text-light)">${c.phone}</span>
          </div>
          <div style="display:flex;gap:20px;margin-bottom:12px">
            <div><strong>${c.totalCredits}</strong> <span style="color:var(--text-light)">total</span></div>
            <div><strong>${c.remainingCredits}</strong> <span style="color:var(--text-light)">remaining</span></div>
            <div><strong>${c.wallets.length}</strong> <span style="color:var(--text-light)">wallets</span></div>
          </div>
          <div class="table-wrap"><table>
            <thead><tr><th>Wallet</th><th>Brand</th><th>Credits</th><th>Status</th></tr></thead>
            <tbody>${c.wallets.map(w => `
              <tr>
                <td>#${w.walletId}</td>
                <td>${w.brandName}</td>
                <td>${w.remainingCredits} / ${w.totalCredits}</td>
                <td><span class="badge badge-${w.status}">${w.status}</span></td>
              </tr>
            `).join('')}</tbody>
          </table></div>
        </div>
      `).join('')}
    `;
  } catch (e) { toast(e.message, 'error'); }
}

// ─── Admin: Sales ───────────────────────────────────────────────
async function renderSales() {
  const main = document.getElementById('main-content');
  try {
    const { data } = await api('GET', '/admin/sales');
    main.innerHTML = `
      <div class="section-header"><h2>Sales Report</h2></div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value" style="color:var(--success)">₹${data.totalRevenue.toLocaleString()}</div><div class="stat-label">Total Revenue</div></div>
        <div class="stat-card"><div class="stat-value">${data.totalBottlesSold}</div><div class="stat-label">Bottles Sold</div></div>
      </div>
      ${data.salesByBrand.length ? `
      <div class="card">
        <div class="card-header"><h3>Sales by Brand</h3></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Brand</th><th>Bottles Sold</th><th>Revenue</th><th>Total ML</th><th>ML Redeemed</th><th>Utilization</th></tr></thead>
          <tbody>${data.salesByBrand.map(s => `
            <tr>
              <td><strong>${s.brandName}</strong></td>
              <td>${s.bottlesSold}</td>
              <td>₹${s.totalRevenue.toLocaleString()}</td>
              <td>${s.totalMl} ml</td>
              <td>${s.mlRedeemed} ml</td>
              <td>
                <div class="progress-bar" style="width:100px;display:inline-block;vertical-align:middle"><div class="progress-fill" style="width:${pct(s.mlRedeemed, s.totalMl)}%"></div></div>
                ${pct(s.mlRedeemed, s.totalMl)}%
              </td>
            </tr>
          `).join('')}</tbody>
        </table></div>
      </div>` : ''}
    `;
  } catch (e) { toast(e.message, 'error'); }
}

// ─── Admin: Create Staff ────────────────────────────────────────
function renderCreateStaff() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="section-header"><h2>Create Staff / Admin</h2></div>
    <div class="card">
      <div class="form-row">
        <div class="form-group"><label>Name</label><input type="text" id="staff-name" placeholder="Full name"></div>
        <div class="form-group"><label>Phone</label><input type="text" id="staff-phone" placeholder="Phone number"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Password</label><input type="password" id="staff-password" placeholder="Password"></div>
        <div class="form-group"><label>Role</label>
          <select id="staff-role"><option value="staff">Staff</option><option value="admin">Admin</option></select>
        </div>
      </div>
      <div class="form-group"><label>Email (optional)</label><input type="email" id="staff-email" placeholder="Email"></div>
      <button class="btn btn-success" onclick="createStaffUser()">Create Account</button>
    </div>
    <div id="staff-result"></div>
  `;
}

async function createStaffUser() {
  try {
    const body = {
      name: document.getElementById('staff-name').value,
      phone: document.getElementById('staff-phone').value,
      password: document.getElementById('staff-password').value,
      role: document.getElementById('staff-role').value,
    };
    const email = document.getElementById('staff-email').value;
    if (email) body.email = email;

    const { data, message } = await api('POST', '/auth/create-staff', body);
    document.getElementById('staff-result').innerHTML = `
      <div class="card" style="border-left:4px solid var(--success)">
        <h3 style="color:var(--success)">✓ ${message}</h3>
        <p>User ID: <strong>#${data.user.id}</strong> | Phone: <strong>${data.user.phone}</strong> | Role: <strong>${data.user.role}</strong></p>
      </div>
    `;
    toast(message, 'success');
  } catch (e) { toast(e.message, 'error'); }
}

// ─── Admin/Staff: All Wallets ───────────────────────────────────
async function renderAdminWallets() {
  const main = document.getElementById('main-content');
  try {
    const { data } = await api('GET', '/wallets');
    main.innerHTML = `
      <div class="section-header"><h2>All Wallets</h2></div>
      ${!data.wallets.length ? '<div class="empty-state"><div class="empty-icon">🍷</div><p>No wallets yet.</p></div>' :
      data.wallets.map(w => `
        <div class="wallet-card ${w.status}">
          <div class="wallet-info">
            <h4>${w.brandName}</h4>
            <p>Wallet #${w.id} &nbsp;|&nbsp; Customer: ${w.owner?.name || '#' + (w.owner?.id || w.owner)} &nbsp;|&nbsp; <span class="badge badge-${w.status}">${w.status}</span></p>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct(w.remainingCredits, w.totalCredits)}%"></div></div>
          </div>
          <div class="wallet-credits">
            <div class="credits">${w.remainingCredits}</div>
            <div class="total">/ ${w.totalCredits} ml</div>
          </div>
          <div class="wallet-actions">
            <button class="btn btn-outline btn-sm" onclick="viewTransactions(${w.id})">History</button>
          </div>
        </div>
      `).join('')}
    `;
  } catch (e) { toast(e.message, 'error'); }
}

// ─── Profile ────────────────────────────────────────────────────
async function renderProfile() {
  const main = document.getElementById('main-content');
  try {
    const { data } = await api('GET', '/auth/me');
    const u = data.user;
    main.innerHTML = `
      <div class="section-header"><h2>My Profile</h2></div>
      <div class="card">
        <div class="table-wrap"><table>
          <tr><td><strong>ID</strong></td><td>${u.id}</td></tr>
          <tr><td><strong>Name</strong></td><td>${u.name}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${u.phone}</td></tr>
          <tr><td><strong>Email</strong></td><td>${u.email || '—'}</td></tr>
          <tr><td><strong>Role</strong></td><td><span class="badge badge-active">${u.role}</span></td></tr>
          <tr><td><strong>Bar ID</strong></td><td>${u.barId || '—'}</td></tr>
          <tr><td><strong>Created</strong></td><td>${ts(u.createdAt)}</td></tr>
        </table></div>
      </div>
    `;
  } catch (e) { toast(e.message, 'error'); }
}

// ================================================================
//  EVENT LISTENERS
// ================================================================

// Auth tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('login-form').classList.toggle('hidden', btn.dataset.tab !== 'login');
    document.getElementById('signup-form').classList.toggle('hidden', btn.dataset.tab !== 'signup');
  });
});

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await api('POST', '/auth/login', {
      phone: document.getElementById('login-phone').value,
      password: document.getElementById('login-password').value,
    });
    setAuth(res.data.token, res.data.user);
    toast('Welcome back, ' + res.data.user.name + '!', 'success');
    showAppScreen();
  } catch (err) { toast(err.message, 'error'); }
});

// Signup
document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await api('POST', '/auth/signup', {
      name: document.getElementById('signup-name').value,
      phone: document.getElementById('signup-phone').value,
      email: document.getElementById('signup-email').value || undefined,
      password: document.getElementById('signup-password').value,
    });
    setAuth(res.data.token, res.data.user);
    toast('Account created! Welcome, ' + res.data.user.name + '!', 'success');
    showAppScreen();
  } catch (err) { toast(err.message, 'error'); }
});

// Navigation clicks (event delegation)
document.getElementById('app-nav').addEventListener('click', (e) => {
  if (e.target.classList.contains('nav-btn')) {
    navigate(e.target.dataset.view);
  }
});

// ================================================================
//  INIT
// ================================================================
if (state.token && state.user) {
  showAppScreen();
} else {
  showAuthScreen();
}
