// Load saved settings
chrome.storage.sync.get(['groqApiKey', 'replyTone'], (data) => {
  if (data.groqApiKey) {
    document.getElementById('apiKey').value = data.groqApiKey;
  }
  if (data.replyTone) {
    document.getElementById('tone').value = data.replyTone;
  }
});

// Save settings
document.getElementById('saveBtn').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  const tone = document.getElementById('tone').value;

  if (!apiKey) {
    alert('Please enter your Groq API key!');
    return;
  }

  chrome.storage.sync.set({
    groqApiKey: apiKey,
    replyTone: tone
  }, () => {
    const status = document.getElementById('status');
    status.style.display = 'block';
    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);
  });
});



