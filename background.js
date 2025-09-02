// Background service worker for Real Dark Mode
// Toggles the flashlight overlay content script per-tab when the action button is clicked

const CONTENT_SCRIPT_ID = 'real-dark-mode-content-script';

async function isScriptInjected(tabId) {
  try {
    const result = await chrome.scripting.getRegisteredContentScripts();
    // We do not rely on registration because MV3 prefers programmatic injection per tab.
    // We'll detect via a tab-scoped flag in storage.
    const { [String(tabId)]: tabState } = (await chrome.storage.session.get(String(tabId))) || {};
    return Boolean(tabState && tabState.enabled);
  } catch (err) {
    console.error('Error checking script injection', err);
    return false;
  }
}

async function setTabEnabled(tabId, enabled) {
  await chrome.storage.session.set({ [String(tabId)]: { enabled } });
}

async function injectContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  });
}

async function ensureTabState(tabId) {
  const enabled = await isScriptInjected(tabId);
  await chrome.action.setBadgeText({ tabId, text: enabled ? 'ON' : '' });
  await chrome.action.setBadgeBackgroundColor({ tabId, color: '#222' });
  if (!enabled) return;
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'RDM_SET', enabled: true });
  } catch (err) {
    await injectContentScript(tabId);
    await chrome.tabs.sendMessage(tabId, { type: 'RDM_SET', enabled: true });
  }
}

async function toggleForTab(tab) {
  if (!tab || !tab.id) return;
  const tabId = tab.id;
  const currentlyEnabled = await isScriptInjected(tabId);

  await chrome.action.setBadgeText({ tabId, text: currentlyEnabled ? '' : 'ON' });
  await chrome.action.setBadgeBackgroundColor({ tabId, color: '#222' });

  try {
    await chrome.tabs.sendMessage(tabId, { type: 'RDM_TOGGLE' });
    await setTabEnabled(tabId, !currentlyEnabled);
  } catch (err) {
    // Likely not injected yet; inject then toggle
    await injectContentScript(tabId);
    await chrome.tabs.sendMessage(tabId, { type: 'RDM_TOGGLE' });
    await setTabEnabled(tabId, true);
    await chrome.action.setBadgeText({ tabId, text: 'ON' });
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  await toggleForTab(tab);
});

// Keep badge consistent on tab updates
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await ensureTabState(tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    await ensureTabState(tabId);
  }
});


