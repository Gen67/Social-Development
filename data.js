/**
 * data.js
 * Constants and sample data shared across the app.
 *
 * Everything lives on a single global namespace (window.SocialHub) so the
 * project works by simply opening main.html, with no bundler or local server.
 */
window.SocialHub = window.SocialHub || {};

/**
 * Supported platforms.
 * `limit` is the maximum caption/description length for that platform.
 */
SocialHub.PLATFORMS = {
    tiktok:    { name: "TikTok",      color: "var(--tiktok)",    limit: 2200 },
    youtube:   { name: "YouTube",     color: "var(--youtube)",   limit: 5000 },
    x:         { name: "X / Twitter", color: "var(--x)",         limit: 280  },
    instagram: { name: "Instagram",   color: "var(--instagram)", limit: 2200 }
};

/** Navigation tabs: [view id, label] */
SocialHub.TABS = [
    ["compose",   "Create post"],
    ["analytics", "Analytics"],
    ["queue",     "Queue"],
    ["accounts",  "Accounts"]
];

/**
 * SAMPLE DATA ONLY.
 * Replace with real data from your backend once platform APIs are connected.
 * `daysAgo` = how many days ago the video was posted (0 = today).
 */
SocialHub.SAMPLE_POSTS = [
    { title: "Day in my life as an editor",  platform: "tiktok",    views: 48200, likes: 5120, comments: 312, shares: 640,  daysAgo: 0 },
    { title: "CapCut speed ramp tutorial",   platform: "youtube",   views: 12900, likes: 980,  comments: 87,  shares: 120,  daysAgo: 1 },
    { title: "Before and after color grade", platform: "instagram", views: 21400, likes: 2300, comments: 145, shares: 310,  daysAgo: 2 },
    { title: "3 hooks that stop the scroll", platform: "tiktok",    views: 73500, likes: 8800, comments: 520, shares: 1900, daysAgo: 3 },
    { title: "My editing setup",             platform: "x",         views: 6100,  likes: 420,  comments: 33,  shares: 58,   daysAgo: 4 },
    { title: "UGC ad breakdown",             platform: "instagram", views: 15800, likes: 1450, comments: 92,  shares: 205,  daysAgo: 5 },
    { title: "Talking-head edit tips",       platform: "youtube",   views: 9700,  likes: 760,  comments: 64,  shares: 90,   daysAgo: 6 }
];