// Offscreen clipboard helper. Service workers have no DOM, so the copy runs
// here via a textarea + execCommand — the pattern Chrome documents for the
// CLIPBOARD offscreen reason. Nothing else happens in this document.
const sink = document.getElementById('sink');

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target !== 'offscreen' || msg.type !== 'copy') return false;

  sink.value = msg.text || '';
  sink.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (err) {
    console.warn('[RR] execCommand copy threw', err);
  }
  sink.value = '';
  sendResponse({ ok });
  return true;
});
