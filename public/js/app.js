// ==================== HERB AGENT — DASHBOARD JS ====================

const API = '';
let currentPage = 1;
let selectedOrderIds = [];
let currentReorderOrder = null;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
    const isAuth = await checkAuth();
    if (isAuth) {
        startDashboard();
    }

    // Auth events
    document.getElementById('btnLogin').addEventListener('click', login);
    document.getElementById('loginPass').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') login();
    });
});

async function checkAuth() {
    try {
        const res = await fetch(`${API}/api/auth/status`);
        const data = await res.json();
        if (data.authenticated) {
            document.getElementById('loginOverlay').style.display = 'none';
            return true;
        } else {
            document.getElementById('loginOverlay').style.display = 'flex';
            return false;
        }
    } catch (e) {
        document.getElementById('loginOverlay').style.display = 'flex';
        return false;
    }
}

async function login() {
    const password = document.getElementById('loginPass').value;
    const errorEl = document.getElementById('loginError');

    try {
        const res = await fetch(`${API}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await res.json();
        if (data.success) {
            document.getElementById('loginOverlay').style.display = 'none';
            errorEl.style.display = 'none';
            showToast('Access Granted', 'success');
            startDashboard();
        } else {
            errorEl.textContent = data.message || (res.status === 429
                ? 'Too many login attempts, try again later.'
                : 'Invalid password, please try again.');
            errorEl.style.display = 'block';
            setTimeout(() => { errorEl.style.display = 'none'; }, 5000);
        }
    } catch (e) {
        errorEl.textContent = 'Login request failed. Please refresh and try again.';
        errorEl.style.display = 'block';
    }
}

function startDashboard() {
    loadStats();
    loadDeliveredOrders();
    initTabs();
    initEventListeners();
    checkHealth();

    // Logout event
    document.getElementById('btnLogout')?.addEventListener('click', async () => {
        await fetch(`${API}/api/auth/logout`, { method: 'POST' });
        location.reload();
    });
}

// Global 401 Handler (Intercept all fetch)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const res = await originalFetch(...args);
    if (res.status === 401 && !args[0].includes('/api/auth/login')) {
        document.getElementById('loginOverlay').style.display = 'flex';
    }
    return res;
};

// ==================== HEALTH CHECK ====================
async function checkHealth() {
    try {
        const res = await fetch(`${API}/api/health`);
        const data = await res.json();
        const dbEl = document.getElementById('dbStatus');
        if (data.db === 'Connected') {
            dbEl.innerHTML = '<span class="pulse"></span><span>DB Connected</span>';
            dbEl.classList.remove('error');
        } else {
            dbEl.innerHTML = '<span>DB Disconnected</span>';
            dbEl.classList.add('error');
        }
    } catch {
        document.getElementById('dbStatus').innerHTML = '<span>Offline</span>';
        document.getElementById('dbStatus').classList.add('error');
    }
}

// ==================== TABS ====================
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');

            // Lazy load tab data
            if (btn.dataset.tab === 'campaigns') loadCampaigns();
            if (btn.dataset.tab === 'logs') loadCallLogs();
            if (btn.dataset.tab === 'reorders') loadReorderHistory();
        });
    });
}

// ==================== EVENTS ====================
function initEventListeners() {
    // Filter orders
    document.getElementById('btnFilterOrders').addEventListener('click', () => {
        currentPage = 1;
        loadDeliveredOrders();
    });
    document.getElementById('orderSearch').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { currentPage = 1; loadDeliveredOrders(); }
    });

    // Select all checkbox
    document.getElementById('selectAll').addEventListener('change', (e) => {
        document.querySelectorAll('.order-check').forEach(cb => {
            cb.checked = e.target.checked;
            toggleSelection(cb.dataset.id, cb.checked);
        });
    });

    // Create campaign
    document.getElementById('btnCreateCampaign').addEventListener('click', () => {
        if (selectedOrderIds.length === 0) return showToast('Select at least one order!', 'error');
        document.getElementById('campSelectedCount').textContent = selectedOrderIds.length;
        document.getElementById('campaignModal').classList.add('show');
    });

    // Campaign modal
    document.getElementById('campaignModalClose').addEventListener('click', () => document.getElementById('campaignModal').classList.remove('show'));
    document.getElementById('btnCancelCampaign').addEventListener('click', () => document.getElementById('campaignModal').classList.remove('show'));
    document.getElementById('btnConfirmCampaign').addEventListener('click', createCampaign);

    // Reorder modal
    document.getElementById('modalClose').addEventListener('click', () => document.getElementById('reorderModal').classList.remove('show'));
    document.getElementById('btnCancelReorder').addEventListener('click', () => document.getElementById('reorderModal').classList.remove('show'));
    document.getElementById('btnSubmitReorder').addEventListener('click', submitReorder);

    // Refresh buttons
    document.getElementById('btnRefreshCampaigns').addEventListener('click', loadCampaigns);
    document.getElementById('btnRefreshLogs').addEventListener('click', loadCallLogs);
    document.getElementById('btnRefreshReorders').addEventListener('click', loadReorderHistory);
}

// ==================== STATS ====================
async function loadStats() {
    try {
        const res = await fetch(`${API}/api/stats`);
        const data = await res.json();
        if (data.success) {
            const s = data.stats;
            document.getElementById('statDelivered').textContent = s.totalDelivered.toLocaleString();
            document.getElementById('statReorders').textContent = s.totalReorders.toLocaleString();
            document.getElementById('statRate').textContent = s.reorderRate + '%';
            document.getElementById('statRevenue').textContent = '₹' + (s.totalRevenue || 0).toLocaleString();
        }
    } catch (err) {
        console.error('Stats error:', err);
    }
}

// ==================== DELIVERED ORDERS ====================
async function loadDeliveredOrders() {
    const search = document.getElementById('orderSearch').value;
    const startDate = document.getElementById('orderDateFrom').value;
    const endDate = document.getElementById('orderDateTo').value;
    const tbody = document.getElementById('ordersBody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">⏳ Loading...</td></tr>';

    try {
        const params = new URLSearchParams({ page: currentPage, limit: 20, search, startDate, endDate });
        const res = await fetch(`${API}/api/delivered-orders?${params}`);
        const data = await res.json();

        if (!data.success || !data.orders.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">No delivered orders found</td></tr>';
            document.getElementById('ordersPagination').innerHTML = '';
            return;
        }

        tbody.innerHTML = data.orders.map(o => {
            const items = (o.items || []).map(i => i.description).join(', ') || 'N/A';
            const mobile = o.mobile || o.telNo || 'N/A';
            const deliveredDate = o.deliveredAt ? new Date(o.deliveredAt).toLocaleDateString('en-IN') : 'N/A';
            const checked = selectedOrderIds.includes(o.orderId) ? 'checked' : '';
            return `<tr>
                <td><input type="checkbox" class="order-check" data-id="${o.orderId}" ${checked} onchange="toggleSelection('${o.orderId}', this.checked)"></td>
                <td><strong>${o.orderId}</strong></td>
                <td>${o.customerName}</td>
                <td class="mobile-cell">${mobile}</td>
                <td class="items-cell" title="${items}">${items}</td>
                <td><strong>₹${(o.total || 0).toLocaleString()}</strong></td>
                <td>${deliveredDate}</td>
                <td>
                    <button class="btn btn-accent btn-sm" onclick="openReorderModal('${o.orderId}')">🔄 Reorder</button>
                    <button class="btn btn-call btn-sm" onclick="triggerCall('${o.orderId}', '${o.customerName}', '${mobile}', '${items.replace(/'/g, "\\'")}')">📞 Call</button>
                </td>
            </tr>`;
        }).join('');

        renderPagination(data.page, data.totalPages, data.total);
    } catch (err) {
        console.error('Load orders error:', err);
        tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">❌ Error loading orders</td></tr>';
    }
}

function toggleSelection(orderId, checked) {
    if (checked && !selectedOrderIds.includes(orderId)) {
        selectedOrderIds.push(orderId);
    } else if (!checked) {
        selectedOrderIds = selectedOrderIds.filter(id => id !== orderId);
    }
}

function renderPagination(page, totalPages, total) {
    const container = document.getElementById('ordersPagination');
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = `<button ${page <= 1 ? 'disabled' : ''} onclick="goToPage(${page - 1})">← Prev</button>`;
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) {
        html += `<button class="${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    html += `<button ${page >= totalPages ? 'disabled' : ''} onclick="goToPage(${page + 1})">Next →</button>`;
    html += `<span style="color:var(--text-muted);font-size:0.75rem;margin-left:8px">(${total} total)</span>`;
    container.innerHTML = html;
}

function goToPage(p) {
    currentPage = p;
    loadDeliveredOrders();
}

// ==================== REORDER MODAL ====================
async function openReorderModal(orderId) {
    try {
        const res = await fetch(`${API}/api/order/${orderId}`);
        const data = await res.json();
        if (!data.success) return showToast('Order not found', 'error');

        const o = data.order;
        currentReorderOrder = o;

        document.getElementById('modalOriginalId').textContent = o.orderId;
        document.getElementById('rCustomerName').value = o.customerName || '';
        document.getElementById('rMobile').value = o.mobile || o.telNo || '';
        document.getElementById('rAddress').value = o.address || '';
        document.getElementById('rCity').value = o.city || '';
        document.getElementById('rState').value = o.state || '';
        document.getElementById('rPincode').value = o.pincode || o.pin || '';
        document.getElementById('rTotal').value = o.total || 0;
        document.getElementById('rPayment').value = o.paymentMode || 'COD';

        // Render items
        const itemsContainer = document.getElementById('rItemsList');
        const items = o.items || [];
        if (items.length) {
            itemsContainer.innerHTML = items.map((item, i) => `
                <div class="item-row" data-index="${i}">
                    <input type="text" value="${item.description || ''}" class="item-desc" placeholder="Item name">
                    <input type="number" value="${item.quantity || 1}" class="item-qty" placeholder="Qty" min="1">
                    <input type="number" value="${item.price || item.rate || 0}" class="item-price" placeholder="Price">
                </div>
            `).join('');
        } else {
            itemsContainer.innerHTML = '<p style="color:var(--text-muted);font-size:0.82rem">No items found in original order</p>';
        }

        document.getElementById('reorderModal').classList.add('show');
    } catch (err) {
        showToast('Error loading order details', 'error');
    }
}

async function submitReorder() {
    if (!currentReorderOrder) return;

    const btn = document.getElementById('btnSubmitReorder');
    btn.disabled = true;
    btn.textContent = '⏳ Creating...';

    // Collect items from modal
    const itemRows = document.querySelectorAll('.item-row');
    const items = Array.from(itemRows).map(row => {
        const desc = row.querySelector('.item-desc')?.value || '';
        const qty = parseInt(row.querySelector('.item-qty')?.value) || 1;
        const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
        return { description: desc, quantity: qty, price: price, rate: price, amount: qty * price };
    }).filter(i => i.description);

    const body = {
        customerName: document.getElementById('rCustomerName').value,
        mobile: document.getElementById('rMobile').value,
        telNo: document.getElementById('rMobile').value,
        address: document.getElementById('rAddress').value,
        city: document.getElementById('rCity').value,
        state: document.getElementById('rState').value,
        pincode: document.getElementById('rPincode').value,
        pin: document.getElementById('rPincode').value,
        total: parseFloat(document.getElementById('rTotal').value) || 0,
        paymentMode: document.getElementById('rPayment').value,
        items: items,
        source: 'Manual'
    };

    try {
        const res = await fetch(`${API}/api/reorder/${currentReorderOrder.orderId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ Reorder created: ${data.newOrderId}`, 'success');
            document.getElementById('reorderModal').classList.remove('show');
            loadStats();
            currentReorderOrder = null;
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (err) {
        showToast('❌ Error creating reorder', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '✅ Create Reorder';
    }
}

// ==================== CALL ====================
async function triggerCall(orderId, customerName, mobile, items) {
    if (!confirm(`📞 Call ${customerName} at ${mobile}?`)) return;

    showToast(`📞 Calling ${customerName}...`, 'info');

    try {
        const res = await fetch(`${API}/api/agent/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, customerName, mobile, items })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ Call ${data.mode === 'mock' ? '(Mock)' : ''} triggered: ${data.callId}`, 'success');
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (err) {
        showToast('❌ Call failed', 'error');
    }
}

// ==================== CAMPAIGNS ====================
async function createCampaign() {
    const name = document.getElementById('campName').value.trim();
    if (!name) return showToast('Campaign name required!', 'error');

    try {
        const res = await fetch(`${API}/api/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                description: document.getElementById('campDesc').value.trim(),
                orderIds: selectedOrderIds
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ Campaign "${name}" created with ${selectedOrderIds.length} orders`, 'success');
            document.getElementById('campaignModal').classList.remove('show');
            selectedOrderIds = [];
            document.querySelectorAll('.order-check').forEach(cb => cb.checked = false);
            document.getElementById('selectAll').checked = false;
            document.getElementById('campName').value = '';
            document.getElementById('campDesc').value = '';
            // Switch to campaigns tab
            document.querySelector('[data-tab="campaigns"]').click();
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (err) {
        showToast('❌ Error creating campaign', 'error');
    }
}

async function loadCampaigns() {
    const container = document.getElementById('campaignsList');
    container.innerHTML = '<p class="empty-msg">⏳ Loading campaigns...</p>';

    try {
        const res = await fetch(`${API}/api/campaigns`);
        const data = await res.json();

        if (!data.success || !data.campaigns.length) {
            container.innerHTML = '<p class="empty-msg">No campaigns yet. Select orders and create one!</p>';
            return;
        }

        container.innerHTML = data.campaigns.map(c => {
            const s = c.stats || {};
            const statusClass = c.status === 'Active' ? 'badge-active' :
                c.status === 'Completed' ? 'badge-completed' : 'badge-draft';
            return `
            <div class="campaign-card">
                <div class="campaign-card-header">
                    <div>
                        <h4>${c.name}</h4>
                        <p style="font-size:0.72rem;color:var(--text-muted)">${c.campaignId}</p>
                    </div>
                    <span class="badge ${statusClass}">${c.status}</span>
                </div>
                ${c.description ? `<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:8px">${c.description}</p>` : ''}
                <div class="campaign-stats">
                    <div class="campaign-stat"><span class="campaign-stat-val">${s.totalOrders || 0}</span><span class="campaign-stat-lbl">Total</span></div>
                    <div class="campaign-stat"><span class="campaign-stat-val">${s.called || 0}</span><span class="campaign-stat-lbl">Called</span></div>
                    <div class="campaign-stat"><span class="campaign-stat-val" style="color:var(--accent)">${s.interested || 0}</span><span class="campaign-stat-lbl">Interested</span></div>
                    <div class="campaign-stat"><span class="campaign-stat-val" style="color:var(--success)">${s.reordered || 0}</span><span class="campaign-stat-lbl">Reordered</span></div>
                </div>
                <div class="campaign-actions">
                    ${c.status === 'Draft' ? `<button class="btn btn-accent btn-sm" onclick="activateCampaign('${c.campaignId}')">▶ Activate</button>` : ''}
                    ${c.status === 'Active' ? `<button class="btn btn-call btn-sm" onclick="callAllCampaign('${c.campaignId}')">📞 Call All</button>` : ''}
                    <button class="btn btn-outline btn-sm" onclick="viewCampaignOrders('${c.campaignId}')">👁 View Orders</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCampaign('${c.campaignId}')">🗑</button>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        container.innerHTML = '<p class="empty-msg">❌ Error loading campaigns</p>';
    }
}

async function activateCampaign(id) {
    try {
        await fetch(`${API}/api/campaigns/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Active' })
        });
        showToast('✅ Campaign activated!', 'success');
        loadCampaigns();
    } catch (err) { showToast('❌ Error', 'error'); }
}

async function callAllCampaign(id) {
    if (!confirm('📞 Call ALL orders in this campaign?')) return;
    try {
        const res = await fetch(`${API}/api/campaigns/${id}`);
        const data = await res.json();
        if (!data.success) return;

        const pendingOrders = (data.campaign.orders || []).filter(o => o.callStatus === 'Pending');
        showToast(`📞 Triggering ${pendingOrders.length} calls...`, 'info');

        for (const order of pendingOrders) {
            await fetch(`${API}/api/agent/call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.orderId,
                    customerName: order.customerName,
                    mobile: order.mobile,
                    items: order.items,
                    campaignId: id
                })
            });
            // Small delay between calls
            await new Promise(r => setTimeout(r, 500));
        }
        showToast(`✅ ${pendingOrders.length} calls triggered!`, 'success');
        setTimeout(loadCampaigns, 3000);
    } catch (err) { showToast('❌ Error calling', 'error'); }
}

async function viewCampaignOrders(id) {
    try {
        const res = await fetch(`${API}/api/campaigns/${id}`);
        const data = await res.json();
        if (!data.success) return;

        const orders = data.campaign.orders || [];
        const html = orders.map(o => {
            const statusClass = o.callStatus === 'Completed' ? 'badge-completed' :
                o.callStatus === 'Calling' ? 'badge-calling' : 'badge-pending';
            const resultClass = o.callResult === 'Interested' ? 'badge-interested' :
                o.callResult === 'Reordered' ? 'badge-reordered' :
                    o.callResult === 'Callback' ? 'badge-callback' :
                        o.callResult === 'Not Interested' ? 'badge-not-interested' : '';
            return `<tr>
                <td>${o.orderId}</td>
                <td>${o.customerName}</td>
                <td class="mobile-cell">${o.mobile}</td>
                <td><span class="badge ${statusClass}">${o.callStatus}</span></td>
                <td>${o.callResult ? `<span class="badge ${resultClass}">${o.callResult}</span>` : '—'}</td>
                <td>
                    ${o.callStatus === 'Pending' ? `<button class="btn btn-call btn-sm" onclick="triggerCall('${o.orderId}', '${o.customerName}', '${o.mobile}', '${(o.items || '').replace(/'/g, "\\'")}')">📞 Call</button>` : ''}
                </td>
            </tr>`;
        }).join('');

        // Switch to call logs and show
        const logsBody = document.getElementById('logsBody');
        logsBody.innerHTML = html || '<tr><td colspan="8" class="loading-cell">No orders in campaign</td></tr>';
        document.querySelector('[data-tab="logs"]').click();
    } catch (err) { showToast('❌ Error', 'error'); }
}

async function deleteCampaign(id) {
    if (!confirm('🗑 Delete this campaign?')) return;
    try {
        await fetch(`${API}/api/campaigns/${id}`, { method: 'DELETE' });
        showToast('✅ Campaign deleted', 'success');
        loadCampaigns();
    } catch (err) { showToast('❌ Error', 'error'); }
}

// ==================== CALL LOGS (ENHANCED) ====================
async function loadCallLogs() {
    const tbody = document.getElementById('logsBody');
    tbody.innerHTML = '<tr><td colspan="10" class="loading-cell">⏳ Loading call logs...</td></tr>';

    try {
        const res = await fetch(`${API}/api/agent/logs`);
        const data = await res.json();

        if (!data.success || !data.logs.length) {
            tbody.innerHTML = '<tr><td colspan="10" class="loading-cell">No call logs yet</td></tr>';
            return;
        }

        const segColors = { VIP: '#f59e0b', Regular: '#10b981', New: '#667eea', Inactive: '#94a3b8', Lost: '#ef4444', Unknown: '#94a3b8' };
        const sentEmojis = { positive: '😊', neutral: '😐', negative: '😞' };

        tbody.innerHTML = data.logs.map(l => {
            const statusClass = l.callStatus === 'Completed' ? 'badge-completed' :
                l.callStatus === 'Failed' ? 'badge-failed' :
                    l.callStatus === 'In Progress' ? 'badge-calling' :
                        l.callStatus === 'Scheduled' ? 'badge-pending' : 'badge-pending';
            const resultClass = l.callResult === 'Interested' ? 'badge-interested' :
                l.callResult === 'Reordered' ? 'badge-reordered' :
                    l.callResult === 'Callback' ? 'badge-callback' :
                        l.callResult === 'Not Interested' ? 'badge-not-interested' : '';
            const time = l.triggeredAt ? new Date(l.triggeredAt).toLocaleString('en-IN') : 'N/A';
            const duration = l.duration ? `${Math.floor(l.duration / 60)}m ${l.duration % 60}s` : '—';
            const seg = l.customerSegment || 'Unknown';
            const segColor = segColors[seg] || '#94a3b8';
            const sentEmoji = sentEmojis[l.sentiment] || '—';

            return `<tr>
                <td><strong>${l.callId}</strong>${l.reorderCreated ? '<br><span style="color:#10b981;font-size:11px">✅ Reorder: ' + (l.newOrderId || '') + '</span>' : ''}</td>
                <td>${l.customerName}</td>
                <td class="mobile-cell">${l.mobile}</td>
                <td><span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${segColor}22;color:${segColor}">${seg}</span></td>
                <td><span class="badge ${statusClass}">${l.callStatus}</span></td>
                <td>${l.callResult ? `<span class="badge ${resultClass}">${l.callResult}</span>` : '—'}</td>
                <td style="font-size:18px;text-align:center">${sentEmoji}</td>
                <td>${duration}</td>
                <td>${time}</td>
                <td>${l.transcript ? `<button class="btn btn-outline btn-sm" onclick="showTranscript('${l.callId}')">📝 View</button>` : '—'}</td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="10" class="loading-cell">❌ Error loading logs</td></tr>';
    }
}

// ==================== TRANSCRIPT VIEWER ====================
async function showTranscript(callId) {
    try {
        const res = await fetch(`${API}/api/agent/logs/${callId}`);
        const data = await res.json();
        if (!data.success || !data.log) return showToast('❌ Transcript not found', 'error');

        const log = data.log;
        document.getElementById('transcriptCallId').textContent = callId;
        document.getElementById('transcriptContent').textContent = log.transcript || 'No transcript available';

        const resultColors = { Reordered: '#10b981', Interested: '#667eea', Callback: '#f59e0b', 'Not Interested': '#ef4444' };
        const sentColors = { positive: '#10b981', neutral: '#f59e0b', negative: '#ef4444' };

        document.getElementById('transcriptResult').innerHTML = log.callResult ?
            `<span style="padding:4px 12px;border-radius:12px;background:${resultColors[log.callResult] || '#94a3b8'}22;color:${resultColors[log.callResult] || '#94a3b8'};font-weight:600">${log.callResult}</span>` : '';
        document.getElementById('transcriptSentiment').innerHTML = log.sentiment ?
            `<span style="padding:4px 12px;border-radius:12px;background:${sentColors[log.sentiment] || '#94a3b8'}22;color:${sentColors[log.sentiment] || '#94a3b8'};font-weight:600;text-transform:capitalize">${log.sentiment}</span>` : '';
        document.getElementById('transcriptDuration').textContent = log.duration ?
            `⏱️ ${Math.floor(log.duration / 60)}m ${log.duration % 60}s` : '';
        document.getElementById('transcriptDiscount').innerHTML = log.discountOffered ?
            `<div style="padding:8px;background:rgba(245,158,11,0.1);border-radius:8px;font-size:13px">🏷️ Discount offered: <strong>${log.discountPercent}%</strong> (code: <strong>${log.discountOffered}</strong>)</div>` : '';

        document.getElementById('transcriptModal').style.display = 'flex';
    } catch (e) {
        showToast('❌ Error loading transcript', 'error');
    }
}

// ==================== SCHEDULED CALLS ====================
async function loadScheduledCalls() {
    const container = document.getElementById('scheduledCallsList');
    try {
        const res = await fetch(`${API}/api/agent/scheduled`);
        const data = await res.json();

        if (!data.success || !data.scheduled.length) {
            container.innerHTML = '<p class="empty-msg">No scheduled calls pending</p>';
            return;
        }

        container.innerHTML = data.scheduled.map(c => {
            const schedTime = new Date(c.scheduledAt).toLocaleString('en-IN');
            const isPast = new Date(c.scheduledAt) <= new Date();
            return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px;margin-bottom:8px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:3px solid ${isPast ? '#f59e0b' : '#667eea'}">
                <div>
                    <strong>${c.customerName}</strong> <span style="color:var(--text-muted)">(${c.mobile})</span>
                    <div style="font-size:12px;color:var(--text-muted)">📅 ${schedTime} ${isPast ? '⚠️ Overdue' : ''}</div>
                </div>
                <span style="font-size:12px;padding:2px 8px;border-radius:8px;background:${isPast ? '#f59e0b22' : '#667eea22'};color:${isPast ? '#f59e0b' : '#667eea'}">${c.callId}</span>
            </div>`;
        }).join('');
    } catch (e) {
        container.innerHTML = '<p class="empty-msg">Error loading scheduled calls</p>';
    }
}

async function runScheduledCalls() {
    try {
        showToast('⚡ Running scheduled calls...', 'info');
        const res = await fetch(`${API}/api/agent/run-scheduled`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ ${data.message}`, 'success');
            loadScheduledCalls();
            loadCallLogs();
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (e) {
        showToast('❌ Failed: ' + e.message, 'error');
    }
}

// ==================== CALL ANALYTICS ====================
async function loadCallAnalytics() {
    try {
        const res = await fetch(`${API}/api/agent/analytics`);
        const data = await res.json();
        if (!data.success) return;

        const ca = data.callAnalytics;
        // If call analytics elements exist, update them
        const el = document.getElementById('callAnalyticsPanel');
        if (!el) return;

        const resultColors = { Reordered: '#10b981', Interested: '#667eea', Callback: '#f59e0b', 'Not Interested': '#ef4444' };
        el.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
                <div style="text-align:center;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
                    <div style="font-size:28px;font-weight:700;color:#667eea">${ca.totalCalls}</div>
                    <div style="font-size:12px;color:var(--text-muted)">Total Calls</div>
                </div>
                <div style="text-align:center;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
                    <div style="font-size:28px;font-weight:700;color:#f59e0b">${ca.avgDuration}s</div>
                    <div style="font-size:12px;color:var(--text-muted)">Avg Duration</div>
                </div>
                <div style="text-align:center;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
                    <div style="font-size:28px;font-weight:700;color:#10b981">${ca.reorderRate}%</div>
                    <div style="font-size:12px;color:var(--text-muted)">Reorder Rate</div>
                </div>
                <div style="text-align:center;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
                    <div style="font-size:28px;font-weight:700;color:#f472b6">${ca.totalCallTime}m</div>
                    <div style="font-size:12px;color:var(--text-muted)">Total Talk Time</div>
                </div>
            </div>
            <h4 style="margin-bottom:8px">📊 Result Breakdown</h4>
            ${Object.entries(ca.resultBreakdown || {}).map(([result, count]) => {
            const pct = ca.completedCalls > 0 ? Math.round(count / ca.completedCalls * 100) : 0;
            return `<div style="margin-bottom:8px">
                    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px">
                        <span>${result}</span><span style="color:var(--text-muted)">${count} (${pct}%)</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.05);border-radius:6px;height:20px;overflow:hidden">
                        <div style="width:${pct}%;height:100%;background:${resultColors[result] || '#94a3b8'};border-radius:6px;transition:width 0.8s"></div>
                    </div>
                </div>`;
        }).join('')}
        `;
    } catch (e) {
        console.error('Call analytics error:', e);
    }
}

// ==================== REORDER HISTORY ====================
async function loadReorderHistory() {
    const tbody = document.getElementById('reordersBody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">⏳ Loading...</td></tr>';

    try {
        const res = await fetch(`${API}/api/reorders`);
        const data = await res.json();

        if (!data.success || !data.reorders.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">No reorders yet</td></tr>';
            return;
        }

        tbody.innerHTML = data.reorders.map(r => {
            const date = r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : 'N/A';
            const items = (r.items || []).map(i => i.description).join(', ') || 'N/A';
            const sourceClass = r.source === 'AI Call' ? 'badge-ai' : r.source === 'Campaign' ? 'badge-active' : 'badge-manual';
            const statusClass = r.status === 'Synced' ? 'badge-synced' : r.status === 'Failed' ? 'badge-failed' : 'badge-completed';
            return `<tr>
                <td><strong>${r.reorderId}</strong></td>
                <td>${r.originalOrderId}</td>
                <td>${r.newOrderId || '—'}</td>
                <td>${r.customerName}</td>
                <td class="items-cell" title="${items}">${items}</td>
                <td><strong>₹${(r.total || 0).toLocaleString()}</strong></td>
                <td><span class="badge ${sourceClass}">${r.source}</span></td>
                <td>${date}</td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">❌ Error loading reorders</td></tr>';
    }
}

// ==================== TOAST ====================
// ==================== WHATSAPP ====================
let waTemplates = [];
let waPage = 1;
let waSelected = new Set();

async function initWhatsApp() {
    // Check WA status
    try {
        const res = await fetch(`${API}/api/whatsapp/status`);
        const data = await res.json();
        const el = document.getElementById('waStatus');
        if (data.configured) {
            el.textContent = '🟢 WhatsApp Live';
            el.className = 'wa-status live';
        } else {
            el.textContent = '🟡 Mock Mode';
            el.className = 'wa-status mock';
        }
    } catch (e) { }

    // Load templates
    try {
        const res = await fetch(`${API}/api/whatsapp/templates`);
        const data = await res.json();
        waTemplates = data.templates || [];
        const select = document.getElementById('waTemplateSelect');
        select.innerHTML = '<option value="">— Select Template —</option>';
        waTemplates.forEach(t => {
            select.innerHTML += `<option value="${t.id}">${t.name}</option>`;
        });
        select.addEventListener('change', () => {
            const tpl = waTemplates.find(t => t.id === select.value);
            if (tpl) document.getElementById('waMessageText').value = tpl.message;
        });
    } catch (e) { }

    // Load orders for WA tab
    loadWAOrders();

    // Select all
    document.getElementById('waSelectAll')?.addEventListener('change', (e) => {
        document.querySelectorAll('#waOrdersBody .wa-check').forEach(cb => {
            cb.checked = e.target.checked;
            const id = cb.dataset.id;
            if (e.target.checked) waSelected.add(id); else waSelected.delete(id);
        });
        updateBulkWABtn();
    });

    // Bulk send
    document.getElementById('btnBulkWA')?.addEventListener('click', bulkSendWA);
}

async function loadWAOrders() {
    try {
        const res = await fetch(`${API}/api/delivered-orders?page=${waPage}&limit=15`);
        const data = await res.json();
        const tbody = document.getElementById('waOrdersBody');
        if (!data.orders?.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">No delivered orders found</td></tr>';
            return;
        }
        tbody.innerHTML = data.orders.map(o => `
            <tr>
                <td><input type="checkbox" class="wa-check" data-id="${o._id}" ${waSelected.has(o._id) ? 'checked' : ''}></td>
                <td><strong>${o.customerName || 'N/A'}</strong></td>
                <td>${o.mobile || o.telNo || '—'}</td>
                <td>${(o.items || []).map(i => i.description || i.treatment || '').join(', ').substring(0, 40) || '—'}</td>
                <td>₹${o.total || 0}</td>
                <td>${o.deliveredAt ? new Date(o.deliveredAt).toLocaleDateString('en-IN') : '—'}</td>
                <td><button class="btn-wa-send" onclick="sendSingleWA('${o._id}')">📱 Send</button><button class="btn-ai-chat" onclick="startAIChat('${o._id}')">🤖 AI Chat</button></td>
            </tr>
        `).join('');

        // Checkbox events
        tbody.querySelectorAll('.wa-check').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) waSelected.add(cb.dataset.id); else waSelected.delete(cb.dataset.id);
                updateBulkWABtn();
            });
        });

        // Pagination
        const pagDiv = document.getElementById('waOrdersPagination');
        if (data.totalPages > 1) {
            pagDiv.innerHTML = `
                <button class="btn btn-outline" ${waPage <= 1 ? 'disabled' : ''} onclick="waPage--;loadWAOrders()">← Prev</button>
                <span>Page ${waPage} of ${data.totalPages}</span>
                <button class="btn btn-outline" ${waPage >= data.totalPages ? 'disabled' : ''} onclick="waPage++;loadWAOrders()">Next →</button>
            `;
        } else pagDiv.innerHTML = '';
    } catch (e) {
        document.getElementById('waOrdersBody').innerHTML = '<tr><td colspan="7" class="loading-cell">Error loading orders</td></tr>';
    }
}

function updateBulkWABtn() {
    const btn = document.getElementById('btnBulkWA');
    btn.disabled = waSelected.size === 0;
    btn.textContent = waSelected.size > 0 ? `📤 Send to ${waSelected.size} Selected` : '📤 Bulk Send to Selected';
}

async function sendSingleWA(orderId) {
    const message = document.getElementById('waMessageText').value.trim();
    if (!message) return showToast('❌ Pehle message likhein ya template select karein!', 'error');

    if (!confirm('WhatsApp message bhejna hai is customer ko?')) return;

    try {
        const res = await fetch(`${API}/api/whatsapp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, message })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ ${data.message} (${data.mode})`, 'success');
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (e) {
        showToast('❌ Error sending WhatsApp: ' + e.message, 'error');
    }
}

async function bulkSendWA() {
    const message = document.getElementById('waMessageText').value.trim();
    if (!message) return showToast('❌ Pehle message likhein ya template select karein!', 'error');
    if (!waSelected.size) return showToast('❌ Koi orders select karein!', 'error');

    if (!confirm(`${waSelected.size} customers ko WhatsApp message bhejein?`)) return;

    const btn = document.getElementById('btnBulkWA');
    btn.disabled = true;
    btn.textContent = '⏳ Sending...';

    try {
        const res = await fetch(`${API}/api/whatsapp/bulk-send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderIds: [...waSelected], message })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ ${data.message}`, 'success');
            waSelected.clear();
            updateBulkWABtn();
            document.querySelectorAll('#waOrdersBody .wa-check').forEach(cb => cb.checked = false);
            document.getElementById('waSelectAll').checked = false;
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (e) {
        showToast('❌ Bulk send error: ' + e.message, 'error');
    }

    btn.disabled = false;
    updateBulkWABtn();
}

// Init WhatsApp on load
document.addEventListener('DOMContentLoaded', () => {
    initWhatsApp();
    loadConversations();
    initChatEvents();
});

// ==================== AI BOT CONVERSATIONS ====================
let currentConvId = null;
let currentConvPhone = null;

async function startAIChat(orderId) {
    try {
        showToast('🤖 AI conversation shuru ho raha hai...', 'info');
        const res = await fetch(`${API}/api/bot/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ ${data.message} (${data.mode})`, 'success');
            await loadConversations();
            openChat(data.conversationId);
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (e) {
        showToast('❌ Error: ' + e.message, 'error');
    }
}

async function loadConversations() {
    const listEl = document.getElementById('chatList');
    try {
        const res = await fetch(`${API}/api/bot/conversations`);
        const data = await res.json();
        if (!data.conversations?.length) {
            listEl.innerHTML = '<div class="chat-list-empty">No conversations yet.<br>Click "🤖 AI Chat" on any order to start!</div>';
            return;
        }
        listEl.innerHTML = data.conversations.map(c => {
            const isActive = c._id === currentConvId;
            const timeStr = c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
            const statusLabel = c.status === 'reordered' ? '✅ Reordered' : c.status === 'interested' ? '💛 Interested' : c.status === 'not_interested' ? '❌ Not Int.' : '🔵 Active';
            return `
                <div class="chat-list-item ${isActive ? 'active' : ''}" onclick="openChat('${c._id}')">
                    <div class="chat-item-avatar">${c.status === 'reordered' ? '✅' : '👤'}</div>
                    <div class="chat-item-info">
                        <div class="chat-item-name">${c.customerName || 'Customer'}</div>
                        <div class="chat-item-preview">${c.originalOrderId || c.phone || ''}</div>
                    </div>
                    <div class="chat-item-meta">
                        <div class="chat-item-time">${timeStr}</div>
                        <div class="chat-item-badge ${c.status}">${statusLabel}</div>
                    </div>
                </div>`;
        }).join('');
    } catch (e) {
        listEl.innerHTML = '<div class="chat-list-empty">❌ Error loading conversations</div>';
    }
}

async function openChat(convId) {
    currentConvId = convId;
    try {
        const res = await fetch(`${API}/api/bot/conversations/${convId}`);
        const data = await res.json();
        if (!data.conversation) return;

        const conv = data.conversation;
        currentConvPhone = conv.phone;

        // Update header
        document.getElementById('chatCustName').textContent = conv.customerName || 'Customer';
        const statusEl = document.getElementById('chatConvStatus');
        statusEl.textContent = conv.status;
        statusEl.className = `conv-status ${conv.status}`;
        document.getElementById('chatOrderInfo').textContent = conv.originalOrderId ? `Order: ${conv.originalOrderId}` : '';

        // Show chat panel, hide empty
        document.getElementById('chatPanelEmpty').style.display = 'none';
        document.getElementById('chatPanelActive').style.display = 'flex';

        // Render messages
        const thread = document.getElementById('chatThread');
        thread.innerHTML = conv.messages.map(m => {
            const isBot = m.role === 'assistant';
            const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
            return `
                <div class="chat-bubble ${isBot ? 'bot' : 'user'}">
                    <div class="bubble-label">${isBot ? '🤖 Herb Agent AI' : '👤 Customer'}</div>
                    <div>${m.content}</div>
                    <div class="bubble-time">${timeStr}</div>
                </div>`;
        }).join('');
        thread.scrollTop = thread.scrollHeight;

        // Highlight in sidebar
        document.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.chat-list-item').forEach(el => {
            if (el.onclick?.toString().includes(convId)) el.classList.add('active');
        });

        // Focus input
        document.getElementById('chatSimInput').focus();
    } catch (e) {
        showToast('❌ Error loading chat', 'error');
    }
}

async function simulateReply() {
    const input = document.getElementById('chatSimInput');
    const message = input.value.trim();
    if (!message || !currentConvId || !currentConvPhone) return;

    input.value = '';
    input.disabled = true;

    const thread = document.getElementById('chatThread');

    // Add user message immediately
    thread.innerHTML += `
        <div class="chat-bubble user">
            <div class="bubble-label">👤 Customer</div>
            <div>${message}</div>
            <div class="bubble-time">Just now</div>
        </div>`;
    thread.scrollTop = thread.scrollHeight;

    // Add typing indicator
    thread.innerHTML += `<div class="chat-bubble bot" id="typingBubble"><div class="bubble-label">🤖 Herb Agent AI</div><div>⏳ Typing...</div></div>`;
    thread.scrollTop = thread.scrollHeight;

    try {
        const res = await fetch(`${API}/api/bot/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: currentConvPhone, message })
        });
        const data = await res.json();

        // Remove typing
        document.getElementById('typingBubble')?.remove();

        if (data.success) {
            thread.innerHTML += `
                <div class="chat-bubble bot">
                    <div class="bubble-label">🤖 Herb Agent AI</div>
                    <div>${data.reply}</div>
                    <div class="bubble-time">Just now · Intent: ${data.intent}</div>
                </div>`;
            thread.scrollTop = thread.scrollHeight;

            // Update status in header
            if (data.conversationStatus) {
                const statusEl = document.getElementById('chatConvStatus');
                statusEl.textContent = data.conversationStatus;
                statusEl.className = `conv-status ${data.conversationStatus}`;
            }

            if (data.reorderCreated) {
                showToast(`🎉 Auto-Reorder created! Order: ${data.newOrderId}`, 'success');
                thread.innerHTML += `
                    <div class="chat-bubble bot" style="background:rgba(16,185,129,0.15);border-color:rgba(16,185,129,0.3);">
                        <div class="bubble-label" style="color:var(--accent)">✅ AUTO-REORDER</div>
                        <div>Order ${data.newOrderId} automatically created!</div>
                    </div>`;
                thread.scrollTop = thread.scrollHeight;
            }

            loadConversations();
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (e) {
        document.getElementById('typingBubble')?.remove();
        showToast('❌ Simulate error: ' + e.message, 'error');
    }

    input.disabled = false;
    input.focus();
}

function initChatEvents() {
    document.getElementById('btnSimSend')?.addEventListener('click', simulateReply);
    document.getElementById('chatSimInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') simulateReply();
    });
    document.getElementById('btnRefreshConvs')?.addEventListener('click', loadConversations);
}

// ==================== TOAST ====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==================== EXCEL UPLOAD ====================
function initUpload() {
    const zone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('excelFile');
    const btnBrowse = document.getElementById('btnBrowse');

    if (!zone || !fileInput || !btnBrowse) return;

    // Browse button
    btnBrowse.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    // Click on zone
    zone.addEventListener('click', () => fileInput.click());

    // File selected
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) uploadExcel(e.target.files[0]);
    });

    // Drag & Drop
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) uploadExcel(e.dataTransfer.files[0]);
    });
}

async function uploadExcel(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
        return showToast('❌ Only .xlsx, .xls, .csv files allowed!', 'error');
    }

    // Show progress
    const progressDiv = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const statusText = document.getElementById('uploadStatusText');
    const resultDiv = document.getElementById('uploadResult');
    progressDiv.style.display = 'block';
    resultDiv.style.display = 'none';
    progressFill.style.width = '20%';
    statusText.textContent = `📤 Uploading "${file.name}"...`;

    const formData = new FormData();
    formData.append('file', file);

    try {
        progressFill.style.width = '50%';
        statusText.textContent = '🔄 Processing Excel data...';

        const res = await fetch(`${API}/api/upload-excel`, {
            method: 'POST',
            body: formData
        });

        progressFill.style.width = '90%';
        const data = await res.json();

        progressFill.style.width = '100%';

        if (data.success) {
            statusText.textContent = '✅ Upload complete!';
            showToast(data.message, 'success');

            const s = data.stats;
            let html = `<h4>✅ Import Results</h4>`;
            html += `<div class="result-stats">
                <div class="result-stat"><span class="result-stat-val">${s.totalRows}</span><span class="result-stat-lbl">Total Rows</span></div>
                <div class="result-stat"><span class="result-stat-val" style="color:var(--accent)">${s.imported}</span><span class="result-stat-lbl">Imported</span></div>
                <div class="result-stat"><span class="result-stat-val" style="color:var(--warning)">${s.skipped}</span><span class="result-stat-lbl">Skipped</span></div>
            </div>`;

            // Show column mapping
            if (data.mapping && Object.keys(data.mapping).length) {
                html += `<div class="column-map"><strong>Column Mapping Used:</strong><br>`;
                for (const [field, col] of Object.entries(data.mapping)) {
                    html += `<span>${field} → "${col}"</span> `;
                }
                html += `</div>`;
            }

            // Show errors
            if (s.errors && s.errors.length) {
                html += `<div class="result-errors"><strong>⚠️ Errors:</strong>`;
                s.errors.forEach(e => html += `<p>• ${e}</p>`);
                html += `</div>`;
            }

            resultDiv.innerHTML = html;
            resultDiv.style.display = 'block';

            // Refresh stats and orders
            loadStats();
            loadDeliveredOrders();
        } else {
            statusText.textContent = '❌ Upload failed';
            showToast('❌ ' + data.message, 'error');
        }
    } catch (err) {
        progressFill.style.width = '100%';
        statusText.textContent = '❌ Upload error';
        showToast('❌ Upload failed: ' + err.message, 'error');
    }

    // Reset file input
    document.getElementById('excelFile').value = '';

    // Hide progress after 3s
    setTimeout(() => { progressDiv.style.display = 'none'; }, 3000);
}

// Init upload on load
document.addEventListener('DOMContentLoaded', initUpload);

// ==================== ANALYTICS ====================
async function loadAnalytics() {
    try {
        // Fetch all analytics data in parallel
        const [overviewRes, funnelRes, customersRes, followupRes, performanceRes] = await Promise.all([
            fetch(`${API}/api/analytics/overview`).then(r => r.json()),
            fetch(`${API}/api/analytics/funnel`).then(r => r.json()),
            fetch(`${API}/api/analytics/customers`).then(r => r.json()),
            fetch(`${API}/api/followups/stats`).then(r => r.json()),
            fetch(`${API}/api/analytics/performance`).then(r => r.json())
        ]);

        // Update stat cards
        if (overviewRes.success) {
            const o = overviewRes.overview;
            document.getElementById('aiTotalConvs').textContent = o.totalConversations;
            document.getElementById('aiReorders').textContent = o.totalReorders;
            document.getElementById('aiRevenue').textContent = '₹' + (o.revenue || 0).toLocaleString();
            document.getElementById('aiConvRate').textContent = o.conversionRate + '%';
        }

        // Render Funnel
        if (funnelRes.success && funnelRes.funnel) {
            const funnelEl = document.getElementById('funnelChart');
            const colors = ['#667eea', '#f59e0b', '#10b981'];
            funnelEl.innerHTML = funnelRes.funnel.map((f, i) => `
                <div style="margin-bottom:16px">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:14px">
                        <span style="font-weight:600">${f.stage}</span>
                        <span style="color:var(--text-muted)">${f.count} (${f.percent}%)</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.05);border-radius:8px;height:32px;overflow:hidden">
                        <div style="width:${f.percent}%;height:100%;background:${colors[i]};border-radius:8px;transition:width 0.8s ease;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:white">${f.percent}%</div>
                    </div>
                </div>
            `).join('');
        }

        // Render Segments
        if (overviewRes.success && overviewRes.segments) {
            const segEl = document.getElementById('segmentsChart');
            const segColors = { VIP: '#f59e0b', Regular: '#10b981', New: '#667eea', Inactive: '#94a3b8', Lost: '#ef4444' };
            const segEmojis = { VIP: '⭐', Regular: '👤', New: '🆕', Inactive: '💤', Lost: '❌' };
            const segs = overviewRes.segments;
            const total = Object.values(segs).reduce((a, b) => a + b, 0) || 1;
            segEl.innerHTML = Object.entries(segs).map(([seg, count]) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;margin-bottom:8px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:3px solid ${segColors[seg] || '#667eea'}">
                    <span style="font-weight:600">${segEmojis[seg] || '👤'} ${seg}</span>
                    <span><strong>${count}</strong> <span style="color:var(--text-muted);font-size:12px">(${Math.round(count / total * 100)}%)</span></span>
                </div>
            `).join('') || '<p class="empty-msg">No customer profiles yet</p>';
        }

        // Render Sentiments
        if (overviewRes.success && overviewRes.sentiments) {
            const sentEl = document.getElementById('sentimentChart');
            const sentEmojis = { positive: '😊', neutral: '😐', negative: '😞' };
            const sentColors = { positive: '#10b981', neutral: '#f59e0b', negative: '#ef4444' };
            const sents = overviewRes.sentiments;
            const sentTotal = Object.values(sents).reduce((a, b) => a + b, 0) || 1;
            sentEl.innerHTML = Object.entries(sents).map(([sent, count]) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;margin-bottom:8px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:3px solid ${sentColors[sent] || '#94a3b8'}">
                    <span style="font-size:20px">${sentEmojis[sent] || '😐'} <span style="font-size:14px;font-weight:600;text-transform:capitalize">${sent}</span></span>
                    <span><strong>${count}</strong> <span style="color:var(--text-muted);font-size:12px">(${Math.round(count / sentTotal * 100)}%)</span></span>
                </div>
            `).join('') || '<p class="empty-msg">No sentiment data yet. Start some conversations!</p>';
        }

        // Render Follow-up Stats & Products
        if (followupRes.success) {
            const fuEl = document.getElementById('followupStats');
            fuEl.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
                    <div style="text-align:center;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
                        <div style="font-size:24px;font-weight:700;color:#f59e0b">${followupRes.pending}</div>
                        <div style="font-size:12px;color:var(--text-muted)">Pending</div>
                    </div>
                    <div style="text-align:center;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
                        <div style="font-size:24px;font-weight:700;color:#667eea">${followupRes.scheduled}</div>
                        <div style="font-size:12px;color:var(--text-muted)">Scheduled</div>
                    </div>
                    <div style="text-align:center;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
                        <div style="font-size:24px;font-weight:700;color:#94a3b8">${followupRes.closedByFollowup}</div>
                        <div style="font-size:12px;color:var(--text-muted)">Closed</div>
                    </div>
                </div>
                <button class="btn btn-outline btn-sm" onclick="runFollowups()" style="width:100%">⚡ Run Pending Follow-ups</button>
            `;
        }

        // Render Top Customers Table
        if (customersRes.success && customersRes.customers) {
            const tbody = document.getElementById('topCustomersBody');
            const segBadge = (seg) => {
                const colors = { VIP: '#f59e0b', Regular: '#10b981', New: '#667eea', Inactive: '#94a3b8', Lost: '#ef4444' };
                return `<span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${colors[seg] || '#667eea'}22;color:${colors[seg] || '#667eea'}">${seg}</span>`;
            };
            const sentBadge = (sent) => {
                const emojis = { positive: '😊', neutral: '😐', negative: '😞' };
                return emojis[sent] || '—';
            };

            if (customersRes.customers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="empty-msg">No customer profiles yet. Start AI conversations to build profiles.</td></tr>';
            } else {
                tbody.innerHTML = customersRes.customers.slice(0, 20).map(c => `
                    <tr>
                        <td><strong>${c.customerName || 'Unknown'}</strong></td>
                        <td>${c.phone || '—'}</td>
                        <td>${segBadge(c.segment)}</td>
                        <td>${c.totalOrders}</td>
                        <td>₹${(c.totalSpent || 0).toLocaleString()}</td>
                        <td>₹${c.avgOrderValue || 0}</td>
                        <td>${c.totalConversations || 0}</td>
                        <td>${c.totalReorders || 0}</td>
                        <td>${sentBadge(c.lastSentiment)}</td>
                    </tr>
                `).join('');
            }
        }

        // Also load call analytics
        loadCallAnalytics();

    } catch (err) {
        console.error('Analytics load error:', err);
    }
}

async function seedProducts() {
    try {
        showToast('🌿 Seeding Herb Agent product catalog...', 'info');
        const res = await fetch(`${API}/api/products/seed`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ ${data.message}`, 'success');
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (e) {
        showToast('❌ Seed failed: ' + e.message, 'error');
    }
}

async function runFollowups() {
    try {
        showToast('⚡ Running follow-ups...', 'info');
        const res = await fetch(`${API}/api/followups/run`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ ${data.message}`, 'success');
            loadAnalytics();
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (e) {
        showToast('❌ Follow-up failed: ' + e.message, 'error');
    }
}

// Load tab data when opened
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab === 'analytics') loadAnalytics();
            if (tab === 'logs') {
                loadCallLogs();
                loadScheduledCalls();
            }
            if (tab === 'reorders') loadReorderHistory();
        });
    });

    // Refresh buttons
    document.getElementById('btnRefreshLogs')?.addEventListener('click', () => {
        loadCallLogs();
        loadScheduledCalls();
    });
    document.getElementById('btnRefreshReorders')?.addEventListener('click', loadReorderHistory);

    // Quick Test Call
    document.getElementById('btnQuickCall')?.addEventListener('click', async () => {
        const customerName = document.getElementById('quickName').value.trim();
        const mobile = document.getElementById('quickMobile').value.trim();

        if (!customerName || !mobile) {
            return showToast('Please enter both name and mobile!', 'error');
        }

        try {
            showToast('🚀 Triggering test call...', 'info');
            const res = await fetch(`${API}/api/agent/call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerName, mobile, items: 'Testing (Bulk/Quick Call)' })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`✅ Call Triggered: ${data.callId}`, 'success');
                setTimeout(() => {
                    loadCallLogs();
                }, 2000);
            } else {
                showToast(`❌ Error: ${data.message}`, 'error');
            }
        } catch (e) {
            showToast(`❌ Request Failed: ${e.message}`, 'error');
        }
    });
});
