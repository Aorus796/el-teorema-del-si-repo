export class UiController {
  constructor(documentRef) {
    this.document = documentRef;
    this.prompt = requireElement(documentRef, "#interaction-prompt");
    this.toast = requireElement(documentRef, "#toast");
    this.dialoguePanel = requireElement(documentRef, "#dialogue-panel");
    this.dialogueSpeaker = requireElement(documentRef, "#dialogue-speaker");
    this.dialogueText = requireElement(documentRef, "#dialogue-text");
    this.notebookPanel = requireElement(documentRef, "#notebook-panel");
    this.notebookContent = requireElement(documentRef, "#notebook-content");
    this.notebookClose = requireElement(documentRef, "#notebook-close");
    this.toastTimer = null;
    this.dialogue = null;

    this.notebookClose.addEventListener("click", () => {
      this.hideNotebook();
    });
  }

  showPrompt(text) {
    this.prompt.textContent = text;
    this.prompt.hidden = false;
  }

  hidePrompt() {
    this.prompt.hidden = true;
  }

  showToast(text, durationMs = 1800) {
    window.clearTimeout(this.toastTimer);
    this.toast.textContent = text;
    this.toast.hidden = false;
    this.toastTimer = window.setTimeout(() => {
      this.toast.hidden = true;
    }, durationMs);
  }

  beginDialogue({ speaker, lines, onComplete }) {
    if (!Array.isArray(lines) || lines.length === 0) {
      throw new Error("El dialogo necesita al menos una linea.");
    }

    this.dialogue = {
      speaker,
      lines,
      index: 0,
      onComplete,
    };
    this.dialoguePanel.hidden = false;
    this.renderDialogueLine();
  }

  advanceDialogue() {
    if (!this.dialogue) {
      return false;
    }

    this.dialogue.index += 1;
    if (this.dialogue.index >= this.dialogue.lines.length) {
      const onComplete = this.dialogue.onComplete;
      this.dialogue = null;
      this.dialoguePanel.hidden = true;
      onComplete?.();
      return true;
    }

    this.renderDialogueLine();
    return true;
  }

  isDialogueOpen() {
    return this.dialogue !== null;
  }

  renderDialogueLine() {
    this.dialogueSpeaker.textContent = this.dialogue.speaker;
    this.dialogueText.textContent = this.dialogue.lines[this.dialogue.index];
  }

  showNotebook(entries) {
    this.notebookContent.replaceChildren();

    if (entries.length === 0) {
      const empty = this.document.createElement("p");
      empty.textContent = "Todavia no has registrado ninguna observacion.";
      this.notebookContent.append(empty);
    } else {
      for (const entry of entries) {
        const article = this.document.createElement("article");
        article.className = "notebook-entry";

        const title = this.document.createElement("h2");
        title.textContent = entry.title;

        const body = this.document.createElement("p");
        body.textContent = entry.text;

        article.append(title, body);
        this.notebookContent.append(article);
      }
    }

    this.notebookPanel.hidden = false;
    this.notebookClose.focus();
  }

  hideNotebook() {
    this.notebookPanel.hidden = true;
  }

  isNotebookOpen() {
    return !this.notebookPanel.hidden;
  }

  closeAll() {
    this.hidePrompt();
    this.hideNotebook();
    this.dialogue = null;
    this.dialoguePanel.hidden = true;
  }
}

function requireElement(documentRef, selector) {
  const element = documentRef.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`No se ha encontrado el elemento "${selector}".`);
  }

  return element;
}
