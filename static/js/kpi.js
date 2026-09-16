/**
 * LIG DNA KPI 관리 - Interactive Client Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const state = {
        category: 'all',
        search: ''
    };

    // DOM Elements
    const kpiListContainer = document.getElementById('kpiListContainer');
    const emptyStateView = document.getElementById('emptyStateView');
    const kpiDisplayCount = document.getElementById('kpiDisplayCount');

    // Stats
    const statTotalCount = document.getElementById('statTotalCount');
    const statAchievedCount = document.getElementById('statAchievedCount');
    const statOnTrackCount = document.getElementById('statOnTrackCount');
    const statAtRiskCount = document.getElementById('statAtRiskCount');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressBarPercent = document.getElementById('progressBarPercent');

    // Filter Controls
    const categoryTabs = document.getElementById('categoryTabs');
    const searchInput = document.getElementById('searchInput');
    const btnClearSearch = document.getElementById('btnClearSearch');
    const btnEmptyResetFilter = document.getElementById('btnEmptyResetFilter');

    // Modal
    const kpiModalBackdrop = document.getElementById('kpiModalBackdrop');
    const kpiModalForm = document.getElementById('kpiModalForm');
    const modalTitle = document.getElementById('modalTitle');
    const modalKpiId = document.getElementById('modalKpiId');
    const modalKpiName = document.getElementById('modalKpiName');
    const modalKpiDesc = document.getElementById('modalKpiDesc');
    const modalKpiCategory = document.getElementById('modalKpiCategory');
    const modalKpiUnit = document.getElementById('modalKpiUnit');
    const modalKpiTarget = document.getElementById('modalKpiTarget');
    const modalKpiActual = document.getElementById('modalKpiActual');
    const btnModalClose = document.getElementById('btnModalClose');
    const btnModalCancel = document.getElementById('btnModalCancel');
    const btnOpenNewModal = document.getElementById('btnOpenNewModal');

    const btnThemeToggle = document.getElementById('btnThemeToggle');
    const themeIcon = document.getElementById('themeIcon');

    const STATUS_LABEL = {
        achieved: '🎯 달성',
        on_track: '⚡ 순항',
        at_risk: '⚠️ 위험'
    };

    const CATEGORY_ICON = {
        '업무자동화': '⚡',
        '방위산업/R&D': '🛡️',
        '디지털혁신': '🧬',
        '경영기획': '📊',
        '일반업무': '📝'
    };

    let debounceTimer = null;

    init();

    function init() {
        initTheme();
        bindEvents();
        loadKpis();
        loadStats();
    }

    function bindEvents() {
        categoryTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab-btn');
            if (!tab) return;
            document.querySelectorAll('#categoryTabs .tab-btn').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            state.category = tab.dataset.category;
            loadKpis();
        });

        searchInput.addEventListener('input', () => {
            btnClearSearch.classList.toggle('hidden', !searchInput.value);
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                state.search = searchInput.value.trim();
                loadKpis();
            }, 300);
        });

        btnClearSearch.addEventListener('click', () => {
            searchInput.value = '';
            btnClearSearch.classList.add('hidden');
            state.search = '';
            loadKpis();
        });

        btnEmptyResetFilter.addEventListener('click', () => {
            state.category = 'all';
            state.search = '';
            searchInput.value = '';
            btnClearSearch.classList.add('hidden');
            document.querySelectorAll('#categoryTabs .tab-btn').forEach(t => {
                t.classList.toggle('active', t.dataset.category === 'all');
                t.setAttribute('aria-selected', t.dataset.category === 'all' ? 'true' : 'false');
            });
            loadKpis();
        });

        btnOpenNewModal.addEventListener('click', () => openModal());
        btnModalClose.addEventListener('click', closeModal);
        btnModalCancel.addEventListener('click', closeModal);
        kpiModalBackdrop.addEventListener('click', (e) => {
            if (e.target === kpiModalBackdrop) closeModal();
        });

        kpiModalForm.addEventListener('submit', handleFormSubmit);

        btnThemeToggle.addEventListener('click', toggleTheme);
    }

    async function loadKpis() {
        const params = new URLSearchParams();
        if (state.category !== 'all') params.set('category', state.category);
        if (state.search) params.set('search', state.search);

        try {
            const res = await fetch(`/api/kpis?${params.toString()}`);
            const json = await res.json();
            if (json.success) {
                renderKpis(json.data);
                kpiDisplayCount.textContent = `${json.count}개`;
            }
        } catch (err) {
            showToast('KPI 목록을 불러오지 못했습니다.', 'error');
        }
    }

    async function loadStats() {
        try {
            const res = await fetch('/api/kpis/stats');
            const json = await res.json();
            if (json.success) {
                const s = json.data;
                statTotalCount.textContent = s.total;
                statAchievedCount.textContent = s.achieved;
                statOnTrackCount.textContent = s.on_track;
                statAtRiskCount.textContent = s.at_risk;
                progressBarFill.style.width = `${Math.min(s.avg_achievement_rate, 100)}%`;
                progressBarPercent.textContent = `${s.avg_achievement_rate}%`;
            }
        } catch (err) {
            showToast('KPI 통계를 불러오지 못했습니다.', 'error');
        }
    }

    function renderKpis(kpis) {
        kpiListContainer.innerHTML = '';
        emptyStateView.classList.toggle('hidden', kpis.length > 0);
        kpiListContainer.classList.toggle('hidden', kpis.length === 0);

        kpis.forEach(kpi => {
            kpiListContainer.appendChild(buildKpiCard(kpi));
        });
    }

    function buildKpiCard(kpi) {
        const card = document.createElement('div');
        card.className = 'kpi-card';
        card.dataset.id = kpi.id;

        const rate = Math.min(kpi.achievement_rate, 100);
        const icon = CATEGORY_ICON[kpi.category] || '📁';

        card.innerHTML = `
            <div class="kpi-card-top">
                <div class="kpi-title-wrap">
                    <span class="kpi-title">${escapeHTML(kpi.name)}</span>
                    ${kpi.description ? `<span class="kpi-desc">${escapeHTML(kpi.description)}</span>` : ''}
                    <div class="kpi-meta-row">
                        <span class="badge badge-category">${icon} ${escapeHTML(kpi.category)}</span>
                        <span class="badge badge-status status-${kpi.status}">${STATUS_LABEL[kpi.status]}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-task-action btn-edit" title="수정" aria-label="KPI 수정">✏️</button>
                    <button class="btn-task-action delete btn-delete" title="삭제" aria-label="KPI 삭제">🗑️</button>
                </div>
            </div>
            <div class="kpi-progress-row">
                <div class="kpi-progress-track">
                    <div class="kpi-progress-fill status-${kpi.status}" style="width: ${rate}%;"></div>
                </div>
                <span class="kpi-progress-numbers"><strong>${formatNum(kpi.actual_value)}</strong> / ${formatNum(kpi.target_value)} ${escapeHTML(kpi.unit)}</span>
                <span class="kpi-rate status-${kpi.status}">${kpi.achievement_rate}%</span>
            </div>
        `;

        card.querySelector('.btn-edit').addEventListener('click', () => openModal(kpi));
        card.querySelector('.btn-delete').addEventListener('click', () => handleDelete(kpi));

        return card;
    }

    function formatNum(n) {
        const num = Number(n);
        return Number.isInteger(num) ? num.toString() : num.toFixed(2);
    }

    function openModal(kpi = null) {
        kpiModalForm.reset();
        if (kpi) {
            modalTitle.textContent = 'KPI 수정';
            modalKpiId.value = kpi.id;
            modalKpiName.value = kpi.name;
            modalKpiDesc.value = kpi.description || '';
            modalKpiCategory.value = kpi.category;
            modalKpiUnit.value = kpi.unit;
            modalKpiTarget.value = kpi.target_value;
            modalKpiActual.value = kpi.actual_value;
        } else {
            modalTitle.textContent = '새 KPI 등록';
            modalKpiId.value = '';
            modalKpiUnit.value = '건';
            modalKpiActual.value = 0;
        }
        kpiModalBackdrop.classList.remove('hidden');
        modalKpiName.focus();
    }

    function closeModal() {
        kpiModalBackdrop.classList.add('hidden');
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        const payload = {
            name: modalKpiName.value.trim(),
            description: modalKpiDesc.value.trim(),
            category: modalKpiCategory.value,
            unit: modalKpiUnit.value.trim() || '건',
            target_value: parseFloat(modalKpiTarget.value || 0),
            actual_value: parseFloat(modalKpiActual.value || 0)
        };

        const id = modalKpiId.value;
        const url = id ? `/api/kpis/${id}` : '/api/kpis';
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (json.success) {
                showToast(json.message, 'success');
                closeModal();
                loadKpis();
                loadStats();
            } else {
                showToast(json.message || '저장에 실패했습니다.', 'error');
            }
        } catch (err) {
            showToast('서버 요청 중 오류가 발생했습니다.', 'error');
        }
    }

    async function handleDelete(kpi) {
        if (!confirm(`'${kpi.name}' KPI를 삭제하시겠습니까?`)) return;

        try {
            const res = await fetch(`/api/kpis/${kpi.id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                showToast(json.message, 'success');
                loadKpis();
                loadStats();
            } else {
                showToast(json.message || '삭제에 실패했습니다.', 'error');
            }
        } catch (err) {
            showToast('서버 요청 중 오류가 발생했습니다.', 'error');
        }
    }

    /* ==========================================================================
       Theme Toggle
       ========================================================================== */

    function initTheme() {
        const saved = localStorage.getItem('lig_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        themeIcon.textContent = saved === 'dark' ? '☀️' : '🌙';
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('lig_theme', next);
        themeIcon.textContent = next === 'dark' ? '☀️' : '🌙';
    }

    /* ==========================================================================
       Toast Helper
       ========================================================================== */

    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : 'ℹ️');
        toast.innerHTML = `<span>${icon}</span><span>${escapeHTML(message)}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
