const ICONS = {
  on: {
    16: 'icons/icon-on-16.png',
    32: 'icons/icon-on-32.png',
    48: 'icons/icon-on-48.png',
    128: 'icons/icon-on-128.png',
  },
  off: {
    16: 'icons/icon-off-16.png',
    32: 'icons/icon-off-32.png',
    48: 'icons/icon-off-48.png',
    128: 'icons/icon-off-128.png',
  },
};

function setIcon(tabId, isOn) {
  chrome.action.setIcon({
    tabId,
    path: isOn ? ICONS.on : ICONS.off,
  });
}

async function getState(tabId) {
  const result = await chrome.storage.session.get(`tab-${tabId}`);
  return !!result[`tab-${tabId}`];
}

async function setState(tabId, isOn) {
  await chrome.storage.session.set({ [`tab-${tabId}`]: isOn });
}

chrome.action.onClicked.addListener(async (tab) => {
  const tabId = tab.id;
  const wasOn = await getState(tabId);
  const isOn = !wasOn;

  await setState(tabId, isOn);
  setIcon(tabId, isOn);

  // content script 주입 (chrome:// 등 특수 페이지는 실패하므로 무시)
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
  } catch (e) {}

  chrome.tabs.sendMessage(tabId, { type: isOn ? 'SCAN' : 'CLEAR' });
});

// 탭 닫히면 상태 정리
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(`tab-${tabId}`);
});

// 탭 전환 시 아이콘 복원
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const isOn = await getState(tabId);
  setIcon(tabId, isOn);
});