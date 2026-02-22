document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-query');
    const resultsContainer = document.getElementById('results-container');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    const statusContainer = document.getElementById('loading-status');
    const statusText = document.getElementById('status-text');

    const layoutToggle = document.getElementById('layout-toggle');
    const tabsContainer = document.getElementById('tabs-container');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const aiSummary = document.getElementById('ai-summary');
    const summaryHeadline = document.getElementById('summary-headline');
    const summaryWhatHappened = document.getElementById('summary-what-happened');
    const summaryStatus = document.getElementById('summary-status');
    const summarySources = document.getElementById('summary-sources');
    const summaryHeader = document.querySelector('.summary-header');

    const videoModal = document.getElementById('video-modal');
    const closeBtn = document.querySelector('.close-modal');
    const iframeContainer = document.getElementById('iframe-container');
    const ambientBg = document.getElementById('ambient-background');

    // Trending Panel Elements
    const trendingOpenBtn = document.getElementById('trending-open-btn');
    const trendingCloseBtn = document.getElementById('trending-close-btn');
    const trendingPanel = document.getElementById('trending-panel');
    const trendingBackdrop = document.getElementById('trending-backdrop');
    const trendingPeriod = document.getElementById('trending-period');
    const trendingResults = document.getElementById('trending-results');

    let allResults = [];
    let currentLayout = 'grid'; // grid | timeline
    let currentFilter = 'all';

    // Search Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = input.value.trim();
        if (!query) return;

        startLoading();

        try {
            const response = await fetch('/api/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            allResults = data.results || [];

            // Render structured AI Summary
            if (data.summary) {
                summaryHeadline.innerText = data.summary.headline;
                summaryWhatHappened.innerText = data.summary.what_happened;
                summaryStatus.innerText = data.summary.current_status;

                summarySources.innerHTML = '';
                if (data.summary.key_sources && data.summary.key_sources.length > 0) {
                    data.summary.key_sources.forEach(source => {
                        summarySources.innerHTML += `<li><a href="${source.url}" target="_blank">${source.name}</a></li>`;
                    });
                } else {
                    summarySources.innerHTML = '<li>No specific sources cited.</li>';
                }
            } else {
                summaryHeadline.innerText = "Summary Unavailable";
                summaryWhatHappened.innerText = "The AI summary generation failed or returned empty data.";
                summaryStatus.innerText = "N/A";
                summarySources.innerHTML = "";
            }

            ambientBg.style.background = 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.08) 0%, transparent 70%)'; // Shift to amber glow randomly based on content

            finishLoading();
            renderResults();

        } catch (err) {
            console.error(err);
            statusText.innerText = '❌ Error fetching results. Check terminal logs.';
            setTimeout(() => stopLoading(), 3000);
        }
    });

    // Render cards
    function renderResults() {
        resultsContainer.innerHTML = '';

        let filtered = allResults;
        if (currentFilter !== 'all') {
            filtered = allResults.filter(r => r.platform === currentFilter || r.media_type === currentFilter);
        }

        if (currentLayout === 'timeline') {
            // Sort by timestamp if available
            filtered.sort((a, b) => {
                if (!a.timestamp) return 1;
                if (!b.timestamp) return -1;
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
        }

        if (filtered.length === 0) {
            resultsContainer.innerHTML = `<div id="welcome-state"><i class="fa-solid fa-ghost"></i><h2>No results found.</h2></div>`;
            return;
        }

        filtered.forEach((item, index) => {
            const card = document.createElement('div');

            let specificClass = '';
            if (item.media_type === 'video' || item.platform === 'youtube') specificClass = 'card-video';
            else if (item.media_type === 'image') specificClass = 'card-image';
            else if (item.media_type === 'article' || item.platform === 'news') specificClass = 'card-news';

            card.className = `card ${specificClass}`;
            card.style.animationDelay = `${index * 0.05}s`;

            let mediaHtml = '';
            if (item.media_type === 'video' || item.platform === 'youtube') {
                const thumb = item.thumbnail || 'https://via.placeholder.com/640x360?text=Video';
                mediaHtml = `
          <div class="card-media video-trigger" data-url="${item.media_url}">
            <img src="${thumb}" alt="${item.title}">
            <div class="video-overlay"><i class="fa-solid fa-circle-play"></i></div>
          </div>`;
            } else if (item.media_type === 'image') {
                // High res image priority
                const thumb = item.media_url || item.thumbnail;
                mediaHtml = `
          <div class="card-media">
            <img src="${thumb}" alt="${item.title}">
          </div>`;
            } else if (item.thumbnail) {
                // News/Article thumbnail
                mediaHtml = `
          <div class="card-media">
            <img src="${item.thumbnail}" alt="${item.title}">
          </div>`;
            }

            const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recent';

            let actionHtml = '';
            if (item.media_type === 'article' || item.platform === 'news') {
                actionHtml = `<a href="${item.source_link}" target="_blank" class="trending-btn" style="margin-top: 1rem; width: 100%; justify-content: center; font-size: 0.85rem;">Read Full Article <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem;"></i></a>`;
            } else if (item.media_type === 'image') {
                actionHtml = `<a href="${item.source_link}" target="_blank" class="trending-btn" style="margin-top: 1rem; width: 100%; justify-content: center; font-size: 0.85rem;">View Source <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem;"></i></a>`;
            }

            card.innerHTML = `
        ${mediaHtml}
        <div class="card-content">
          <span class="card-badge">${item.platform.replace('google_images', 'images')}</span>
          <h3 class="card-title"><a href="${item.source_link}" target="_blank">${item.title}</a></h3>
          <p class="card-desc">${item.description || ''}</p>
          <div class="card-footer">
            <span>${item.source || 'Web Result'}</span>
            <span>${dateStr}</span>
          </div>
          ${actionHtml}
        </div>
      `;

            resultsContainer.appendChild(card);
        });

        // Attach video modal listeners
        document.querySelectorAll('.video-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                const url = e.currentTarget.getAttribute('data-url');
                openModal(url);
            });
        });
    }

    // Loading States
    let loadInterval;
    function startLoading() {
        allResults = [];
        resultsContainer.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            resultsContainer.innerHTML += '<div class="skeleton"></div>';
        }

        progressContainer.classList.remove('hidden');
        statusContainer.classList.remove('hidden');
        tabsContainer.classList.add('hidden');
        aiSummary.classList.add('hidden');

        progressBar.style.width = '0%';
        setTimeout(() => progressBar.style.width = '30%', 100);

        const messages = [
            "🔍 Searching Google...",
            "🎬 Querying YouTube...",
            "📰 Scraping news sources...",
            "⚙️ Extracting media files..."
        ];
        let step = 0;
        statusText.innerText = messages[0];

        loadInterval = setInterval(() => {
            step++;
            if (step < messages.length) {
                statusText.innerText = messages[step];
                progressBar.style.width = `${30 + (step * 20)}%`;
            }
        }, 2000);
    }

    function finishLoading() {
        clearInterval(loadInterval);
        statusText.innerText = "✅ Building your report...";
        progressBar.style.width = '100%';

        setTimeout(() => {
            stopLoading();
            tabsContainer.classList.remove('hidden');
            aiSummary.classList.remove('hidden');
        }, 800);
    }

    function stopLoading() {
        progressContainer.classList.add('hidden');
        statusContainer.classList.add('hidden');
        progressBar.style.width = '0%';
    }

    // Layout Toggle
    layoutToggle.addEventListener('click', () => {
        if (currentLayout === 'grid') {
            currentLayout = 'timeline';
            layoutToggle.innerHTML = '<i class="fa-solid fa-table-cells-large"></i> Grid View';
            layoutToggle.classList.add('active');
            resultsContainer.classList.remove('layout-grid');
            resultsContainer.classList.add('layout-timeline');
        } else {
            currentLayout = 'grid';
            layoutToggle.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> Timeline';
            layoutToggle.classList.remove('active');
            resultsContainer.classList.remove('layout-timeline');
            resultsContainer.classList.add('layout-grid');
        }
        renderResults();
    });

    // Filters
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFilter = e.currentTarget.getAttribute('data-filter');
            renderResults();
        });
    });

    // Summary Toggle
    summaryHeader.addEventListener('click', () => {
        aiSummary.classList.toggle('collapsed');
    });

    // Modal logic
    function openModal(url) {
        iframeContainer.innerHTML = '';

        if (url.includes('.mp4')) {
            iframeContainer.innerHTML = `<video controls autoplay src="${url}"></video>`;
        } else {
            iframeContainer.innerHTML = `<iframe src="${url}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        }

        videoModal.classList.remove('hidden');
    }

    function closeModal() {
        videoModal.classList.add('hidden');
        iframeContainer.innerHTML = ''; // Stop playback
    }

    closeBtn.addEventListener('click', closeModal);
    videoModal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !videoModal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // --- Trending Panel Logic ---
    async function loadTrendingNews(period) {
        trendingResults.innerHTML = '<div class="trending-placeholder"><i class="fa-solid fa-spinner fa-spin"></i> Loading trending news...</div>';

        try {
            const response = await fetch(`/api/trending?period=${period}`);
            if (!response.ok) throw new Error('Failed to fetch trending');
            const data = await response.json();

            if (data.length === 0) {
                trendingResults.innerHTML = '<div class="trending-placeholder">No trending news found for this period.</div>';
                return;
            }

            trendingResults.innerHTML = '';
            data.forEach(item => {
                const tItem = document.createElement('div');
                tItem.className = 'trending-item';

                const thumbHtml = item.thumbnail ? `<img src="${item.thumbnail}" class="trend-thumbnail" alt="Thumb">` : '';

                tItem.innerHTML = `
                    <div class="trend-rank">#${item.rank}</div>
                    <div class="trend-details">
                        <div class="trend-meta">
                            <span>${item.source}</span>
                            <span>${item.date || 'Recent'}</span>
                        </div>
                        <div class="trend-headline">${item.title}</div>
                        <div class="trend-snippet">${item.snippet || ''}</div>
                    </div>
                    ${thumbHtml}
                `;

                tItem.addEventListener('click', () => {
                    closeTrendingPanel();
                    input.value = item.title;
                    form.dispatchEvent(new Event('submit'));
                });

                trendingResults.appendChild(tItem);
            });

        } catch (e) {
            console.error(e);
            trendingResults.innerHTML = '<div class="trending-placeholder" style="color: #ef4444;">❌ Error loading trending news.</div>';
        }
    }

    function openTrendingPanel() {
        trendingPanel.classList.add('open');
        trendingBackdrop.classList.remove('hidden');
        // allow display block to apply before opacity transition
        setTimeout(() => trendingBackdrop.classList.add('open'), 10);

        // Load on first open
        if (trendingResults.innerHTML.includes('Select a period')) {
            loadTrendingNews(trendingPeriod.value);
        }
    }

    function closeTrendingPanel() {
        trendingPanel.classList.remove('open');
        trendingBackdrop.classList.remove('open');
        setTimeout(() => trendingBackdrop.classList.add('hidden'), 300);
    }

    if (trendingOpenBtn) trendingOpenBtn.addEventListener('click', openTrendingPanel);
    if (trendingCloseBtn) trendingCloseBtn.addEventListener('click', closeTrendingPanel);
    if (trendingBackdrop) trendingBackdrop.addEventListener('click', closeTrendingPanel);

    if (trendingPeriod) {
        trendingPeriod.addEventListener('change', (e) => {
            loadTrendingNews(e.target.value);
        });
    }
});
