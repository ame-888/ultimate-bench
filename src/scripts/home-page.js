import { isolateDialog, trapDialogFocus } from './DialogUtils.js';
import { enhanceRelativeDates } from './TimeUtils.js';

const configElement = document.getElementById('home-page-config');

if (!(configElement instanceof HTMLScriptElement)) {
    throw new Error('Home page configuration is missing.');
}

const { unifiedRawList, dataRawList, chessRawList } = JSON.parse(configElement.textContent || '{}');

function init() {
    const wrappers = {
        visual: document.getElementById('visual-benchmark-wrapper'),
        data: document.getElementById('data-benchmark-wrapper'),
        chess: document.getElementById('chess-benchmark-wrapper'),
    };
    const homeWrapper = document.getElementById('home-wrapper');
    const modalOverlay = document.getElementById('benchmark-modal');
    const modalBody = document.getElementById('benchmark-modal-body');
    const modalCloseBtn = document.getElementById('benchmark-modal-close');

    let modalReturnFocus = null;
    let restoreModalBackground = null;

    function parkWrappers() {
        if (!homeWrapper?.parentNode) return;
        Object.values(wrappers).forEach((wrapper) => {
            if (wrapper) {
                wrapper.classList.add('hidden');
                homeWrapper.parentNode.appendChild(wrapper);
            }
        });
    }

    function openModal(mode) {
        if (!modalOverlay || !modalBody) return;
        parkWrappers();
        modalBody.innerHTML = '';

        const targetWrapper = wrappers[mode];
        if (!targetWrapper) return;

        targetWrapper.classList.remove('hidden');
        modalBody.appendChild(targetWrapper);
        modalReturnFocus = document.activeElement;
        modalOverlay.hidden = false;
        modalOverlay.classList.add('active');
        restoreModalBackground = isolateDialog(modalOverlay);
        document.querySelector(`.expand-btn[data-target="${mode}"]`)?.setAttribute('aria-expanded', 'true');
        modalCloseBtn?.focus();
    }

    function closeModal() {
        if (!modalOverlay || !modalBody) return;

        modalOverlay.classList.remove('active');
        modalOverlay.hidden = true;
        restoreModalBackground?.();
        restoreModalBackground = null;
        document.querySelectorAll('.expand-btn').forEach((button) => {
            button.setAttribute('aria-expanded', 'false');
        });
        if (modalBody.firstElementChild && homeWrapper?.parentNode) {
            const child = modalBody.firstElementChild;
            child.classList.add('hidden');
            homeWrapper.parentNode.appendChild(child);
        }
        if (modalReturnFocus instanceof HTMLElement) {
            modalReturnFocus.focus({ preventScroll: true });
        }
    }

    modalCloseBtn?.addEventListener('click', closeModal);
    modalOverlay?.addEventListener('click', (event) => {
        if (event.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (event) => {
        const isModalOpen = modalOverlay?.classList.contains('active');
        if (!isModalOpen) return;
        if (event.key === 'Escape') closeModal();
        trapDialogFocus(event, modalOverlay);
    });

    // --- Ultimate Bench Sorting Logic ---
    const sortColumns = [
        { key: 'overall', btnId: 'ultimate-sort-btn', textId: 'ultimate-sort-text', cellClass: '.ultimate-score-cell' },
        { key: 'visual', btnId: 'ultimate-visual-sort-btn', textId: 'ultimate-visual-sort-text', cellClass: '.ultimate-visual-score-cell' },
        { key: 'data', btnId: 'ultimate-data-sort-btn', textId: 'ultimate-data-sort-text', cellClass: '.ultimate-data-score-cell' },
        { key: 'chess', btnId: 'ultimate-chess-sort-btn', textId: 'ultimate-chess-sort-text', cellClass: '.ultimate-chess-score-cell' },
    ];

    const sortState = { key: 'overall', ascending: false };

    sortColumns.forEach(({ key, btnId, textId, cellClass }) => {
        const btn = document.getElementById(btnId);
        const textEl = document.getElementById(textId);
        if (!btn || !textEl) return;

        btn.addEventListener('click', () => {
            if (sortState.key === key) {
                sortState.ascending = !sortState.ascending;
            } else {
                sortState.key = key;
                sortState.ascending = false;
            }

            document.querySelectorAll('.ultimate-table-header th[aria-sort]').forEach((header) => {
                header.setAttribute('aria-sort', 'none');
            });
            btn.closest('th')?.setAttribute('aria-sort', sortState.ascending ? 'ascending' : 'descending');

            sortColumns.forEach((col) => {
                const indicator = document.getElementById(col.textId);
                if (indicator) indicator.textContent = '▼';
            });
            textEl.textContent = sortState.ascending ? '▲' : '▼';

            const tableContainer = document.querySelector('.ultimate-modern-container');
            const tableBody = tableContainer?.querySelector('.ultimate-table-body');
            if (!tableContainer || !tableBody) return;

            const rows = Array.from(tableContainer.querySelectorAll('.ultimate-row-hover'));

            rows.sort((a, b) => {
                const cellA = a.querySelector(cellClass);
                const cellB = b.querySelector(cellClass);

                const scoreA = cellClass === '.ultimate-score-cell'
                    ? (cellA ? parseFloat(cellA.getAttribute('data-absolute-score') || '0') : 0)
                    : (cellA ? parseFloat(cellA.getAttribute('data-score') || '0') : 0);
                const scoreB = cellClass === '.ultimate-score-cell'
                    ? (cellB ? parseFloat(cellB.getAttribute('data-absolute-score') || '0') : 0)
                    : (cellB ? parseFloat(cellB.getAttribute('data-score') || '0') : 0);

                if (scoreA === scoreB) {
                    const rankA = parseInt(a.querySelector('.ultimate-rank')?.textContent?.replace(/\D/g, '') || '', 10) || 999;
                    const rankB = parseInt(b.querySelector('.ultimate-rank')?.textContent?.replace(/\D/g, '') || '', 10) || 999;
                    return rankA - rankB;
                }

                return sortState.ascending ? scoreA - scoreB : scoreB - scoreA;
            });

            rows.forEach((row) => tableBody.appendChild(row));
        });
    });

    // --- Leaderboard / Pareto / Progress View Mode ---
    const ultimateSection = document.querySelector('.ultimate-bench-section');
    const scoreModeButtons = Array.from(document.querySelectorAll('.score-mode-btn'));

    function setScoreMode(mode) {
        const paretoMode = mode === 'pareto';
        const progressMode = mode === 'progress';
        ultimateSection?.classList.toggle('is-pareto-mode', paretoMode);
        ultimateSection?.classList.toggle('is-progress-mode', progressMode);
        scoreModeButtons.forEach((button) => {
            const active = button.dataset.scoreMode === mode;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        document.querySelector('.absolute-note')?.toggleAttribute('hidden', paretoMode || progressMode);
        document.querySelector('.pareto-panel')?.toggleAttribute('hidden', !paretoMode);
        document.querySelector('.progress-panel')?.toggleAttribute('hidden', !progressMode);
    }

    scoreModeButtons.forEach((button) => {
        button.addEventListener('click', () => setScoreMode(button.dataset.scoreMode));
    });

    // --- Fast, Composable Model Filters ---
    const modelFilterInput = document.getElementById('ultimate-model-filter');
    const providerFilterButtons = Array.from(document.querySelectorAll('.provider-filter-btn'));
    const filterCount = document.getElementById('ultimate-filter-count');
    const filterClear = document.getElementById('ultimate-filter-clear');
    const filterEmpty = document.getElementById('ultimate-filter-empty');
    const leaderboardRows = Array.from(document.querySelectorAll('.ultimate-table-body .ultimate-row-hover'));
    const paretoPoints = Array.from(document.querySelectorAll('.pareto-point'));
    let activeProvider = 'all';

    function applyModelFilters() {
        const query = modelFilterInput instanceof HTMLInputElement ? modelFilterInput.value.trim().toLowerCase() : '';
        let visibleCount = 0;

        leaderboardRows.forEach((row) => {
            const matchesName = (row.dataset.modelName || '').includes(query);
            const matchesProvider = activeProvider === 'all' || row.dataset.provider === activeProvider;
            const isVisible = matchesName && matchesProvider;
            row.hidden = !isVisible;
            if (isVisible) visibleCount++;
        });

        paretoPoints.forEach((point) => {
            const matchesName = (point.dataset.modelName || '').includes(query);
            const matchesProvider = activeProvider === 'all' || point.dataset.provider === activeProvider;
            point.classList.toggle('is-filtered', !matchesName || !matchesProvider);
        });

        if (filterCount) filterCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'model' : 'models'}`;
        if (filterEmpty) filterEmpty.hidden = visibleCount !== 0;
        if (filterClear) filterClear.hidden = !query && activeProvider === 'all';
    }

    modelFilterInput?.addEventListener('input', applyModelFilters);
    providerFilterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeProvider = button.dataset.providerFilter || 'all';
            providerFilterButtons.forEach((candidate) => {
                const isActive = candidate === button;
                candidate.classList.toggle('is-active', isActive);
                candidate.setAttribute('aria-pressed', String(isActive));
            });
            applyModelFilters();
        });
    });

    filterClear?.addEventListener('click', () => {
        if (modelFilterInput instanceof HTMLInputElement) modelFilterInput.value = '';
        activeProvider = 'all';
        providerFilterButtons.forEach((button) => {
            const isActive = button.dataset.providerFilter === 'all';
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
        applyModelFilters();
        modelFilterInput?.focus();
    });

    document.addEventListener('keydown', (event) => {
        const target = event.target;
        const isEditing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable);
        if (event.key === '/' && !isEditing && !modalOverlay?.classList.contains('active')) {
            event.preventDefault();
            modelFilterInput?.focus();
        }
        if (
            event.key === 'Escape' &&
            document.activeElement === modelFilterInput &&
            modelFilterInput instanceof HTMLInputElement &&
            modelFilterInput.value
        ) {
            modelFilterInput.value = '';
            applyModelFilters();
        }
    });

    // --- Arena Detail Modal Triggers ---
    document.querySelectorAll('.expand-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (btn instanceof HTMLElement && btn.dataset.target) {
                openModal(btn.dataset.target);
            }
        });
    });

    // Keep arena summaries compact without introducing nested scrolling.
    document.querySelectorAll('[data-arena-card]').forEach((card) => {
        const toggle = card.querySelector('.arena-toggle');
        if (!toggle || !(card instanceof HTMLElement)) return;

        const rowsAfterPreview = [...card.querySelectorAll('tbody tr')].slice(Number(card.dataset.previewRows));
        const label = toggle.querySelector('[data-arena-toggle-label]');
        const setExpanded = (expanded) => {
            rowsAfterPreview.forEach((row) => {
                row.hidden = !expanded;
            });
            toggle.setAttribute('aria-expanded', String(expanded));
            if (label) label.textContent = expanded ? 'SHOW LESS' : 'SHOW MORE';
        };

        // Synchronize the visible rows, accessible state, and label on startup.
        setExpanded(false);
        toggle.addEventListener('click', () => {
            setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
        });
    });

    // Ensure home wrapper is visible and detail wrappers stay hidden on load
    homeWrapper?.classList.remove('hidden');
    Object.values(wrappers).forEach((wrapper) => wrapper?.classList.add('hidden'));

    // Progressive enhancement uses the visitor's UTC calendar day, not build time.
    enhanceRelativeDates(document);

    // --- Arena Modal Exploratory Ranking Controls ---
    function calculateScores(item, keys, method, globalHardestKey) {
        const rawVals = keys.map((k) => {
            const v = item[k];
            if (v === 'INVALID') return { val: 0, isAttempted: true };
            if (v === 'UNAVAILABLE') return { val: 0, isAttempted: false };
            if (typeof v === 'number') return { val: v, isAttempted: true };
            return { val: 0, isAttempted: false };
        });

        if (method === 'canonical') return item.canonicalScore;
        if (method === 'baseline') return rawVals.map((r) => r.val);
        if (method === 'average') {
            let sum = 0;
            let attemptedCount = 0;
            rawVals.forEach((r) => {
                if (r.isAttempted) {
                    sum += r.val;
                    attemptedCount++;
                }
            });
            return attemptedCount > 0 ? sum / attemptedCount : 0;
        }
        if (method === 'crucible') {
            return rawVals.reduce((sum, r, i) => sum + (r.isAttempted ? r.val * (i + 1) : 0), 0);
        }
        if (method === 'resilience') {
            const lvl1 = rawVals[0];
            if (!lvl1.isAttempted) return 'UNKNOWN';
            if (lvl1.val === 0) return 0;
            if (!globalHardestKey) return 'UNKNOWN';

            const hardestVal = item[globalHardestKey];
            if (hardestVal === 'UNAVAILABLE' || (typeof hardestVal !== 'number' && hardestVal !== 'INVALID')) {
                return 'UNKNOWN';
            }
            const hardestScore = hardestVal === 'INVALID' ? 0 : hardestVal;
            return (hardestScore / lvl1.val) * 100;
        }
        return 0;
    }

    const tooltips = {
        canonical: 'Official Progressive Level Weighting order. Each Active level has twice the weight of the preceding level. This is the only mode used for canonical arena scores and Overall.',
        baseline: 'Sorts descending by Level 1. If tied, looks at Level 2, then Level 3, and so on. Highlights models with the highest foundational capability.',
        average: 'Exploratory flat mean of included results. INVALID contributes zero; UNAVAILABLE is excluded. Changes row order only.',
        crucible: 'Exploratory Linear Level Multiplier (Level 1 x1, Level 2 x2, and so on). Changes row order only and is not the official score.',
        resilience: 'Exploratory retention: uses the highest level with any positive result in this arena, divided by Level 1. Missing coverage at that level is unknown. Changes row order only.',
    };

    function getRankDisplayHtml(rank) {
        if (rank === null) return '—';
        if (rank === 'INVALID') return `<span class="zero-score-glow">INVALID</span>`;
        return `${rank}`;
    }

    function updateTableDOM(tableId, sortedItems) {
        const tableBody = document.getElementById(tableId);
        if (!tableBody) return;

        const headerRow = tableBody.querySelector('.header-row');
        const rowMap = new Map();
        tableBody.querySelectorAll('.benchmark-row.unified-row').forEach((row) => {
            const name = row.getAttribute('data-model-name');
            if (name) rowMap.set(name, row);
        });

        tableBody.innerHTML = '';
        if (headerRow) tableBody.appendChild(headerRow);

        sortedItems.forEach((item) => {
            const row = rowMap.get(item.name);
            if (!row) return;

            const rankEl = row.querySelector('.rank');
            if (rankEl) rankEl.innerHTML = getRankDisplayHtml(item.rank);
            row.classList.toggle('unknown-resilience', Boolean(item.isUnknownResilience));
            tableBody.appendChild(row);
        });
    }

    function sortAndRank(rawList, keys, method) {
        const list = rawList.map((item) => ({ ...item }));

        // Official mode consumes immutable server-generated standings; it never
        // reimplements Progressive Level Weighting in the browser.
        if (method === 'canonical') {
            return list
                .sort(
                    (a, b) =>
                        Number(a.canonicalRank === null) - Number(b.canonicalRank === null) ||
                        (a.canonicalRank ?? 0) - (b.canonicalRank ?? 0) ||
                        a.name.localeCompare(b.name),
                )
                .map((item) => ({ ...item, rank: item.canonicalRank, _sortValue: item.canonicalScore }));
        }

        let globalHardestKey = keys[0];
        for (let i = keys.length - 1; i >= 0; i--) {
            const key = keys[i];
            let maxScore = -Infinity;
            let hasValidData = false;

            for (const item of list) {
                const val = item[key];
                if (val !== 'UNAVAILABLE' && val !== undefined) {
                    hasValidData = true;
                    const numVal = val === 'INVALID' ? 0 : (typeof val === 'number' ? val : 0);
                    if (numVal > maxScore) maxScore = numVal;
                }
            }

            if (hasValidData && maxScore > 0) {
                globalHardestKey = key;
                break;
            }
        }

        list.forEach((item) => {
            item._sortValue = calculateScores(item, keys, method, globalHardestKey);
            item.isUnknownResilience = item._sortValue === 'UNKNOWN';
        });

        const sorted = list.sort((a, b) => {
            if (method === 'baseline') {
                for (const key of keys) {
                    const valA = a[key];
                    const valB = b[key];
                    const numA = valA === 'INVALID' ? 0 : (typeof valA === 'number' ? valA : 0);
                    const numB = valB === 'INVALID' ? 0 : (typeof valB === 'number' ? valB : 0);
                    if (numB !== numA) return numB - numA;
                }
                return 0;
            }
            if (method === 'resilience') {
                if (a._sortValue === 'UNKNOWN' && b._sortValue === 'UNKNOWN') return 0;
                if (a._sortValue === 'UNKNOWN') return 1;
                if (b._sortValue === 'UNKNOWN') return -1;
                return b._sortValue - a._sortValue;
            }
            return b._sortValue - a._sortValue;
        });

        // Exploratory modes may change presentation order, but official rank is
        // immutable server metadata. In particular, provisional rows stay unranked.
        return sorted.map((item) => ({ ...item, rank: item.canonicalRank }));
    }

    const arenaDropdowns = [
        { selectId: 'visual-ranking-method', tooltipId: 'visual-tooltip-text', tableId: 'visual-table-body', data: unifiedRawList, keys: ['lvl1', 'lvl2', 'lvl3', 'lvl4', 'lvl5', 'lvl6'] },
        { selectId: 'chess-ranking-method', tooltipId: 'chess-tooltip-text', tableId: 'chess-table-body', data: chessRawList, keys: ['mouse', 'spider', 'wolf', 'hawk', 'python', 'hydra'] },
        { selectId: 'data-ranking-method', tooltipId: 'data-tooltip-text', tableId: 'data-table-body', data: dataRawList, keys: ['worm', 'koala', 'crow', 'octopus'] },
    ];

    arenaDropdowns.forEach(({ selectId, tooltipId, tableId, data, keys }) => {
        const dropdown = document.getElementById(selectId);
        const tooltip = document.getElementById(tooltipId);
        dropdown?.addEventListener('change', (event) => {
            if (!(event.target instanceof HTMLSelectElement)) return;
            const method = event.target.value;
            if (tooltip && tooltips[method]) tooltip.textContent = tooltips[method];
            updateTableDOM(tableId, sortAndRank(data, keys, method));
        });
    });
}

document.addEventListener('DOMContentLoaded', init);
