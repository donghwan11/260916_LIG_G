/**
 * LIG DNA DOTO APP - Interactive Client Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Current filter state
    const state = {
        category: 'all',
        status: 'all',
        priority: 'all',
        search: ''
    };

    // DOM Elements
    const taskListContainer = document.getElementById('taskListContainer');
    const emptyStateView = document.getElementById('emptyStateView');
    const taskDisplayCount = document.getElementById('taskDisplayCount');

    // KPI & Progress
    const statTotalCount = document.getElementById('statTotalCount');
    const statInProgressCount = document.getElementById('statInProgressCount');
    const statCompletedCount = document.getElementById('statCompletedCount');
    const statDueTodayCount = document.getElementById('statDueTodayCount');
    const statCompletionRateText = document.getElementById('statCompletionRateText');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressBarPercent = document.getElementById('progressBarPercent');

    // Quick Add
    const quickAddForm = document.getElementById('quickAddForm');
    const quickTitleInput = document.getElementById('quickTitleInput');
    const quickCategorySelect = document.getElementById('quickCategorySelect');
    const quickPrioritySelect = document.getElementById('quickPrioritySelect');
    const quickDueDateInput = document.getElementById('quickDueDateInput');

    // Filter Controls
    const categoryTabs = document.getElementById('categoryTabs');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const searchInput = document.getElementById('searchInput');
    const btnClearSearch = document.getElementById('btnClearSearch');
    const btnEmptyResetFilter = document.getElementById('btnEmptyResetFilter');

    // Modals
    const taskModalBackdrop = document.getElementById('taskModalBackdrop');
    const taskModalForm = document.getElementById('taskModalForm');
    const modalTitle = document.getElementById('modalTitle');
    const modalTaskId = document.getElementById('modalTaskId');
    const modalTaskTitle = document.getElementById('modalTaskTitle');
    const modalTaskDesc = document.getElementById('modalTaskDesc');
    const modalTaskCategory = document.getElementById('modalTaskCategory');
    const modalTaskPriority = document.getElementById('modalTaskPriority');
    const modalTaskStatus = document.getElementById('modalTaskStatus');
    const modalTaskDueDate = document.getElementById('modalTaskDueDate');
    const btnModalClose = document.getElementById('btnModalClose');
    const btnModalCancel = document.getElementById('btnModalCancel');
    const btnOpenNewModal = document.getElementById('btnOpenNewModal');

    // AI Suggestions Modal
    const aiModalBackdrop = document.getElementById('aiModalBackdrop');
    const btnAiSuggest = document.getElementById('btnAiSuggest');
    const btnAiModalClose = document.getElementById('btnAiModalClose');
    const aiTemplateList = document.getElementById('aiTemplateList');

    // Export & Reset
    const btnExportMenu = document.getElementById('btnExportMenu');
    const exportMenu = document.getElementById('exportMenu');
    const btnResetSamples = document.getElementById('btnResetSamples');

    // Theme Toggle
    const btnThemeToggle = document.getElementById('btnThemeToggle');
    const themeIcon = document.getElementById('themeIcon');

    // Set Default Today's Date
    const todayStr = new Date().toISOString().split('T')[0];
    quickDueDateInput.value = todayStr;
    modalTaskDueDate.value = todayStr;

    // Initialize
    initTheme();
    loadStats();
    loadTodos();
    setupEventListeners();

    /* ==========================================================================
       API Functions
       ========================================================================== */

    async function loadTodos() {
        try {
            const params = new URLSearchParams();
            if (state.category !== 'all') params.append('category', state.category);
            if (state.status !== 'all') params.append('status', state.status);
            if (state.priority !== 'all') params.append('priority', state.priority);
            if (state.search.trim()) params.append('search', state.search.trim());

            const res = await fetch(`/api/todos?${params.toString()}`);
            const result = await res.json();

            if (result.success) {
                renderTodos(result.data);
            } else {
                showToast(result.message || '업무 목록을 불러오지 못했습니다.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('서버 통신 중 오류가 발생했습니다.', 'error');
        }
    }

    async function loadStats() {
        try {
            const res = await fetch('/api/stats');
            const result = await res.json();
            if (result.success) {
                const s = result.data;
                statTotalCount.textContent = s.total;
                statInProgressCount.textContent = s.in_progress;
                statCompletedCount.textContent = s.completed;
                statDueTodayCount.textContent = s.due_today_or_overdue;
                statCompletionRateText.textContent = `달성률 ${s.completion_rate}%`;

                progressBarFill.style.width = `${s.completion_rate}%`;
                progressBarPercent.textContent = `${s.completion_rate}%`;
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function saveTodo(todoData, isEdit = false, todoId = null) {
        try {
            const url = isEdit ? `/api/todos/${todoId}` : '/api/todos';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todoData)
            });
            const result = await res.json();

            if (result.success) {
                showToast(result.message, 'success');
                closeModal();
                loadTodos();
                loadStats();
            } else {
                showToast(result.message || '저장에 실패했습니다.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('저장 중 네트워크 오류가 발생했습니다.', 'error');
        }
    }

    async function toggleStatus(id) {
        try {
            const res = await fetch(`/api/todos/${id}/toggle`, { method: 'PATCH' });
            const result = await res.json();
            if (result.success) {
                loadTodos();
                loadStats();
                showToast(`업무 상태가 변경되었습니다.`, 'info');
            } else {
                showToast(result.message || '상태 변경 실패', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('상태 변경 중 오류가 발생했습니다.', 'error');
        }
    }

    async function deleteTodo(id, title) {
        if (!confirm(`정말로 이 업무를 삭제하시겠습니까?\n\n"${title}"`)) {
            return;
        }

        try {
            const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                showToast(result.message, 'success');
                loadTodos();
                loadStats();
            } else {
                showToast(result.message || '삭제 실패', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('삭제 중 오류가 발생했습니다.', 'error');
        }
    }

    /* ==========================================================================
       Rendering
       ========================================================================== */

    function renderTodos(todos) {
        taskDisplayCount.textContent = `${todos.length}개`;

        if (!todos || todos.length === 0) {
            taskListContainer.innerHTML = '';
            emptyStateView.classList.remove('hidden');
            return;
        }

        emptyStateView.classList.add('hidden');
        taskListContainer.innerHTML = todos.map(todo => createTodoCardHTML(todo)).join('');

        // Attach event listeners to newly rendered cards
        todos.forEach(todo => {
            const card = document.getElementById(`task-card-${todo.id}`);
            if (!card) return;

            // Toggle status button
            const btnToggle = card.querySelector('.status-toggle-btn');
            btnToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleStatus(todo.id);
            });

            // Edit button
            const btnEdit = card.querySelector('.btn-edit');
            btnEdit.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(todo);
            });

            // Delete button
            const btnDelete = card.querySelector('.btn-delete');
            btnDelete.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTodo(todo.id, todo.title);
            });
        });
    }

    function createTodoCardHTML(todo) {
        const statusMap = {
            'pending': { icon: '⭕', label: '대기 중', class: 'status-pending' },
            'in_progress': { icon: '⚡', label: '진행 중', class: 'status-in_progress' },
            'completed': { icon: '✓', label: '완료', class: 'status-completed' }
        };

        const currentStatus = statusMap[todo.status] || statusMap['pending'];

        // Calculate D-Day
        let dDayBadge = '';
        if (todo.due_date) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const due = new Date(todo.due_date);
            due.setHours(0,0,0,0);
            const diffTime = due.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (todo.status === 'completed') {
                dDayBadge = `<span class="due-badge">📅 ${todo.due_date} (완료)</span>`;
            } else if (diffDays < 0) {
                dDayBadge = `<span class="due-badge overdue">⚠️ 마감 ${Math.abs(diffDays)}일 지남 (${todo.due_date})</span>`;
            } else if (diffDays === 0) {
                dDayBadge = `<span class="due-badge today">🔥 오늘 마감 (${todo.due_date})</span>`;
            } else {
                dDayBadge = `<span class="due-badge">📅 D-${diffDays} (${todo.due_date})</span>`;
            }
        }

        const categoryIcons = {
            '업무자동화': '⚡',
            '방위산업/R&D': '🛡️',
            '디지털혁신': '🧬',
            '경영기획': '📊',
            '일반업무': '📝'
        };
        const catIcon = categoryIcons[todo.category] || '📌';

        return `
            <div class="task-card status-${todo.status}" id="task-card-${todo.id}" role="listitem">
                <button class="status-toggle-btn" title="상태 변경 (대기 ➔ 진행중 ➔ 완료)" aria-label="상태 순환 토글">
                    <span>${currentStatus.icon}</span>
                </button>

                <div class="task-body">
                    <div class="task-main-row">
                        <span class="task-title">${escapeHTML(todo.title)}</span>
                    </div>

                    ${todo.description ? `<p class="task-desc">${escapeHTML(todo.description)}</p>` : ''}

                    <div class="task-meta-row">
                        <span class="badge badge-category">${catIcon} ${escapeHTML(todo.category)}</span>
                        <span class="badge badge-priority-${todo.priority}">우선순위: ${escapeHTML(todo.priority)}</span>
                        <span class="badge badge-status ${currentStatus.class}">${currentStatus.label}</span>
                        ${dDayBadge}
                    </div>
                </div>

                <div class="task-actions">
                    <button class="btn-task-action btn-edit" title="수정" aria-label="수정">
                        <span>✏️</span>
                    </button>
                    <button class="btn-task-action btn-delete delete" title="삭제" aria-label="삭제">
                        <span>🗑️</span>
                    </button>
                </div>
            </div>
        `;
    }

    /* ==========================================================================
       AI Templates / Presets
       ========================================================================== */

    const aiTemplates = [
        {
            title: "[RPA] 일일 방산 조달 및 계약 현황 데이터 자동 취합 봇 개발",
            desc: "나라장터 및 국방전자조달 시스템 공고 실시간 모니터링 및 엑셀 자동 정리",
            category: "업무자동화",
            priority: "긴급",
            dueOffset: 2
        },
        {
            title: "[방산/R&D] 군집 드론 협력 수색 알고리즘 LiteVLA 시뮬레이션",
            desc: "MARL 전문가 증류 기법을 적용한 다중 무인기 탐색/제어 시뮬레이션 환경 구축",
            category: "방위산업/R&D",
            priority: "높음",
            dueOffset: 5
        },
        {
            title: "[디지털혁신] 전사 Claude Code 프롬프트 템플릿 라이브러리 배포",
            desc: "사내 공통 보고서 양식 채우기 및 회의록 요약 자동화 프롬프트 패키징",
            category: "디지털혁신",
            priority: "보통",
            dueOffset: 3
        },
        {
            title: "[경영기획] 2026 하반기 주요 부품 공급망(SCM) 리스크 평가",
            desc: "단가 인상 요청 논리 분석 및 대체 협력사 리스크 시나리오 비교 분석",
            category: "경영기획",
            priority: "높음",
            dueOffset: 4
        },
        {
            title: "[업무자동화] 결재 문서 오탈자 및 보안 규정 위반 자동 검측 스크립트",
            desc: "대외 반출 문서 내 기밀 키워드 및 주민번호 마스킹 자동 검증 도구",
            category: "업무자동화",
            priority: "보통",
            dueOffset: 1
        }
    ];

    function renderAiTemplates() {
        aiTemplateList.innerHTML = aiTemplates.map((t, idx) => `
            <div class="ai-template-item" data-index="${idx}">
                <div class="ai-template-info">
                    <span class="ai-template-title">${escapeHTML(t.title)}</span>
                    <span class="ai-template-sub">${escapeHTML(t.category)} · 우선순위: ${t.priority} · ${escapeHTML(t.desc)}</span>
                </div>
                <div class="ai-template-action">추가 ➔</div>
            </div>
        `).join('');

        aiTemplateList.querySelectorAll('.ai-template-item').forEach(item => {
            item.addEventListener('click', async () => {
                const idx = item.dataset.index;
                const tmpl = aiTemplates[idx];
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + tmpl.dueOffset);

                const data = {
                    title: tmpl.title,
                    description: tmpl.desc,
                    category: tmpl.category,
                    priority: tmpl.priority,
                    status: 'pending',
                    due_date: dueDate.toISOString().split('T')[0]
                };

                aiModalBackdrop.classList.add('hidden');
                await saveTodo(data, false);
            });
        });
    }

    /* ==========================================================================
       Event Listeners & Handlers
       ========================================================================== */

    function setupEventListeners() {
        // Quick Add Form
        quickAddForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = quickTitleInput.value.trim();
            if (!title) return;

            const data = {
                title: title,
                category: quickCategorySelect.value,
                priority: quickPrioritySelect.value,
                due_date: quickDueDateInput.value,
                status: 'pending'
            };

            await saveTodo(data, false);
            quickTitleInput.value = '';
        });

        // Category Tabs
        categoryTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab-btn');
            if (!btn) return;

            categoryTabs.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            state.category = btn.dataset.category;
            loadTodos();
        });

        // Status & Priority Select Filter
        statusFilter.addEventListener('change', (e) => {
            state.status = e.target.value;
            loadTodos();
        });

        priorityFilter.addEventListener('change', (e) => {
            state.priority = e.target.value;
            loadTodos();
        });

        // Search Input (Debounced)
        let debounceTimer = null;
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value;
            btnClearSearch.classList.toggle('hidden', val.length === 0);

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                state.search = val;
                loadTodos();
            }, 250);
        });

        btnClearSearch.addEventListener('click', () => {
            searchInput.value = '';
            btnClearSearch.classList.add('hidden');
            state.search = '';
            loadTodos();
        });

        btnEmptyResetFilter.addEventListener('click', () => {
            state.category = 'all';
            state.status = 'all';
            state.priority = 'all';
            state.search = '';

            statusFilter.value = 'all';
            priorityFilter.value = 'all';
            searchInput.value = '';
            btnClearSearch.classList.add('hidden');

            categoryTabs.querySelectorAll('.tab-btn').forEach(b => {
                const isActive = b.dataset.category === 'all';
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });

            loadTodos();
        });

        // Open Modal for New Task
        btnOpenNewModal.addEventListener('click', () => {
            openNewModal();
        });

        // Modal Close Buttons
        btnModalClose.addEventListener('click', closeModal);
        btnModalCancel.addEventListener('click', closeModal);
        taskModalBackdrop.addEventListener('click', (e) => {
            if (e.target === taskModalBackdrop) closeModal();
        });

        // Task Modal Form Submit
        taskModalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const isEdit = !!modalTaskId.value;
            const data = {
                title: modalTaskTitle.value.trim(),
                description: modalTaskDesc.value.trim(),
                category: modalTaskCategory.value,
                priority: modalTaskPriority.value,
                status: modalTaskStatus.value,
                due_date: modalTaskDueDate.value
            };

            await saveTodo(data, isEdit, modalTaskId.value);
        });

        // AI Suggestion Modal
        btnAiSuggest.addEventListener('click', () => {
            renderAiTemplates();
            aiModalBackdrop.classList.remove('hidden');
        });
        btnAiModalClose.addEventListener('click', () => {
            aiModalBackdrop.classList.add('hidden');
        });
        aiModalBackdrop.addEventListener('click', (e) => {
            if (e.target === aiModalBackdrop) aiModalBackdrop.classList.add('hidden');
        });

        // Export Dropdown
        btnExportMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            exportMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', () => {
            exportMenu.classList.add('hidden');
        });

        // Reset Samples
        btnResetSamples.addEventListener('click', async () => {
            if (!confirm('기본 LIG DNA 샘플 업무 목록으로 복원하시겠습니까? 기존 데이터는 대체됩니다.')) {
                return;
            }
            try {
                const res = await fetch('/api/reset', { method: 'POST' });
                const result = await res.json();
                if (result.success) {
                    showToast(result.message, 'success');
                    loadTodos();
                    loadStats();
                }
            } catch (err) {
                console.error(err);
                showToast('초기화 중 오류 발생', 'error');
            }
        });

        // Theme Toggle
        btnThemeToggle.addEventListener('click', toggleTheme);

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
                aiModalBackdrop.classList.add('hidden');
                exportMenu.classList.add('hidden');
            }
        });
    }

    function openNewModal() {
        modalTitle.textContent = '새 업무 등록';
        modalTaskId.value = '';
        modalTaskTitle.value = '';
        modalTaskDesc.value = '';
        modalTaskCategory.value = state.category !== 'all' ? state.category : '업무자동화';
        modalTaskPriority.value = '보통';
        modalTaskStatus.value = 'pending';
        modalTaskDueDate.value = todayStr;
        taskModalBackdrop.classList.remove('hidden');
        modalTaskTitle.focus();
    }

    function openEditModal(todo) {
        modalTitle.textContent = '업무 수정';
        modalTaskId.value = todo.id;
        modalTaskTitle.value = todo.title;
        modalTaskDesc.value = todo.description || '';
        modalTaskCategory.value = todo.category;
        modalTaskPriority.value = todo.priority;
        modalTaskStatus.value = todo.status;
        modalTaskDueDate.value = todo.due_date || todayStr;
        taskModalBackdrop.classList.remove('hidden');
        modalTaskTitle.focus();
    }

    function closeModal() {
        taskModalBackdrop.classList.add('hidden');
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
        showToast(`${next === 'dark' ? '다크' : '라이트'} 모드로 전환되었습니다.`, 'info');
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
