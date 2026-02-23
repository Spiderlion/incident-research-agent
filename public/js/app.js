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
    let currentChannel = 'all'; // 'all' | 'thebigbrandshow_' | 'the_dailydecode'
    let currentProfile = null;

    // Channel UI Elements
    const channelTabs = document.querySelectorAll('.channel-tab');
    const channelModeTag = document.getElementById('channel-mode-tag');
    const channelTopicsChips = document.getElementById('channel-topics-chips');

    const profileCard = document.getElementById('channel-profile-card');
    const profileName = document.getElementById('profile-name');
    const profileToneBadge = document.getElementById('profile-tone-badge');
    const profileTopicsContainer = document.getElementById('profile-topics-container');
    const profileFormatStyle = document.getElementById('profile-format-style');
    const profileAudience = document.getElementById('profile-audience');
    const profileTimestamp = document.getElementById('profile-timestamp');
    const refreshProfileBtn = document.querySelector('.refresh-profile-btn');

    // Search Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // If in channel mode, don't strictly require a query, it auto-generates
        const query = input.value.trim();
        if (currentChannel === 'all' && !query) return;

        startLoading();

        try {
            let response, data;

            if (currentChannel === 'all') {
                response = await fetch('/api/research', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                if (!response.ok) throw new Error('API Error');
                data = await response.json();
            } else {
                // Channel Intelligence Mode Search
                statusText.innerText = `🧠 Activating Channel DNA for @${currentChannel}...`;
                // If the user typed a specific query, we could append it, but the task says to auto-trigger based on DNA
                response = await fetch(`/api/channel/search?channel=${currentChannel}`);
                if (!response.ok) throw new Error('Channel API Error');
                data = await response.json();
            }

            allResults = data.results || [];

            // Render structured AI Summary
            if (data.summary) {
                if (currentChannel === 'all') {
                    // Standard Summary
                    aiSummary.classList.remove('channel-brief-mode');
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

                    document.getElementById('summary-status-box').classList.remove('hidden');
                    document.getElementById('summary-sources-box').classList.remove('hidden');

                } else {
                    // Channel Intelligence Brief
                    aiSummary.classList.add('channel-brief-mode');
                    summaryHeadline.innerText = data.summary.headline;

                    document.getElementById('summary-status-box').classList.add('hidden');
                    document.getElementById('summary-sources-box').classList.add('hidden');

                    let briefHtml = `
                        <div style="margin-bottom:1rem;"><strong>Why this fits:</strong> ${data.summary.why_this_fits}</div>
                        <div class="suggested-angle-box"><strong>💡 Suggested Angle:</strong> ${data.summary.trending_angle}</div>
                        
                        <h4 style="margin-top:2rem; color:var(--primary); margin-bottom:1rem;"><i class="fa-solid fa-clapperboard"></i> Reel Structure Brief</h4>
                        <div style="margin-bottom:1rem;"><strong>Hook:</strong> <em>"${data.summary.reel_brief?.hook || ''}"</em></div>
                    `;

                    if (data.summary.reel_brief?.structure) {
                        briefHtml += `<div class="reel-stepper">`;
                        data.summary.reel_brief.structure.forEach(step => {
                            briefHtml += `
                                <div class="reel-step">
                                    <div class="reel-step-header">
                                        <div class="reel-step-title">${step.section}</div>
                                        <div class="reel-step-dur">${step.duration_seconds}s</div>
                                    </div>
                                    <div class="reel-step-content">${step.content}</div>
                                </div>
                            `;
                        });
                        briefHtml += `</div>`;
                    }

                    briefHtml += `
                        <div style="margin-top:1rem; margin-bottom:0.5rem;"><strong>Key Facts to Include:</strong></div>
                        <ul style="padding-left:1.5rem; color:var(--text-muted); font-size:0.9rem; margin-bottom:1rem;">
                            ${(data.summary.reel_brief?.key_facts || []).map(f => `<li>${f}</li>`).join('')}
                        </ul>
                        <div style="margin-bottom:0.5rem;"><strong>Call to Action:</strong> <em>"${data.summary.reel_brief?.cta || ''}"</em></div>
                        <div style="font-size:0.8rem; color:var(--primary); margin-bottom:1rem;">${(data.summary.reel_brief?.hashtags || []).join(' ')}</div>
                        <div style="font-size:0.85rem; color:var(--text-muted);"><strong>Music Mood:</strong> ${data.summary.reel_brief?.music_mood || 'Neutral'}</div>
                    `;

                    if (data.summary.other_trending_topics && data.summary.other_trending_topics.length > 0) {
                        briefHtml += `
                            <h4 style="margin-top:2rem; margin-bottom:1rem; border-top:1px solid var(--border); padding-top:1.5rem;"><i class="fa-solid fa-fire"></i> Other Trending Topics for @${currentChannel}</h4>
                            <div class="runner-up-topics">
                        `;
                        data.summary.other_trending_topics.forEach(topic => {
                            briefHtml += `
                                <div class="runner-up-card">
                                    <h4>${topic.topic}</h4>
                                    <p>${topic.why_relevant}</p>
                                    <div class="quick-angle"><i class="fa-solid fa-bolt"></i> ${topic.quick_angle}</div>
                                </div>
                            `;
                        });
                        briefHtml += `</div>`;
                    }

                    summaryWhatHappened.innerHTML = briefHtml;
                }
            } else {
                summaryHeadline.innerText = "Summary Unavailable";
                summaryWhatHappened.innerHTML = "The AI summary generation failed or returned empty data.";
            }

            if (currentChannel === 'all') {
                ambientBg.style.background = 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.08) 0%, transparent 70%)';
            } else {
                ambientBg.style.background = 'radial-gradient(circle at top center, rgba(59, 130, 246, 0.15) 0%, var(--bg-color) 70%)';
            }

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

            let relevanceHtml = '';
            let angleHtml = '';
            if (currentChannel !== 'all' && item.relevance_score) {
                relevanceHtml = `<div class="relevance-badge">${item.relevance_score}/10 Match</div>`;
                angleHtml = `
                    <div class="suggested-angle-box" style="margin-top: 0.5rem; margin-bottom: 1rem;">
                        <strong>💡 Angle for @${currentChannel}:</strong> ${item.suggested_angle || item.relevance_reason}
                    </div>
                `;
            }

            card.innerHTML = `
        ${mediaHtml}
        ${relevanceHtml}
        <div class="card-content">
          <span class="card-badge">${item.platform.replace('google_images', 'images')}</span>
          <h3 class="card-title"><a href="${item.source_link}" target="_blank">${item.title}</a></h3>
          <p class="card-desc">${item.description || ''}</p>
          ${angleHtml}
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

    // Channel Tab Logic
    channelTabs.forEach(tab => {
        tab.addEventListener('click', async (e) => {
            const selectedChannel = e.currentTarget.getAttribute('data-channel');
            if (currentChannel === selectedChannel) return; // Ignore if already selected

            channelTabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentChannel = selectedChannel;

            if (currentChannel === 'all') {
                document.body.classList.remove('channel-mode-active');
                input.placeholder = "Ask anything about an incident...";
                channelModeTag.classList.add('hidden');
                channelTopicsChips.classList.add('hidden');
                profileCard.classList.add('hidden');
                profileCard.classList.add('collapsed');
                aiSummary.classList.add('hidden'); // Hide summary until next search
                resultsContainer.innerHTML = `<div id="welcome-state"><i class="fa-solid fa-globe"></i><h2>Ready to research.</h2><p>Enter a query above to orchestrate a parallel search across Google, News, and YouTube.</p></div>`;
            } else {
                document.body.classList.add('channel-mode-active');
                input.placeholder = `Search trends for @${currentChannel} (or leave blank to auto-detect)...`;

                // Hide old results
                resultsContainer.innerHTML = '';
                aiSummary.classList.add('hidden');

                await fetchAndDisplayProfile(currentChannel, false);
            }
        });
    });

    async function fetchAndDisplayProfile(channel, forceRefresh = false) {
        profileCard.classList.remove('hidden');
        profileCard.classList.add('collapsed'); // start collapsed while loading

        channelModeTag.classList.remove('hidden');
        channelModeTag.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Instagram Profile DNA...`;
        channelTopicsChips.classList.add('hidden');

        if (forceRefresh) {
            refreshProfileBtn.classList.add('spinning');
        }

        try {
            const res = await fetch(`/api/channel/profile?channel=${channel}${forceRefresh ? '&refresh=true' : ''}`);
            if (!res.ok) throw new Error('Profile fetch failed');
            const profile = await res.json();
            currentProfile = profile;

            // Populate Card
            profileName.innerText = `@${profile.channel}`;
            profileToneBadge.innerText = profile.content_tone;
            profileFormatStyle.innerText = profile.format_style;
            profileAudience.innerText = `Target Audience: ${profile.target_audience}`;

            const date = new Date(profile.analysed_at);
            profileTimestamp.innerText = isNaN(date.getTime()) ? 'Just now' : date.toLocaleString();

            // Populate Topics
            profileTopicsContainer.innerHTML = '';
            channelTopicsChips.innerHTML = '';
            (profile.primary_topics || []).slice(0, 5).forEach(topic => {
                profileTopicsContainer.innerHTML += `<span class="topic-chip">${topic}</span>`;
                channelTopicsChips.innerHTML += `<span class="topic-chip">${topic}</span>`;
            });

            // Show UI
            channelModeTag.innerHTML = `Showing results filtered for <strong>@${channel}</strong> content DNA`;
            channelTopicsChips.classList.remove('hidden');
            profileCard.classList.remove('collapsed');

        } catch (e) {
            console.error(e);
            channelModeTag.innerHTML = `<span style="color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Error loading channel profile DNA.</span>`;
        } finally {
            refreshProfileBtn.classList.remove('spinning');
        }
    }

    refreshProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentChannel !== 'all') {
            fetchAndDisplayProfile(currentChannel, true);
        }
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
            const response = await fetch(`/api/trending?period=${period}&channel=${currentChannel}`);
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
