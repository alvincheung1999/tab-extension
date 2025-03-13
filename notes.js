document.addEventListener("DOMContentLoaded", () => {
  const notepad = document.getElementById("notepad");

  const api = typeof browser !== 'undefined' ? browser : chrome;
  const extensionStorage = api?.storage?.sync || api?.storage?.local || null;

  const useLocalStorage = !extensionStorage;

  function loadText() {
    if (useLocalStorage) {
      const text = localStorage.getItem("notepadText") || "";
      notepad.value = text;
    } else {
      extensionStorage.get("notepadText", (result) => {
        const text = result?.notepadText;
        if (text !== undefined && notepad.value !== text) {
          notepad.value = text;
        }
      });
    }
  }

  function saveText(text) {
    if (useLocalStorage) {
      localStorage.setItem("notepadText", text);
    } else {
      extensionStorage.set({ notepadText: text }, () => {
        if (api.runtime?.sendMessage) {
          api.runtime.sendMessage({ type: "notepadUpdate", text });
        }
      });
    }
  }

  loadText();

  notepad.addEventListener("input", () => {
    saveText(notepad.value);
  });

  if (!useLocalStorage) {
    api.storage?.onChanged?.addListener((changes, area) => {
      if ((area === "sync" || area === "local") && changes.notepadText) {
        const newValue = changes.notepadText.newValue;
        if (newValue !== undefined && newValue !== notepad.value) {
          notepad.value = newValue;
        }
      }
    });

    api.runtime?.onMessage?.addListener((message) => {
      if (message.type === "notepadUpdate" && message.text !== notepad.value) {
        notepad.value = message.text;
      }
    });
  }
});
