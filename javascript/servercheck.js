// javascript/servercheck.js

(function () {
  const API_URL = "https://auth.teamexist.com/api/offlinestatus";
  const LOGO_PATH = "assets/logo.svg";
  const APPEAR_DELAY_MS = 3000; // 3 seconds after page load
  const FETCH_TIMEOUT_MS = 6000; // Fallback timeout if gateway hangs

  const MESSAGES = {
    unreachable: {
      title: "Servers Offline",
      body: "We're sorry, the DWS Servers are currently offline. Some features may not be available at this time."
    },
    maintenance: {
      title: "Server Maintenance",
      body: "We're sorry, servers are currently under maintenance. Not all features may be available."
    }
  };

  /**
   * Injects the liquid glass CSS and animations into the document head.
   */
  function injectStyles() {
    if (document.getElementById("dws-servercheck-styles")) return;

    const style = document.createElement("style");
    style.id = "dws-servercheck-styles";
    style.textContent = `
      .dws-status-overlay {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1.5rem;
        box-sizing: border-box;
        z-index: 999999;
        pointer-events: all; /* Blocks all clicks to underlying elements */
        user-select: none;
        opacity: 0;
        transition: opacity 0.5s ease;
      }

      .dws-status-overlay.is-visible {
        opacity: 1;
      }

      .dws-status-widget {
        position: relative;
        width: 100%;
        max-width: 480px;
        padding: 2.5rem 2rem;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1.25rem;

        /* Liquid Glass Effect (matches .section-container) */
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.50) 0%,
          rgba(255, 255, 255, 0.20) 100%
        );
        border-radius: 40px;
        box-shadow:
          0 8px 32px rgba(0, 0, 0, 0.3),
          inset 0 0 40px rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(40px) saturate(2.3);
        -webkit-backdrop-filter: blur(40px) saturate(2.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        overflow: hidden;

        /* Slide & Fade Entrance State */
        color: #111111;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        opacity: 0;
        transform: translateY(32px) scale(0.96);
        transition:
          opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
          transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .dws-status-overlay.is-visible .dws-status-widget {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .dws-status-logo {
        height: 56px;
        width: auto;
        object-fit: contain;
        margin-bottom: 0.25rem;
        filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
      }

      .dws-status-title {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      .dws-status-message {
        margin: 0;
        font-size: 1rem;
        line-height: 1.55;
        opacity: 0.88;
        max-width: 38ch;
      }

      @media (prefers-color-scheme: dark) {
        .dws-status-overlay {
          background: rgba(0, 0, 0, 0.65);
        }

        .dws-status-widget {
          background: linear-gradient(
            135deg,
            rgba(30, 30, 30, 0.60) 0%,
            rgba(0, 0, 0, 0.40) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f5f5f7;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Builds and displays the blocking liquid glass modal.
   * @param {{ title: string, body: string }} statusContent
   */
  function showStatusWidget(statusContent) {
    if (document.getElementById("dws-status-overlay")) return;

    injectStyles();

    // Prevent scrolling and keyboard interaction with background elements
    document.body.style.overflow = "hidden";
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }

    const overlay = document.createElement("div");
    overlay.id = "dws-status-overlay";
    overlay.className = "dws-status-overlay";
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "dws-status-title");
    overlay.setAttribute("aria-describedby", "dws-status-desc");

    // Swallow click/touch/key events so underlying page cannot be interacted with
    const blockEvent = (e) => {
      e.stopPropagation();
    };
    overlay.addEventListener("click", blockEvent, true);
    overlay.addEventListener("mousedown", blockEvent, true);
    overlay.addEventListener("touchstart", blockEvent, true);

    const widget = document.createElement("div");
    widget.className = "dws-status-widget";

    const logo = document.createElement("img");
    logo.src = LOGO_PATH;
    logo.alt = "DWS";
    logo.className = "dws-status-logo";

    const title = document.createElement("h2");
    title.id = "dws-status-title";
    title.className = "dws-status-title";
    title.textContent = statusContent.title;

    const message = document.createElement("p");
    message.id = "dws-status-desc";
    message.className = "dws-status-message";
    message.textContent = statusContent.body;

    widget.appendChild(logo);
    widget.appendChild(title);
    widget.appendChild(message);
    overlay.appendChild(widget);
    document.body.appendChild(overlay);

    // Trigger fade & slide-in on next animation frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add("is-visible");
      });
    });
  }

  /**
   * Queries the gateway endpoint and triggers the widget if offline or unreachable.
   */
  function checkServerStatus() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    fetch(API_URL, { signal: controller.signal, cache: "no-store" })
      .then((res) => {
        clearTimeout(timeoutId);
        if (!res.ok) {
          throw new Error(`HTTP status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const offlineCount = Number(data?.offline);
        console.log("Servers down:", offlineCount);

        if (Number.isNaN(offlineCount)) {
          showStatusWidget(MESSAGES.unreachable);
        } else if (offlineCount >= 1) {
          showStatusWidget(MESSAGES.maintenance);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("Gateway unreachable:", err);
        showStatusWidget(MESSAGES.unreachable);
      });
  }

  /**
   * Waits 3 seconds after full page load before executing the check and showing the widget.
   */
  function init() {
    setTimeout(checkServerStatus, APPEAR_DELAY_MS);
  }

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init, { once: true });
  }
})();
