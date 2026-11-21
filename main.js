/**
 * main.js
 * Application entry point: state, storage, views, and event handling.
 *
 * Structure of this file:
 *   1. Setup & state
 *   2. Storage (localStorage)
 *   3. Views (Compose, Queue, Accounts) + navigation
 *   4. Actions (things that change state)
 *   5. Event handling
 *   6. Init
 */
(function (SocialHub) {
    "use strict";

    const { PLATFORMS, TABS } = SocialHub;
    const { escapeHtml, platformDot } = SocialHub.utils;


    /* ======================================================================
       1. SETUP & STATE
       ====================================================================== */

    const STORAGE_KEYS = {
        queue: "socialhub_queue",
        connections: "socialhub_connections"
    };

    /** Single source of truth. Views are always rendered from this object. */
    const state = {
        activeTab: "compose",
        analyticsFilter: "all",

        // Compose form
        selectedPlatforms: new Set(["tiktok", "youtube"]),
        caption: "",
        scheduledAt: "",
        fileName: "",
        videoUrl: "",     // temporary browser URL for previewing the chosen video
        message: "",      // validation / feedback text under the form

        // Persisted data
        queue: [],
        connections: { tiktok: false, youtube: false, x: false, instagram: false }
    };

    const appEl = document.getElementById("app");
    const navEl = document.getElementById("nav");


    /* ======================================================================
       2. STORAGE
       localStorage can be unavailable (private mode, blocked), so every
       access is wrapped in try/catch and falls back to defaults.
       ====================================================================== */

    function loadFromStorage() {
        try {
            const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.queue));
            if (Array.isArray(queue)) {
                state.queue = queue;
            }

            const connections = JSON.parse(localStorage.getItem(STORAGE_KEYS.connections));
            if (connections) {
                state.connections = { ...state.connections, ...connections };
            }
        } catch (error) {
            console.warn("Could not read saved data:", error);
        }
    }

    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(state.queue));
            localStorage.setItem(STORAGE_KEYS.connections, JSON.stringify(state.connections));
        } catch (error) {
            console.warn("Could not save data:", error);
        }
    }


    /* ======================================================================
       3. VIEWS
       Each view returns an HTML string built from `state`.
       ====================================================================== */

    /* ---- Compose ---------------------------------------------------------- */

    /** Character counters, one per selected platform. */
    function renderCounters() {
        if (state.selectedPlatforms.size === 0) {
            return `<span class="counter">Pick at least one platform</span>`;
        }

        const length = state.caption.length;

        return [...state.selectedPlatforms].map((key) => {
            const { name, limit } = PLATFORMS[key];
            const overClass = length > limit ? "is-over" : "";
            return `<span class="counter ${overClass}">${name}: ${length}/${limit}</span>`;
        }).join("");
    }

    function renderPlatformChips() {
        return Object.keys(PLATFORMS).map((key) => {
            const activeClass = state.selectedPlatforms.has(key) ? "is-active" : "";

            return `<button class="chip ${activeClass}"
                            data-action="toggle-platform"
                            data-value="${key}">${PLATFORMS[key].name}</button>`;
        }).join("");
    }

    function renderCompose() {
        const uploadLabel = state.fileName
            ? `🎬 ${escapeHtml(state.fileName)} (click to change)`
            : "Click to choose a video file";

        const preview = state.videoUrl
            ? `<video class="video-preview" src="${state.videoUrl}" controls playsinline></video>`
            : "";

        return `
            <div class="grid grid--two">

                <!-- Left column: video + platforms -->
                <div class="card">
                    <h2>1. Upload video</h2>
                    <label class="dropzone">
                        ${uploadLabel}
                        <input type="file" id="video-input" accept="video/*" class="hidden">
                    </label>
                    ${preview}

                    <h2 style="margin-top: 18px">2. Choose platforms</h2>
                    <div class="row">${renderPlatformChips()}</div>
                </div>

                <!-- Right column: caption + schedule -->
                <div class="card">
                    <h2>3. Write your caption</h2>
                    <textarea id="caption-input"
                              placeholder="Write a caption… #hashtags">${escapeHtml(state.caption)}</textarea>
                    <div id="counters" class="row" style="margin-top: 8px; gap: 14px">
                        ${renderCounters()}
                    </div>

                    <h2 style="margin-top: 16px">4. Schedule (optional)</h2>
                    <input type="datetime-local" id="schedule-input" value="${escapeHtml(state.scheduledAt)}">

                    <div class="row" style="margin-top: 14px">
                        <button class="btn btn--primary" data-action="add-to-queue">Add to queue</button>
                        <button class="btn" data-action="clear-form">Clear</button>
                    </div>
                    <p class="muted">${escapeHtml(state.message)}</p>
                </div>

            </div>`;
    }

    /* ---- Queue ------------------------------------------------------------ */

    function renderQueue() {
        if (state.queue.length === 0) {
            return `
                <div class="card">
                    <h2>Queue</h2>
                    <p class="muted">Nothing here yet. Create a post and add it to the queue.</p>
                </div>`;
        }

        const items = state.queue.map((post, index) => {
            const platformNames = post.platforms.map((key) => PLATFORMS[key].name).join(", ");
            const when = post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "Post now";
            const preview = post.caption.length > 140 ? post.caption.slice(0, 140) + "…" : post.caption;

            return `
                <div class="list-item">
                    <div>
                        <strong>${escapeHtml(post.fileName || "No video")}</strong>
                        <div class="muted">${platformNames} · ${when}</div>
                        <div>${escapeHtml(preview)}</div>
                    </div>
                    <button class="btn" data-action="remove-queued" data-value="${index}">Remove</button>
                </div>`;
        });

        return `
            <div class="card">
                <h2>Queue (${state.queue.length})</h2>
                ${items.join("")}
                <p class="muted">
                    Drafts are stored in this browser only. Publishing for real
                    needs the backend described in the Accounts tab.
                </p>
            </div>`;
    }

    /* ---- Accounts --------------------------------------------------------- */

    function renderAccounts() {
        const rows = Object.keys(PLATFORMS).map((key) => {
            const isConnected = state.connections[key];

            return `
                <div class="list-item">
                    <div>
                        ${platformDot(key)} <strong>${PLATFORMS[key].name}</strong>
                        <div class="muted">${isConnected ? "Marked as connected (demo)" : "Not connected"}</div>
                    </div>
                    <button class="btn ${isConnected ? "" : "btn--primary"}"
                            data-action="toggle-connection"
                            data-value="${key}">${isConnected ? "Disconnect" : "Connect"}</button>
                </div>`;
        });

        return `
            <div class="card">
                <h2>Connected accounts</h2>
                ${rows.join("")}
            </div>

            <div class="card">
                <h2>What it takes to go live</h2>
                <p class="muted">
                    Browsers cannot safely store login tokens or call these
                    platforms directly, so a real version needs:
                </p>
                <ol>
                    <li>A backend (Node/Express or PHP) that handles OAuth login and stores tokens securely.</li>
                    <li>Developer apps: TikTok Content Posting API, YouTube Data API v3, X API, Instagram Graph API.</li>
                    <li>A database (e.g. MySQL) for drafts, schedules and cached analytics, plus a scheduler job.</li>
                </ol>
                <p class="muted">The Connect buttons above are demo toggles only.</p>
            </div>`;
    }

    /* ---- Navigation + render ---------------------------------------------- */

    /** Maps each tab id to the function that renders its view. */
    const VIEWS = {
        compose:   renderCompose,
        analytics: () => SocialHub.analytics.render(state.analyticsFilter),
        queue:     renderQueue,
        accounts:  renderAccounts
    };

    function renderNav() {
        navEl.innerHTML = TABS.map(([id, label]) => {
            const activeClass = id === state.activeTab ? "is-active" : "";
            return `<button class="${activeClass}" data-action="switch-tab" data-value="${id}">${label}</button>`;
        }).join("");
    }

    function render() {
        renderNav();
        appEl.innerHTML = VIEWS[state.activeTab]();
    }


    /* ======================================================================
       4. ACTIONS
       Functions that change state, then re-render.
       ====================================================================== */

    /** Frees the temporary preview URL so the browser can release memory. */
    function releaseVideoUrl() {
        if (state.videoUrl) {
            URL.revokeObjectURL(state.videoUrl);
            state.videoUrl = "";
        }
    }

    function resetForm() {
        releaseVideoUrl();
        state.caption = "";
        state.scheduledAt = "";
        state.fileName = "";
        state.message = "";
    }

    /** Returns an error message if the form is invalid, otherwise "". */
    function validateForm() {
        if (state.selectedPlatforms.size === 0) {
            return "Choose at least one platform.";
        }
        if (!state.caption.trim() && !state.fileName) {
            return "Add a video or a caption first.";
        }

        const tooLong = [...state.selectedPlatforms]
            .filter((key) => state.caption.length > PLATFORMS[key].limit)
            .map((key) => PLATFORMS[key].name);

        return tooLong.length ? `Caption is too long for: ${tooLong.join(", ")}` : "";
    }

    function addToQueue() {
        state.message = validateForm();

        if (state.message) {
            render();
            return;
        }

        state.queue.push({
            fileName: state.fileName,
            caption: state.caption,
            platforms: [...state.selectedPlatforms],
            scheduledAt: state.scheduledAt
        });
        saveToStorage();

        resetForm();
        state.activeTab = "queue";
        render();
    }

    function togglePlatform(key) {
        if (state.selectedPlatforms.has(key)) {
            state.selectedPlatforms.delete(key);
        } else {
            state.selectedPlatforms.add(key);
        }
        render();
    }

    function removeFromQueue(index) {
        state.queue.splice(Number(index), 1);
        saveToStorage();
        render();
    }

    function toggleConnection(key) {
        state.connections[key] = !state.connections[key];
        saveToStorage();
        render();
    }


    /* ======================================================================
       5. EVENT HANDLING
       One listener per event type (event delegation). Buttons declare what
       they do with data-action, so no listeners are re-attached on render.
       ====================================================================== */

    /** data-action name -> handler. `value` comes from data-value. */
    const CLICK_ACTIONS = {
        "switch-tab":        (value) => { state.activeTab = value; render(); },
        "filter-analytics":  (value) => { state.analyticsFilter = value; render(); },
        "toggle-platform":   togglePlatform,
        "add-to-queue":      addToQueue,
        "clear-form":        () => { resetForm(); render(); },
        "remove-queued":     removeFromQueue,
        "toggle-connection": toggleConnection
    };

    document.addEventListener("click", (event) => {
        const target = event.target.closest("[data-action]");
        if (!target) {
            return;
        }

        const handler = CLICK_ACTIONS[target.dataset.action];
        if (handler) {
            handler(target.dataset.value);
        }
    });

    // Typing updates state only. We avoid a full re-render here so the
    // textarea keeps focus and the cursor position.
    document.addEventListener("input", (event) => {
        if (event.target.id === "caption-input") {
            state.caption = event.target.value;
            document.getElementById("counters").innerHTML = renderCounters();
        }

        if (event.target.id === "schedule-input") {
            state.scheduledAt = event.target.value;
        }
    });

    document.addEventListener("change", (event) => {
        if (event.target.id !== "video-input") {
            return;
        }

        const file = event.target.files[0];
        if (!file) {
            return;
        }

        releaseVideoUrl();
        state.fileName = file.name;
        state.videoUrl = URL.createObjectURL(file);
        render();
    });


    /* ======================================================================
       6. INIT
       ====================================================================== */

    loadFromStorage();
    render();

})(window.SocialHub = window.SocialHub || {});