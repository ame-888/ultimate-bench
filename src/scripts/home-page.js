const configElement = document.getElementById('home-page-config');

if (!(configElement instanceof HTMLScriptElement)) {
    throw new Error('Home page configuration is missing.');
}

const { TIME_OFFSET, unifiedRawList, dataRawList, chessRawList, canonicalLeaders } = JSON.parse(configElement.textContent || '{}');

function init() {
        const visualWrapper = document.getElementById('visual-benchmark-wrapper');
        const dataWrapper = document.getElementById('data-benchmark-wrapper');
        const chessWrapper = document.getElementById('chess-benchmark-wrapper');

        const homeWrapper = document.getElementById('home-wrapper');

        const modalOverlay = document.getElementById('benchmark-modal');
        const modalBody = document.getElementById('benchmark-modal-body');
        const modalCloseBtn = document.getElementById('benchmark-modal-close');
        const achModalOverlay = document.getElementById('achievements-modal');
        const achModalCloseBtn = document.getElementById('achievements-modal-close');
        const achBtn = document.getElementById('achievements-btn');

        if (achBtn && achModalOverlay && achModalCloseBtn) {
            achBtn.addEventListener('click', () => {
                // Populate data
                const firstSota = canonicalLeaders?.overall || 'None';
                const firstVisual = canonicalLeaders?.visual || 'None';
                const firstData = canonicalLeaders?.data || 'None';
                const firstChess = canonicalLeaders?.chess || 'None';

                document.getElementById('ach-sota').textContent = firstSota;
                document.getElementById('ach-visual').textContent = firstVisual;
                document.getElementById('ach-data').textContent = firstData;
                document.getElementById('ach-chess').textContent = firstChess;

                // Calculate "A for Effort" (lowest positive average score) and "Glitch in the Matrix" (has INVALID/PENDING) dynamically
                let effortModel = 'None';
                let effortScore = Infinity;
                let glitchModel = 'None';

                // Scrape the tables
                const visualRows = Array.from(document.querySelectorAll('#visual-table-body .benchmark-row'));
                const dataRows = Array.from(document.querySelectorAll('#data-table-body .benchmark-row'));
                const chessRows = Array.from(document.querySelectorAll('#chess-table-body .benchmark-row'));

                const allRows = [...visualRows, ...dataRows, ...chessRows];
                const modelAverages = {};

                for (const row of allRows) {
                     const nameEl = row.querySelector('.model-name');
                     if (!nameEl) continue;
                     const name = nameEl.textContent.trim();
                     if (!modelAverages[name]) modelAverages[name] = [];

                     // check for glitch
                     const text = row.textContent;
                     if (text.includes('INVALID') || text.includes('PENDING')) {
                          glitchModel = name;
                     }

                     // try to get avg score by scraping cells
                     const scoreCells = Array.from(row.querySelectorAll('.score-cell')).filter(c => !c.classList.contains('rank-cell'));
                     const numericScores = scoreCells.map(c => parseInt(c.textContent.replace('%', ''))).filter(n => !isNaN(n));
                     if (numericScores.length > 0) {
                          const sum = numericScores.reduce((a,b)=>a+b,0);
                          const avg = sum / numericScores.length;
                          if (avg > 0) {
                               modelAverages[name].push(avg);
                          }
                     }
                }

                for (const model in modelAverages) {
                    const scores = modelAverages[model];
                    if (scores.length > 0) {
                        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                        if (avg > 0 && avg < effortScore) {
                            effortScore = avg;
                            effortModel = model;
                        }
                    }
                }

                document.getElementById('ach-effort').textContent = effortModel;
                document.getElementById('ach-glitch').textContent = glitchModel;

                // Compare category-level averages for the cross-discipline honors.
                const profiles = {};
                [visualRows, dataRows, chessRows].forEach((rows, categoryIndex) => {
                    rows.forEach(row => {
                        const name = row.querySelector('.model-name')?.textContent.trim();
                        if (!name) return;
                        const values = Array.from(row.querySelectorAll('.score-cell:not(.rank-cell)'))
                            .map(cell => Number.parseFloat(cell.textContent.replace('%', '')))
                            .filter(Number.isFinite);
                        if (!values.length) return;
                        profiles[name] ||= { categories: [], trials: 0 };
                        profiles[name].categories[categoryIndex] = values.reduce((sum, value) => sum + value, 0) / values.length;
                        profiles[name].trials += values.length;
                    });
                });

                const entries = Object.entries(profiles);
                const balanced = entries
                    .filter(([, profile]) => profile.categories.filter(Number.isFinite).length === 3)
                    .sort(([, a], [, b]) => (b.categories.reduce((x, y) => x + y, 0) - a.categories.reduce((x, y) => x + y, 0)))[0]?.[0] || 'None';
                const categorySpread = profile => {
                    const scores = profile.categories.filter(Number.isFinite);
                    return Math.max(...scores) - Math.min(...scores);
                };
                const specialist = entries
                    .filter(([, profile]) => profile.categories.filter(Number.isFinite).length > 1)
                    .sort(([, a], [, b]) => categorySpread(b) - categorySpread(a))[0]?.[0] || 'None';
                const depth = [...entries].sort(([, a], [, b]) => b.trials - a.trials)[0]?.[0] || 'None';
                const globalNames = Array.from(document.querySelectorAll('.ultimate-row-hover .model-name')).map(el => el.textContent.trim());

                document.getElementById('ach-runner').textContent = globalNames[1] || 'None';
                document.getElementById('ach-balanced').textContent = firstSota;
                document.getElementById('ach-specialist').textContent = specialist;
                document.getElementById('ach-depth').textContent = depth;

                achModalOverlay.classList.add('active');
                achModalCloseBtn.focus();
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
            });

            const closeAchModal = () => {
                achModalOverlay.classList.remove('active');
                achBtn.focus();
                document.body.style.overflow = '';
            };

            achModalCloseBtn.addEventListener('click', closeAchModal);

            achModalOverlay.addEventListener('click', (e) => {
                if (e.target === achModalOverlay) {
                    closeAchModal();
                }
            });
        }


        let modalReturnFocus = null;
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
                modalOverlay.classList.add('active');
                document.querySelector(`.expand-btn[data-target="${mode}"]`)?.setAttribute('aria-expanded', 'true');
                modalCloseBtn?.focus();
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
            }
        }

        function closeModal() {
            if (!modalOverlay || !modalBody) return;

            modalOverlay.classList.remove('active');
            document.querySelectorAll('.expand-btn').forEach(button => button.setAttribute('aria-expanded', 'false'));
            if (modalReturnFocus instanceof HTMLElement) modalReturnFocus.focus();
            document.body.style.overflow = ''; // Restore background scrolling

            const handleTransitionEnd = (e) => {
                // Ignore events bubbling from children, only react to modalOverlay's transition
                if (e.target !== modalOverlay) return;

                if (modalBody.firstElementChild) {
                    const child = modalBody.firstElementChild;
                    child.classList.add('hidden');
                    document.getElementById('home-wrapper').parentNode.appendChild(child);
                }
                modalOverlay.removeEventListener('transitionend', handleTransitionEnd);
            };

            // Add listener and ensure we don't pile up listeners if called multiple times fast
            modalOverlay.addEventListener('transitionend', handleTransitionEnd);
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
            const activeDialog = [modalOverlay, achModalOverlay].find(dialog => dialog?.classList.contains('active'));
            if (event.key === 'Escape') {
                if (modalOverlay?.classList.contains('active')) closeModal();
                if (achModalOverlay?.classList.contains('active')) achModalCloseBtn?.click();
            }
            if (event.key === 'Tab' && activeDialog) {
                const focusable = [...activeDialog.querySelectorAll('button, a[href], select, input, [tabindex]:not([tabindex="-1"])')]
                    .filter(element => !element.hasAttribute('disabled'));
                if (!focusable.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
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
        document.querySelectorAll('.progress-toggle').forEach(button => button.addEventListener('click', () => {
            const isVisible = button.getAttribute('aria-pressed') === 'true';
            button.setAttribute('aria-pressed', String(!isVisible));
            document.querySelector(`.progress-series[data-series="${button.dataset.progressSeries}"]`)?.classList.toggle('is-hidden', isVisible);
        }));

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
            if (event.key === '/' && !isEditing) {
                event.preventDefault();
                modelFilterInput?.focus();
            }
            if (event.key === 'Escape' && document.activeElement === modelFilterInput && modelFilterInput?.value) {
                modelFilterInput.value = '';
                applyModelFilters();
            }
        });


        // --- Milestone Details Logic ---
        const milestoneData = {
            '100% MARKER': {
                score: '100%',
                color: '#FBBF24',
                desc: 'The journey’s luminous horizon: a final marker for imagining what the full scale might hold.'
            },
            'EVENT HORIZON': {
                score: '80%',
                color: '#3B82F6',
                desc: 'The point of no return. AI systems exhibit profound understanding and begin to recursively self-improve.'
            },
            'SUPERNOVA': {
                score: '60%',
                color: '#F97316',
                desc: 'Capabilities radiate outward, bringing ambitious, multi-step challenges within reach.'
            },
            'STAR': {
                score: '40%',
                color: '#EF4444',
                desc: 'The fusion of knowledge. Reliable, powerful models shine brightly, solving everyday challenges autonomously.'
            },
            'NEBULA': {
                score: '20%',
                color: '#A855F7',
                desc: 'Signals gather into a promising foundation, opening the way to more capable systems.'
            },
            'INCEPTION': {
                score: '0%',
                color: '#9CA3AF',
                desc: 'The beginning of the journey. Early systems lay the groundwork for what is to come.'
            }
        };

        const panel = document.getElementById('milestone-details-panel');
        const panelTitle = document.getElementById('milestone-title');
        const panelScore = document.getElementById('milestone-score');
        const panelDesc = document.getElementById('milestone-desc');
        const panelIcon = document.getElementById('milestone-icon');

        document.querySelectorAll('.sota-node-interactive').forEach(node => {
            node.addEventListener('click', (e) => {
                const title = node.dataset.milestone;
                const data = milestoneData[title];

                if (data && panel) {
                    document.querySelectorAll('.sota-node-interactive').forEach(item => item.classList.remove('selected'));
                    node.classList.add('selected');

                    // Update content
                    panelTitle.textContent = title;
                    panelTitle.style.color = data.color;
                    panelScore.textContent = data.score;
                    panelScore.style.color = data.color;
                    panelDesc.textContent = data.desc;
                    panelIcon.style.boxShadow = `0 0 15px ${data.color}`;
                    panelIcon.style.borderColor = data.color;
                    panelIcon.style.color = data.color;
                    panel.style.borderColor = `${data.color}55`;

                    // Show panel
                    panel.style.visibility = 'visible';
                    panel.style.opacity = '1';
                    panel.style.transform = 'translateY(0)';

                    // Ripple effect
                    const existingRipple = node.querySelector('.ripple-effect');
                    if (existingRipple) existingRipple.remove();

                    const ripple = document.createElement('div');
                    ripple.className = 'ripple-effect';
                    ripple.style.boxShadow = `0 0 0 0 ${data.color}80`;
                    node.appendChild(ripple);
                }
            });

            node.addEventListener('keydown', (event) => {
                if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
                event.preventDefault();
                const nodes = [...document.querySelectorAll('.sota-node-interactive')];
                const direction = event.key === 'ArrowDown' ? 1 : -1;
                nodes[(nodes.indexOf(node) + direction + nodes.length) % nodes.length].focus();
            });
        });

        document.querySelector('.sota-node-interactive.current')?.classList.add('selected');

        // Expand buttons
        document.querySelectorAll('.expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.getAttribute('data-target');
                openModal(target);
            });
        });

        // Keep arena summaries compact without introducing nested scrolling.
        document.querySelectorAll('[data-arena-card]').forEach(card => {
            const toggle = card.querySelector('.arena-toggle');
            if (!toggle) return;

            const rowsAfterPreview = [...card.querySelectorAll('tbody tr')].slice(10);
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

        // --- Dynamic "NEW" Badge Logic ---
        const timeOffset = TIME_OFFSET;
        const simNow = new Date(new Date().getTime() + timeOffset);

        const relativeReleaseTime = (dateStr) => {
            const release = new Date(`${dateStr}T00:00:00Z`);
            const days = Math.max(0, Math.floor((simNow.getTime() - release.getTime()) / 86400000));
            if (days === 0) return 'today';
            if (days === 1) return '1 day ago';
            if (days < 30) return `${days} days ago`;
            const months = Math.floor(days / 30.4375);
            if (months === 1) return '1 month ago';
            if (months < 12) return `${months} months ago`;
            const years = Math.floor(months / 12);
            return `${years} ${years === 1 ? 'year' : 'years'} ago`;
        };

        document.querySelectorAll('.ultimate-model .model-name[data-release-date]').forEach(el => {
            const relative = el.parentElement?.querySelector('.release-time-ago');
            if (relative) relative.textContent = relativeReleaseTime(el.getAttribute('data-release-date'));
        });

        document.querySelectorAll('.model-name[data-release-date]').forEach(el => {
            const dateStr = el.getAttribute('data-release-date');
            if (!dateStr) return;

            const release = new Date(dateStr);
            // Reset hours
            release.setHours(0,0,0,0);
            const today = new Date(simNow);
            today.setHours(0,0,0,0);

            const diffTime = today.getTime() - release.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Should be new if within 30 days
            const isNew = diffDays >= -1 && diffDays <= 30;

            const nameLine = el.closest('.model-name-line');
            if (!nameLine) return;

            let badge = nameLine.querySelector('.new-badge');
            if (isNew) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'new-badge';
                    badge.textContent = 'NEW';
                    nameLine.appendChild(badge);
                }
            } else {
                if (badge) badge.remove();
            }
        });

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
            'resilience': 'Calculates the retention percentage between the hardest level attempted and Level 1. Highlights models that don\'t suffer from "Contextual Collapse".'
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
