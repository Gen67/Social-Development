/**
 * analytics.js
 * Builds the Analytics view (KPIs, 7-day chart, top videos table).
 *
 * Public API:  SocialHub.analytics.render(platformFilter) -> HTML string
 * The module is stateless: main.js owns the current filter and re-renders.
 */
(function (SocialHub) {
    "use strict";

    const { PLATFORMS, SAMPLE_POSTS } = SocialHub;
    const { formatNumber, escapeHtml, platformDot } = SocialHub.utils;

    const DAYS_IN_CHART = 7;


    /* ----------------------------------------------------------------------
       Data helpers
       ---------------------------------------------------------------------- */

    /** Returns the posts for one platform, or all posts when filter is "all". */
    function filterPosts(filter) {
        return filter === "all"
            ? SAMPLE_POSTS
            : SAMPLE_POSTS.filter((post) => post.platform === filter);
    }

    /** Adds up one numeric field (e.g. "views") across a list of posts. */
    function sumBy(posts, field) {
        return posts.reduce((total, post) => total + post[field], 0);
    }

    /** Computes the headline numbers shown in the KPI cards. */
    function summarize(posts) {
        const views = sumBy(posts, "views");
        const interactions = sumBy(posts, "likes") + sumBy(posts, "comments") + sumBy(posts, "shares");

        return {
            views,
            likes: sumBy(posts, "likes"),
            comments: sumBy(posts, "comments"),
            // Engagement rate = (likes + comments + shares) / views
            engagementRate: views ? ((interactions / views) * 100).toFixed(1) : "0.0"
        };
    }

    /** Returns total views for each of the last N days, oldest day first. */
    function viewsPerDay(posts) {
        const result = [];

        for (let daysAgo = DAYS_IN_CHART - 1; daysAgo >= 0; daysAgo--) {
            const dayPosts = posts.filter((post) => post.daysAgo === daysAgo);
            result.push({ daysAgo, views: sumBy(dayPosts, "views") });
        }

        return result;
    }


    /* ----------------------------------------------------------------------
       Template helpers (each returns an HTML string)
       ---------------------------------------------------------------------- */

    function renderFilterChips(activeFilter) {
        const keys = ["all", ...Object.keys(PLATFORMS)];

        const chips = keys.map((key) => {
            const label = key === "all" ? "All" : PLATFORMS[key].name;
            const activeClass = key === activeFilter ? "is-active" : "";

            return `<button class="chip ${activeClass}"
                            data-action="filter-analytics"
                            data-value="${key}">${label}</button>`;
        });

        return `<div class="row" style="margin-bottom: 14px">${chips.join("")}</div>`;
    }

    function renderKpis(summary) {
        const items = [
            ["Total views",      formatNumber(summary.views)],
            ["Likes",            formatNumber(summary.likes)],
            ["Comments",         formatNumber(summary.comments)],
            ["Engagement rate",  summary.engagementRate + "%"]
        ];

        const cards = items.map(([label, value]) => `
            <div class="card">
                <span class="muted">${label}</span>
                <span class="kpi__value">${value}</span>
            </div>`);

        return `<div class="kpi-grid">${cards.join("")}</div>`;
    }

    function renderChart(days) {
        // Scale every bar relative to the tallest one (avoid dividing by 0)
        const maxViews = Math.max(...days.map((day) => day.views), 1);

        const columns = days.map((day) => {
            const heightPercent = (day.views / maxViews) * 100;
            const label = day.daysAgo === 0 ? "Today" : `${day.daysAgo}d ago`;

            return `
                <div class="bar-chart__col">
                    <small>${formatNumber(day.views)}</small>
                    <span class="bar-chart__bar" style="height: ${heightPercent}%"></span>
                    <small>${label}</small>
                </div>`;
        });

        return `
            <div class="card">
                <h2>Views, last ${DAYS_IN_CHART} days</h2>
                <div class="bar-chart">${columns.join("")}</div>
            </div>`;
    }

    function renderTopVideos(posts) {
        // Copy before sorting so the original data is never mutated
        const sorted = [...posts].sort((a, b) => b.views - a.views);

        const rows = sorted.map((post) => `
            <tr>
                <td>${escapeHtml(post.title)}</td>
                <td>${platformDot(post.platform)} ${PLATFORMS[post.platform].name}</td>
                <td>${formatNumber(post.views)}</td>
                <td>${formatNumber(post.likes)}</td>
                <td>${post.comments}</td>
                <td>${post.shares}</td>
            </tr>`);

        return `
            <div class="card">
                <h2>Top videos</h2>
                <div class="table-wrap">
                    <table class="data-table">
                        <tr>
                            <th>Video</th><th>Platform</th><th>Views</th>
                            <th>Likes</th><th>Comments</th><th>Shares</th>
                        </tr>
                        ${rows.join("")}
                    </table>
                </div>
            </div>`;
    }


    /* ----------------------------------------------------------------------
       Public API
       ---------------------------------------------------------------------- */

    /**
     * Renders the whole Analytics view.
     * @param {string} filter - "all" or a platform key
     * @returns {string} HTML string
     */
    function render(filter) {
        const posts = filterPosts(filter);

        return `
            <div class="banner">
                Showing sample data. Real numbers appear once your accounts are
                connected through a backend (see the Accounts tab).
            </div>
            ${renderFilterChips(filter)}
            ${renderKpis(summarize(posts))}
            ${renderChart(viewsPerDay(posts))}
            ${renderTopVideos(posts)}`;
    }

    SocialHub.analytics = { render };

})(window.SocialHub = window.SocialHub || {});