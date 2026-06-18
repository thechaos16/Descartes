/* global chrome */
// Descartes Bookmarker Extension Logic

const SUPABASE_URL = "https://sxhqrkhvnoizucpwfbng.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_grTJiu0aeUQhiowywof0kQ_QnA8CfrJ";
const LOCAL_STORAGE_AUTH_KEY = "sb-sxhqrkhvnoizucpwfbng-auth-token";

// DOM Elements
const loadingView = document.getElementById("loading-view");
const authView = document.getElementById("auth-view");
const formView = document.getElementById("form-view");
const btnLogin = document.getElementById("btn-login");
const btnSave = document.getElementById("btn-save");
const pageTitleEl = document.getElementById("page-title");
const pageUrlEl = document.getElementById("page-url");
const readToggle = document.getElementById("read-toggle");
const statusMessage = document.getElementById("status-message");

// Active Page Details
let currentUrl = "";
let currentTitle = "";
let normalizedUrl = "";
let accessToken = "";

// Initialize Extension popup
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. Get current browser tab details
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error("No active browser tab found.");
    
    currentUrl = tab.url;
    currentTitle = tab.title || "Untitled Link";
    
    // Ignore chrome pages, extensions pages, etc.
    if (currentUrl.startsWith("chrome://") || currentUrl.startsWith("chrome-extension://")) {
      showStatus("Cannot bookmark internal browser pages.", "error");
      showView(formView);
      btnSave.disabled = true;
      pageTitleEl.textContent = currentTitle;
      pageUrlEl.textContent = currentUrl;
      return;
    }

    normalizedUrl = normalizeUrl(currentUrl);
    
    // Populate form UI
    pageTitleEl.textContent = currentTitle;
    pageUrlEl.textContent = currentUrl;

    // 2. Load auth session
    await authenticate();
  } catch (err) {
    showStatus(err.message, "error");
    showView(authView);
  }
});

// Normalize URLs to strip tracking parameters and handle SPA routing
function normalizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();
    
    // 1. Remove marketing/analytics tracking parameters
    const searchParams = new URLSearchParams(url.search);
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 
      'utm_content', 'ref', 'fbclid', 'gclid', 'yclid'
    ];
    trackingParams.forEach(param => searchParams.delete(param));
    
    // 2. Handle specific website exceptions
    // For YouTube, keep video ID
    if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
      const videoId = searchParams.get('v');
      const cleanParams = new URLSearchParams();
      if (videoId) cleanParams.set('v', videoId);
      url.search = cleanParams.toString();
      url.hash = '';
    } 
    // 3. Handle Single Page Applications (SPAs)
    else {
      const isHashRouting = url.hash && (url.hash.startsWith('#/') || url.hash.startsWith('#!'));
      if (isHashRouting) {
        url.search = searchParams.toString();
      } else {
        url.search = '';
        url.hash = '';
      }
    }
    
    // 4. Remove trailing slash
    let pathname = url.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    
    return url.origin + pathname + url.search + url.hash;
  } catch {
    return rawUrl;
  }
}

// Refresh the session using the refresh token from Supabase
async function refreshSession(refreshToken) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.access_token) {
        return data;
      }
    }
  } catch (e) {
    console.error("Failed to refresh session:", e);
  }
  return null;
}

// Authentication Session retrieval
async function authenticate() {
  // Check cached token in Extension storage
  const storage = await chrome.storage.local.get(["descartes_token_data"]);
  let session = storage.descartes_token_data;

  if (session && session.expires_at) {
    const now = Date.now();
    // If access token is still valid, use it
    if (session.expires_at * 1000 > now) {
      accessToken = session.access_token;
      showView(formView);
      return;
    }
    // If expired but we have a refresh token, try to refresh it
    if (session.refresh_token) {
      const refreshedSession = await refreshSession(session.refresh_token);
      if (refreshedSession) {
        accessToken = refreshedSession.access_token;
        await chrome.storage.local.set({ descartes_token_data: refreshedSession });
        showView(formView);
        return;
      }
    }
  }

  // Token is missing or expired, attempt to extract it from any active Descartes tab
  const tabToken = await findDescartesTokenInTabs();
  if (tabToken) {
    accessToken = tabToken.access_token;
    // Cache the token
    await chrome.storage.local.set({ descartes_token_data: tabToken });
    showView(formView);
  } else {
    showView(authView);
  }
}

// Scans tabs for logged-in Descartes websites and executes code injection to grab local storage
async function findDescartesTokenInTabs() {
  const tabs = await chrome.tabs.query({});
  // Look for localhost:5173, Descartes domains, or titles containing Descartes
  const targetTabs = tabs.filter(t => 
    (t.url && t.url.includes("localhost:")) || 
    (t.url && t.url.includes("descartes"))
  );

  for (const tab of targetTabs) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (key) => localStorage.getItem(key),
        args: [LOCAL_STORAGE_AUTH_KEY]
      });

      if (results && results[0] && results[0].result) {
        const tokenData = JSON.parse(results[0].result);
        if (tokenData && tokenData.access_token) {
          return tokenData;
        }
      }
    } catch (e) {
      console.warn("Failed to inject script into tab", tab.url, e);
    }
  }
  return null;
}

// View switcher helper
function showView(viewToShow) {
  loadingView.classList.add("hidden");
  authView.classList.add("hidden");
  formView.classList.add("hidden");
  viewToShow.classList.remove("hidden");
}

// Status message helper
function showStatus(msg, type) {
  statusMessage.textContent = msg;
  statusMessage.className = `status-box ${type}`;
  statusMessage.classList.remove("hidden");
}

// Open Descartes login button handler
btnLogin.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://descartes-tau.vercel.app/" });
});

// Save bookmark button handler
btnSave.addEventListener("click", async () => {
  btnSave.disabled = true;
  statusMessage.classList.add("hidden");
  
  const editedTitle = pageTitleEl.textContent.trim();
  const isRead = readToggle.checked;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/bookmarks`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        url: currentUrl,
        normalized_url: normalizedUrl,
        title: editedTitle || currentTitle,
        is_read: isRead
      })
    });

    if (response.ok) {
      showStatus("Saved successfully!", "success");
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      const errBody = await response.json().catch(() => ({}));
      // Check for PostgreSQL Unique Violation code '23505'
      // It is often returned inside `errBody.code`
      if (errBody && errBody.code === "23505") {
        showStatus("Already Bookmarked!", "info");
      } else {
        throw new Error(errBody.message || `Failed to save (Status ${response.status})`);
      }
    }
  } catch (err) {
    console.error("Save error:", err);
    showStatus(err.message, "error");
    btnSave.disabled = false;
  }
});
