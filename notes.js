// Notlar sistemi
export class NotesManager {
  constructor() {
    this.notes = new Map();
  }

  addNote(questionId, content, tags = []) {
    const note = {
      id: Date.now(),
      questionId,
      content,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!this.notes.has(questionId)) {
      this.notes.set(questionId, []);
    }

    this.notes.get(questionId).push(note);
    return note;
  }

  updateNote(questionId, noteId, content, tags = []) {
    const notes = this.notes.get(questionId);
    if (!notes) return null;

    const note = notes.find(n => n.id === noteId);
    if (note) {
      note.content = content;
      note.tags = tags;
      note.updatedAt = new Date().toISOString();
    }
    return note;
  }

  deleteNote(questionId, noteId) {
    const notes = this.notes.get(questionId);
    if (!notes) return false;

    const index = notes.findIndex(n => n.id === noteId);
    if (index > -1) {
      notes.splice(index, 1);
      return true;
    }
    return false;
  }

  getNotes(questionId) {
    return this.notes.get(questionId) || [];
  }

  getAllNotes() {
    const all = [];
    for (const [qId, notes] of this.notes) {
      all.push(...notes.map(n => ({ ...n, questionId: qId })));
    }
    return all;
  }
}

export const notesManager = new NotesManager();