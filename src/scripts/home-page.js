import { isolateDialog, trapDialogFocus } from './DialogUtils.js';
const configElement = document.getElementById('home-page-config');

if (!(configElement instanceof HTMLScriptElement)) {
    throw new Error('Home page configuration is missing.');
}

import { enhanceRelativeDates } from './TimeUtils.js';
const { unifiedRawList, dataRawList, chessRawList } = JSON.parse(configElement.textContent || '{}');

function init() {
        const visualWrapper = document.getElementById('visual-benchmark-wrapper');
        const dataWrapper = document.getElementById('data-benchmark-wrapper');
        const chessWrapper = document.getElementById('chess-benchmark-wrapper');

        const homeWrapper = document.getElementById('home-wrapper');

        const modalOverlay = document.getElementById('benchmark-modal');
        const modalBody = document.getElementById('benchmark-modal-body');
        const modalCloseBtn = document.getElementById('benchmark-modal-close');
        let modalReturnFocus = null;
        let restoreModalBackground = null;
        function openModal(mode) {
            if (!modalOverlay || !modalBody) return;

            // Clear previous modal content without destroying elements
            if (visualWrapper) {
                visualWrapper.classList.add('hidden');
                document.getElementById('home-wrapper').parentNode.appendChild(visualWrapper);
            }
            if (dataWrapper) {
                dataWrapper.classList.add('hidden');
                document.getElementById('home-wrapper').parentNode.appendChild(dataWrapper);
            }
            if (chessWrapper) {
                chessWrapper.classList.add('hidden');
                document.getElementById('home-wrapper').parentNode.appendChild(chessWrapper);
            }

            modalBody.innerHTML = '';

            let targetWrapper;
            if (mode === 'visual') targetWrapper = visualWrapper;
            else if (mode === 'data') targetWrapper = dataWrapper;
            else if (mode === 'chess') targetWrapper = chessWrapper;

            if (targetWrapper) {
                targetWrapper.classList.remove('hidden');
                modalBody.appendChild(targetWrapper);
                modalReturnFocus = document.activeElement;
                modalOverlay.hidden = false;
                modalOverlay.classList.add('active');
                restoreModalBackground = isolateDialog(modalOverlay);
                document.querySelector(`.expand-btn[data-target="${mode}"]`)?.setAttribute('aria-expanded', 'true');
                modalCloseBtn?.focus();
            }
        }

        function closeModal() {
            if (!modalOverlay || !modalBody) return;

            modalOverlay.classList.remove('active');
            modalOverlay.hidden = true;
            restoreModalBackground?.();
            restoreModalBackground = null;
            document.querySelectorAll('.expand-btn').forEach(button => button.setAttribute('aria-expanded', 'false'));
            if (modalBody.firstElementChild) {
                const child = modalBody.firstElementChild;
                child.classList.add('hidden');
                homeWrapper.parentNode.appendChild(child);
            }
            if (modalReturnFocus instanceof HTMLElement) modalReturnFocus.focus({ preventScroll: true });
        }

        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeModal);
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) closeModal();
            });
        }

        document.addEventListener('keydown', event => {
            const activeDialog = [modalOverlay].find(dialog => dialog?.classList.contains('active'));
            if (event.key === 'Escape') {
                if (modalOverlay?.classList.contains('active')) closeModal();
            }
            if (activeDialog) trapDialogFocus(event, activeDialog);
        });

        // --- Ultimate Bench Sorting Logic ---
        function setupUltimateSort(btnId, textId, cellClass) {
            const btn = document.getElementById(btnId);
            const textEl = document.getElementById(textId);
            let ascending = false;

            if (btn && textEl) {
                btn.addEventListener('click', () => {
                    ascending = !ascending;

                    // Reset all other headers
                    document.querySelectorAll('.ultimate-table-header th[aria-sort]').forEach(header => header.setAttribute('aria-sort', 'none'));
                    btn.closest('th')?.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
                    const visText = document.getElementById('ultimate-visual-sort-text');
                    if (visText) visText.textContent = '▼';
                    const dataText = document.getElementById('ultimate-data-sort-text');
                    if (dataText) dataText.textContent = '▼';
                    const chessText = document.getElementById('ultimate-chess-sort-text');
                    if (chessText) chessText.textContent = '▼';
                    const avgText = document.getElementById('ultimate-sort-text');
                    if (avgText) avgText.textContent = '▼';

                    textEl.textContent = ascending ? '▲' : '▼';

                    const tableContainer = document.querySelector('.ultimate-modern-container');
                    if (!tableContainer) return;

                    const tableBody = tableContainer.querySelector('.ultimate-table-body');
                    const rows = Array.from(tableContainer.querySelectorAll('.ultimate-row-hover'));

                    rows.sort((a, b) => {
                        const cellA = a.querySelector(cellClass);
                        const cellB = b.querySelector(cellClass);

                        let scoreA = 0;
                        let scoreB = 0;

                        if (cellClass === '.ultimate-score-cell') {
                             scoreA = cellA ? parseFloat(cellA.getAttribute('data-absolute-score')) : 0;
                             scoreB = cellB ? parseFloat(cellB.getAttribute('data-absolute-score')) : 0;
                        } else {
                             scoreA = cellA ? parseFloat(cellA.getAttribute('data-score')) : 0;
                             scoreB = cellB ? parseFloat(cellB.getAttribute('data-score')) : 0;
                        }

                        if (scoreA === scoreB) {
                            // Secondary sort by Rank (which is always ascending naturally)
                            const rankA = parseInt(a.querySelector('.ultimate-rank').textContent.replace(/\D/g, '')) || 999;
                            const rankB = parseInt(b.querySelector('.ultimate-rank').textContent.replace(/\D/g, '')) || 999;
                            return rankA - rankB;
                        }

                        return ascending ? scoreA - scoreB : scoreB - scoreA;
                    });

                    // Re-append sorted rows
                    if (tableBody) rows.forEach(row => tableBody.appendChild(row));
                });
            }
        }

        setupUltimateSort('ultimate-sort-btn', 'ultimate-sort-text', '.ultimate-score-cell');
        setupUltimateSort('ultimate-visual-sort-btn', 'ultimate-visual-sort-text', '.ultimate-visual-score-cell');
        setupUltimateSort('ultimate-data-sort-btn', 'ultimate-data-sort-text', '.ultimate-data-score-cell');
        setupUltimateSort('ultimate-chess-sort-btn', 'ultimate-chess-sort-text', '.ultimate-chess-score-cell');
        // --- Leaderboard / Pareto view mode ---
        const ultimateSection = document.querySelector('.ultimate-bench-section');
        const scoreModeButtons = Array.from(document.querySelectorAll('.score-mode-btn'));

        function setScoreMode(mode) {
            const paretoMode = mode === 'pareto';
            const progressMode = mode === 'progress';
            ultimateSection?.classList.toggle('is-pareto-mode', paretoMode);
            ultimateSection?.classList.toggle('is-progress-mode', progressMode);
            scoreModeButtons.forEach(button => {
                const active = button.dataset.scoreMode === mode;
                button.classList.toggle('is-active', active);
                button.setAttribute('aria-pressed', String(active));
            });
            document.querySelector('.absolute-note')?.toggleAttribute('hidden', paretoMode || progressMode);
            document.querySelector('.pareto-panel')?.toggleAttribute('hidden', !paretoMode);
            document.querySelector('.progress-panel')?.toggleAttribute('hidden', !progressMode);
        }

        scoreModeButtons.forEach(button => button.addEventListener('click', () => setScoreMode(button.dataset.scoreMode)));
        // --- Fast, composable model filters ---
        const modelFilterInput = document.getElementById('ultimate-model-filter');
        const providerFilterButtons = Array.from(document.querySelectorAll('.provider-filter-btn'));
        const filterCount = document.getElementById('ultimate-filter-count');
        const filterClear = document.getElementById('ultimate-filter-clear');
        const filterEmpty = document.getElementById('ultimate-filter-empty');
        const leaderboardRows = Array.from(document.querySelectorAll('.ultimate-table-body .ultimate-row-hover'));
        const paretoPoints = Array.from(document.querySelectorAll('.pareto-point'));
        let activeProvider = 'all';

        function applyModelFilters() {
            const query = modelFilterInput?.value.trim().toLowerCase() || '';
            let visibleCount = 0;

            leaderboardRows.forEach((row) => {
                const matchesName = row.dataset.modelName.includes(query);
                const matchesProvider = activeProvider === 'all' || row.dataset.provider === activeProvider;
                const isVisible = matchesName && matchesProvider;
                row.hidden = !isVisible;
                if (isVisible) visibleCount++;
            });
            paretoPoints.forEach((point) => {
                const matchesName = point.dataset.modelName.includes(query);
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
                activeProvider = button.dataset.providerFilter;
                providerFilterButtons.forEach((candidate) => {
                    const isActive = candidate === button;
                    candidate.classList.toggle('is-active', isActive);
                    candidate.setAttribute('aria-pressed', String(isActive));
                });
                applyModelFilters();
            });
        });

        filterClear?.addEventListener('click', () => {
            if (modelFilterInput) modelFilterInput.value = '';
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
            const isEditing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
            if (event.key === '/' && !isEditing && !modalOverlay?.classList.contains('active')) {
                event.preventDefault();
                modelFilterInput?.focus();
            }
            if (event.key === 'Escape' && document.activeElement === modelFilterInput && modelFilterInput?.value) {
                modelFilterInput.value = '';
                applyModelFilters();
            }
        });


        // Expand buttons
        document.querySelectorAll('.expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = btn.dataset.target;
                openModal(target);
            });
        });

        // Keep arena summaries compact without introducing nested scrolling.
        document.querySelectorAll('[data-arena-card]').forEach(card => {
            const toggle = card.querySelector('.arena-toggle');
            if (!toggle) return;

            const rowsAfterPreview = [...card.querySelectorAll('tbody tr')].slice(Number(card.dataset.previewRows));
            const label = toggle.querySelector('[data-arena-toggle-label]');
            const setExpanded = (expanded) => {
                rowsAfterPreview.forEach(row => { row.hidden = !expanded; });
                toggle.setAttribute('aria-expanded', String(expanded));
                label.textContent = expanded ? 'SHOW LESS' : 'SHOW MORE';
            };

            // Synchronize the visible rows, accessible state, and label on startup.
            setExpanded(false);
            toggle.addEventListener('click', () => {
                setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
            });
        });

        // Ensure home wrapper is visible and others hidden on load
        if (homeWrapper) homeWrapper.classList.remove('hidden');
        if (visualWrapper) visualWrapper.classList.add('hidden');
        if (dataWrapper) dataWrapper.classList.add('hidden');
        if (chessWrapper) chessWrapper.classList.add('hidden');

        // Progressive enhancement uses the visitor's UTC calendar day, not build time.
        enhanceRelativeDates(document);

        // Sorting and DOM update logic
        function calculateScores(item, keys, method, globalHardestKey) {
            const rawVals = keys.map(k => {
                let v = item[k];
                if (v === 'INVALID') return { val: 0, isAttempted: true };
                if (v === 'UNAVAILABLE') return { val: 0, isAttempted: false };
                if (typeof v === 'number') return { val: v, isAttempted: true };
                return { val: 0, isAttempted: false };
            });

            if (method === 'canonical') {
                return item.canonicalScore;
            } else if (method === 'baseline') {
                return rawVals.map(r => r.val); // Handled specially in the sorter
            } else if (method === 'average') {
                let sum = 0;
                let attemptedCount = 0;
                rawVals.forEach(r => {
                    if (r.isAttempted) {
                        sum += r.val;
                        attemptedCount++;
                    }
                });
                return attemptedCount > 0 ? sum / attemptedCount : 0;
            } else if (method === 'crucible') {
                return rawVals.reduce((sum, r, i) => sum + (r.isAttempted ? r.val * (i + 1) : 0), 0);
            } else if (method === 'resilience') {
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
            'canonical': 'Official Progressive Level Weighting order. Each Active level has twice the weight of the preceding level. This is the only mode used for canonical arena scores and Overall.',
            'baseline': 'Sorts descending by Level 1. If tied, looks at Level 2, then Level 3, and so on. Highlights models with the highest foundational capability.',
            'average': 'Exploratory flat mean of included results. INVALID contributes zero; UNAVAILABLE is excluded. Changes row order only.',
            'crucible': 'Exploratory Linear Level Multiplier (Level 1 x1, Level 2 x2, and so on). Changes row order only and is not the official score.',
            'resilience': 'Exploratory retention: uses the highest level with any positive result in this arena, divided by Level 1. Missing coverage at that level is unknown. Changes row order only.'
        };

        function getPixelMedalHtml(rank) {
            let color1, color2, color3;
            if (rank === 1) { color1 = '#FFD700'; color2 = '#DAA520'; color3 = '#B8860B'; } // Gold
            else if (rank === 2) { color1 = '#E0E0E0'; color2 = '#C0C0C0'; color3 = '#A9A9A9'; } // Silver
            else if (rank === 3) { color1 = '#CD7F32'; color2 = '#A0522D'; color3 = '#8B4513'; } // Bronze

            return `<svg width="24" height="24" viewBox="0 0 16 16" style="display:inline-block; vertical-align:middle; filter:drop-shadow(0 2px 2px rgba(0,0,0,0.5));">
                <path d="M4 2 h8 v2 h-8 z" fill="${color3}"/>
                <path d="M3 4 h10 v8 h-10 z" fill="${color2}"/>
                <path d="M4 5 h8 v6 h-8 z" fill="${color1}"/>
                <path d="M5 6 h6 v4 h-6 z" fill="#FFFFFF" fill-opacity="0.3"/>
                <path d="M4 12 h8 v2 h-8 z" fill="${color3}"/>
                <text x="8" y="9" font-family="monospace" font-size="6" font-weight="bold" fill="${color3}" text-anchor="middle" dominant-baseline="central">${rank}</text>
            </svg>`;
        }

        function getRankDisplayHtml(rank) {
            if (rank === null) return '—';
            if (rank === 'INVALID') return `<span class="zero-score-glow">INVALID</span>`;
            return `${rank}`;
        }

        function updateTableDOM(tableId, sortedItems) {
            const tableBody = document.getElementById(tableId);
            if (!tableBody) return;

            // We need to keep the header row first
            const headerRow = tableBody.querySelector('.header-row');

            // Collect all rows into a map for quick lookup
            const rows = Array.from(tableBody.querySelectorAll('.benchmark-row.unified-row'));
            const rowMap = new Map();
            rows.forEach(r => {
                const name = r.getAttribute('data-model-name');
                if (name) rowMap.set(name, r);
            });

            // Re-append header just to be safe it's at the top
            tableBody.innerHTML = '';
            if (headerRow) tableBody.appendChild(headerRow);

            sortedItems.forEach(item => {
                const row = rowMap.get(item.name);
                if (row) {
                    // Update rank UI
                    const rankEl = row.querySelector('.rank');
                    if (rankEl) {
                        rankEl.innerHTML = getRankDisplayHtml(item.rank);
                    }
                    if (item.isUnknownResilience) {
                        row.classList.add('unknown-resilience');
                    } else {
                        row.classList.remove('unknown-resilience');
                    }
                    tableBody.appendChild(row);
                }
            });
        }

        // Setup Event Listeners
        const visualDropdown = document.getElementById('visual-ranking-method');
        const visualTooltip = document.getElementById('visual-tooltip-text');

        if (visualDropdown) {
            visualDropdown.addEventListener('change', (e) => {
                const method = e.target.value;
                if (visualTooltip) visualTooltip.textContent = tooltips[method];

                const sorted = sortAndRank(unifiedRawList, ['lvl1', 'lvl2', 'lvl3', 'lvl4', 'lvl5'], method);
                updateTableDOM('visual-table-body', sorted);
            });
        }

                const chessDropdown = document.getElementById('chess-ranking-method');
        const chessTooltip = document.getElementById('chess-tooltip-text');

        if (chessDropdown) {
            chessDropdown.addEventListener('change', (e) => {
                const method = e.target.value;
                if (chessTooltip) chessTooltip.textContent = tooltips[method];

                const sorted = sortAndRank(chessRawList, ['mouse', 'spider', 'wolf', 'hawk', 'python', 'hydra'], method);
                updateTableDOM('chess-table-body', sorted);
            });
        }

        const dataDropdown = document.getElementById('data-ranking-method');
        const dataTooltip = document.getElementById('data-tooltip-text');

        if (dataDropdown) {
            dataDropdown.addEventListener('change', (e) => {
                const method = e.target.value;
                if (dataTooltip) dataTooltip.textContent = tooltips[method];

                const sorted = sortAndRank(dataRawList, ['worm', 'koala', 'crow', 'octopus'], method);
                updateTableDOM('data-table-body', sorted);
            });
        }

        function sortAndRank(rawList, keys, method) {
            let list = rawList.map(item => ({ ...item }));

            // Official mode consumes immutable server-generated standings; it never
            // reimplements Progressive Level Weighting in the browser.
            if (method === 'canonical') {
                return list
                    .sort((a, b) => (a.canonicalRank === null) - (b.canonicalRank === null) || (a.canonicalRank ?? 0) - (b.canonicalRank ?? 0) || a.name.localeCompare(b.name))
                    .map(item => ({ ...item, rank: item.canonicalRank, _sortValue: item.canonicalScore }));
            }

            let globalHardestKey = keys[0]; // Default to the first level
            for (let i = keys.length - 1; i >= 0; i--) {
                const key = keys[i];
                let maxScore = -Infinity;
                let hasValidData = false;

                for (const item of list) {
                    const val = item[key];
                    if (val !== 'UNAVAILABLE' && val !== undefined) {
                        hasValidData = true;
                        const numVal = val === 'INVALID' ? 0 : (typeof val === 'number' ? val : 0);
                        if (numVal > maxScore) {
                            maxScore = numVal;
                        }
                    }
                }

                if (hasValidData && maxScore > 0) {
                    globalHardestKey = key;
                    break;
                }
            }

            list.forEach(item => {
                const rawVals = keys.map(k => {
                    let v = item[k];
                    if (v === 'INVALID') return { val: 0, isAttempted: true };
                    if (v === 'UNAVAILABLE') return { val: 0, isAttempted: false };
                    if (typeof v === 'number') return { val: v, isAttempted: true };
                    return { val: 0, isAttempted: false };
                });
                item.isUnknownResilience = false; // Reset state flag on every re-render
                                item._sortValue = calculateScores(item, keys, method, globalHardestKey);
                item.isUnknownResilience = item._sortValue === 'UNKNOWN';
            });

            let sorted = list.sort((a, b) => {
                if (method === 'baseline') {
                    for (const key of keys) {
                        const valA = a[key];
                        const valB = b[key];
                        const numA = (valA === 'INVALID') ? 0 : (typeof valA === 'number' ? valA : 0);
                        const numB = (valB === 'INVALID') ? 0 : (typeof valB === 'number' ? valB : 0);
                        if (numB !== numA) return numB - numA;
                    }
                    return 0;
                } else if (method === 'resilience') {
                    if (a._sortValue === 'UNKNOWN' && b._sortValue === 'UNKNOWN') return 0;
                    if (a._sortValue === 'UNKNOWN') return 1;
                    if (b._sortValue === 'UNKNOWN') return -1;
                    return b._sortValue - a._sortValue;
                } else {
                    return b._sortValue - a._sortValue;
                }
            });

            // Exploratory modes may change presentation order, but official rank is
            // immutable server metadata. In particular, provisional rows stay unranked.
            return sorted.map(item => ({ ...item, rank: item.canonicalRank }));
        }

    }

    document.addEventListener('DOMContentLoaded', init);
