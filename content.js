/**
 * SpeedStream Content Script
 * Handles playback speed control and displays a Shadow DOM overlay.
 */

class SpeedStreamOverlay {
    constructor() {
        this.host = document.createElement("div");
        this.host.id = "speedstream-host";
        this.host.style.position = "absolute";
        this.host.style.top = "0";
        this.host.style.left = "0";
        this.host.style.width = "100%";
        this.host.style.height = "100%";
        this.host.style.zIndex = "2147483647"; // Max z-index
        this.host.style.pointerEvents = "none"; // Let clicks pass through

        this.shadow = this.host.attachShadow({ mode: "open" });
        this.shadow.innerHTML = `
      <style>
        .toast {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(20, 20, 20, 0.9);
          color: #fff;
          padding: 16px 32px;
          border-radius: 12px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 24px;
          font-weight: 600;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          z-index: 2147483647;
        }
        .toast.visible {
          opacity: 1;
        }
        .icon {
          font-size: 28px;
        }
      </style>
      <div class="toast" id="toast">
        <span class="icon"></span>
        <span class="text"></span>
      </div>
    `;

        this.toast = this.shadow.getElementById("toast");
        this.icon = this.shadow.querySelector(".icon");
        this.text = this.shadow.querySelector(".text");
        this.timer = null;

        this.attachToDOM();
        this.setupFullscreenListener();
    }

    attachToDOM() {
        // If fullscreen, attach to the fullscreen element, otherwise document.body
        const target = document.fullscreenElement || document.body;

        // Ensure we are attached to the correct target
        if (this.host.parentElement !== target) {
            if (this.host.parentElement) {
                this.host.parentElement.removeChild(this.host);
            }
            target.appendChild(this.host);
        }
    }

    setupFullscreenListener() {
        const handleFullscreenChange = () => {
            // Small delay to ensure the browser has finished switching contexts
            setTimeout(() => this.attachToDOM(), 100);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    }

    show(message, iconFn) {
        this.text.textContent = message;
        this.icon.textContent = iconFn ? iconFn : "";

        // Ensure it's attached before showing
        this.attachToDOM();

        requestAnimationFrame(() => {
            this.toast.classList.add("visible");
        });

        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.toast.classList.remove("visible");
        }, 1500);
    }
}

const overlay = new SpeedStreamOverlay();

/**
 * Recursively searches for the first HTMLVideoElement in a DOM tree,
 * piercing through Shadow roots.
 */
function findVideoRecursive(root) {
    if (!root) return null;

    // 1. Check if the root itself is a video
    if (root instanceof HTMLVideoElement) return root;

    // 2. Check direct children
    // Note: querySelector won't go into shadow roots of children
    const video = root.querySelector && root.querySelector("video");
    if (video) return video;

    // 3. Search Shadow DOMs of all children
    // We get all elements, filter for those with shadowRoot, and search them.
    // This can be expensive on huge pages, but effectively necessary for Apple TV etc.
    const allElements = root.querySelectorAll ? root.querySelectorAll("*") : [];

    for (const el of allElements) {
        if (el.shadowRoot) {
            const found = findVideoRecursive(el.shadowRoot);
            if (found) return found;
        }
    }

    return null;
}

function getVideo() {
    // 1. Try document.activeElement (most likely user just clicked player)
    if (document.activeElement) {
        if (document.activeElement instanceof HTMLVideoElement) return document.activeElement;

        // If active element has shadow root, search inside it
        if (document.activeElement.shadowRoot) {
            const v = findVideoRecursive(document.activeElement.shadowRoot);
            if (v) return v;
        }
    }

    // 2. Fallback: Search the entire document including all shadow roots
    return findVideoRecursive(document);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const video = getVideo();

    if (!video) {
        overlay.show("No video found", "❌");
        return;
    }

    let newRate = video.playbackRate;

    if (request.action === "speed_up") {
        newRate += 0.25;
        video.playbackRate = newRate;
        overlay.show(`${newRate}x`, "⏩");
    } else if (request.action === "slow_down") {
        newRate = Math.max(0.25, newRate - 0.25);
        video.playbackRate = newRate;
        overlay.show(`${newRate}x`, "⏪");
    }
});
