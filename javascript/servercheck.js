// javascript/servercheck.js

(function () {
  const API_URL = "https://auth.teamexist.com/api/offlinestatus";
  const LOGO_PATH = "assets/logo.svg";
  const APPEAR_DELAY_MS = 3000;    // 3 seconds after page load
  const CLOSE_BTN_DELAY_MS = 1000; // 1 second after widget appears
  const FETCH_TIMEOUT_MS = 6000;   // Fallback timeout if gateway hangs

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
        pointer-events: all; /* Blocks clicks to underlying page */
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
        padding: 2.5rem 2rem 2rem;
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

      .dws-status-close {
        margin-top: 0.5rem;
        padding: 0.65rem 2rem;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.35);
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.45) 0%,
          rgba(255, 255, 255, 0.15) 100%
        );
        box-shadow:
          0 4px 16px rgba(0, 0, 0, 0.12),
          inset 0 0 16px rgba(255, 255, 255, 0.15);
        color: inherit;
        font-family: inherit;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        opacity: 0;
        transform: translateY(10px);
        pointer-events: none; /* Disabled until 1s delay finishes */
        transition:
          opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1),
          transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
          background 0.2s ease,
          box-shadow 0.2s ease;
      }

      .dws-status-close.is-visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .dws-status-close.is-visible:hover {
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.65) 0%,
          rgba(255, 255, 255, 0.30) 100%
        );
        transform: translateY(-1px);
        box-shadow:
          0 6px 20px rgba(0, 0, 0, 0.18),
          inset 0 0 20px rgba(255, 255, 255, 0.25);
      }

      .dws-status-close.is-visible:active {
        transform: translateY(1px) scale(0.98);
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

        .dws-status-close {
          background: linear-gradient(
            135deg,
            rgba(60, 60, 60, 0.65) 0%,
            rgba(25, 25, 25, 0.45) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.35),
            inset 0 0 16px rgba(255, 255, 255, 0.05);
        }

        .dws-status-close.is-visible:hover {
          background: linear-gradient(
            135deg,
            rgba(80, 80, 80, 0.75) 0%,
            rgba(40, 40, 40, 0.55) 100%
          );
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

    // Save previous overflow state and lock background scrolling
    const previousOverflow = document.body.style.overflow;
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

    // Stop events from bubbling out of the overlay to the page behind it
    const stopBubble = (e) => e.stopPropagation();
    overlay.addEventListener("click", stopBubble);
    overlay.addEventListener("mousedown", stopBubble);
    overlay.addEventListener("touchstart", stopBubble);

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

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "dws-status-close";
    closeBtn.textContent = "Close";

    // Smoothly dismisses the modal and restores page interaction
    closeBtn.addEventListener("click", () => {
      closeBtn.classList.remove("is-visible");
      overlay.classList.remove("is-visible");
      document.body.style.overflow = previousOverflow;

      setTimeout(() => {
        overlay.remove();
      }, 600);
    });

    widget.appendChild(logo);
    widget.appendChild(title);
    widget.appendChild(message);
    widget.appendChild(closeBtn);
    overlay.appendChild(widget);
    document.body.appendChild(overlay);

    // Trigger widget fade & slide-in, then reveal close button 1 second later
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add("is-visible");

        setTimeout(() => {
          closeBtn.classList.add("is-visible");
        }, CLOSE_BTN_DELAY_MS);
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
