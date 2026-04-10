// Wait for LinkedIn to fully load
function waitForElement(selector, callback) {
  const observer = new MutationObserver(() => {
    const el = document.querySelector(selector);
    if (el) {
      callback(el);
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Get conversation context (last 3 messages)
function getConversationContext() {
  const messages = document.querySelectorAll(
    '.msg-s-event-listitem__body'
  );
  let context = [];
  const start = Math.max(0, messages.length - 3);
  for (let i = start; i < messages.length; i++) {
    context.push(messages[i].innerText.trim());
  }
  return context.join('\n---\n');
}

// Add the Generate Reply button
function addReplyButton(inputBox) {
  // Don't add if already exists
  if (document.getElementById('groq-reply-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'groq-reply-btn';
  btn.innerHTML = '✨ Generate Reply';
  btn.title = 'Generate AI reply using Groq';

  const loading = document.createElement('div');
  loading.id = 'groq-loading';
  loading.innerText = '🤖 Generating reply...';

  // Insert button above the input box
  inputBox.parentNode.insertBefore(btn, inputBox);
  inputBox.parentNode.insertBefore(loading, inputBox);

  // Button click handler
  btn.addEventListener('click', async () => {
    const context = getConversationContext();
    if (!context) {
      alert('No messages found!');
      return;
    }

    // Show loading
    btn.disabled = true;
    btn.innerHTML = '⏳ Generating...';
    loading.style.display = 'block';

    try {
      // Send to background script to call Groq
      const response = await chrome.runtime.sendMessage({
        action: 'generateReply',
        context: context
      });

      if (response.reply) {
        // Focus the input box
        inputBox.focus();

        // Clear existing content
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);

        // Insert the AI reply text
        document.execCommand('insertText', false, response.reply);

        // Trigger all necessary LinkedIn events
        // to activate the Send button
        inputBox.dispatchEvent(
          new Event('input', { bubbles: true })
        );
        inputBox.dispatchEvent(
          new Event('change', { bubbles: true })
        );
        inputBox.dispatchEvent(
          new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true
          })
        );
        inputBox.dispatchEvent(
          new KeyboardEvent('keyup', {
            bubbles: true,
            cancelable: true
          })
        );

        // Small delay then trigger input again
        // (LinkedIn sometimes needs this)
        setTimeout(() => {
          inputBox.dispatchEvent(
            new Event('input', { bubbles: true })
          );

          // Find and enable the Send button manually
          const sendBtn = document.querySelector(
            '.msg-form__send-button'
          );
          if (sendBtn) {
            sendBtn.removeAttribute('disabled');
            sendBtn.classList.remove('disabled');
          }
        }, 300);

      } else {
        alert('Error: ' + (response.error || 'Unknown error'));
      }

    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '✨ Generate Reply';
      loading.style.display = 'none';
    }
  });
}

// Watch for LinkedIn message input box
waitForElement('.msg-form__contenteditable', (inputBox) => {
  addReplyButton(inputBox);
});

// Re-add button when conversation changes
const observer = new MutationObserver(() => {
  const inputBox = document.querySelector(
    '.msg-form__contenteditable'
  );
  if (inputBox && !document.getElementById('groq-reply-btn')) {
    addReplyButton(inputBox);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});