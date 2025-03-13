document.addEventListener("DOMContentLoaded", () => {
    const notepad = document.getElementById("notepad");
  
    const storage = (typeof browser !== 'undefined' && browser.storage && browser.storage.sync)
      ? browser.storage.sync
      : (typeof browser !== 'undefined' && browser.storage && browser.storage.local)
        ? browser.storage.local
        : null;
  
    if (!storage) {
      console.warn("Storage API not available.");
      return;
    }
  
    // Load saved text
    function loadText() {
      storage.get("notepadText").then(result => {
        if (result.notepadText !== undefined && notepad.value !== result.notepadText) {
          notepad.value = result.notepadText;
        }
      }).catch(err => console.error("Error loading notepad text:", err));
    }
  
    loadText();
  
    // Save on input and broadcast changes
    notepad.addEventListener("input", () => {
      const text = notepad.value;
      storage.set({ notepadText: text }).then(() => {
        if (browser.runtime && browser.runtime.sendMessage) {
          browser.runtime.sendMessage({ type: "notepadUpdate", text });
        }
      }).catch(err => {
        console.error("Error saving notepad text:", err);
      });
    });
  
    // Listen for changes in storage from other tabs (fallback)
    if (browser && browser.storage && browser.storage.onChanged) {
      browser.storage.onChanged.addListener((changes, area) => {
        if ((area === "sync" || area === "local") && changes.notepadText) {
          if (notepad.value !== changes.notepadText.newValue) {
            notepad.value = changes.notepadText.newValue || "";
          }
        }
      });
    }
  
    // Live sync via runtime messaging
    if (browser.runtime && browser.runtime.onMessage) {
      browser.runtime.onMessage.addListener((message) => {
        if (message.type === "notepadUpdate" && message.text !== notepad.value) {
          notepad.value = message.text;
        }
      });
    }
  });
  