chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'generateReply') {
    handleGenerateReply(message.context)
      .then(reply => sendResponse({ reply }))
      .catch(err => sendResponse({ error: err.message }));
    return true; // keeps message channel open
  }
});

async function handleGenerateReply(context) {
  // Get API key from storage
  const data = await chrome.storage.sync.get(['groqApiKey', 'replyTone']);
  const apiKey = data.groqApiKey;
  const tone = data.replyTone || 'professional';

  if (!apiKey) {
    throw new Error('Please add your Groq API key in extension settings!');
  }

  const prompt = `You are a professional LinkedIn user.
  
Here is the conversation context:
${context}

Write a ${tone} reply to the last message.
Keep it concise (2-4 sentences max).
Sound human, not robotic.
Do not use emojis unless appropriate.
Only return the reply text — nothing else.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error('Groq API error: ' + response.statusText);
  }

  const result = await response.json();
  return result.choices[0].message.content.trim();
}