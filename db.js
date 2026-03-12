const DB_NAME = "soru_havuzu_db";
const DB_VERSION = 1;
const STORE_NAME = "questions";

let dbPromise;

export class DBError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "DBError";
    this.cause = cause;
  }
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB request failed"));
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Transaction failed"));
    tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
  });
}

function isOpenEndedType(type) {
  return type === "open-ended";
}

function isMultipleChoiceType(type) {
  return type === "multiple-choice";
}

function typeMatches(left, right) {
  return left === right;
}

function validateQuestionInput(input) {
  if (!input || typeof input !== "object") {
    throw new DBError("Question payload must be an object.");
  }

  const type = String(input.type || "").trim();
  const text = String(input.text || "").trim();
  const options = Array.isArray(input.options)
    ? input.options.map((v) => String(v).trim()).filter(Boolean)
    : [];
  const category = String(input.category || "").trim();
  const subcategory = String(input.subcategory || "").trim();
  const difficulty = String(input.difficulty || "").trim().toLowerCase();
  const isFavorite = Boolean(input.isFavorite);

  if (!["open-ended", "multiple-choice"].includes(type)) {
    throw new DBError("type must be 'open-ended' or 'multiple-choice'.");
  }
  if (!text) {
    throw new DBError("Question text is required.");
  }
  if (!category || !subcategory) {
    throw new DBError("Category and subcategory are required.");
  }
  if (!["easy", "medium", "hard"].includes(difficulty)) {
    throw new DBError("difficulty must be easy, medium, or hard.");
  }

  const output = {
    type,
    text,
    options,
    answer: null,
    category,
    subcategory,
    difficulty,
    isFavorite,
    image: input.image || null
  };

  const answerText = String(input.answer ?? "").trim();
  if (isMultipleChoiceType(type)) {
    if (!answerText) {
      throw new DBError("Correct answer is required for multiple-choice.");
    }
    output.answer = answerText;
  } else {
    output.options = [];
    output.answer = answerText;
  }

  if (output.image && typeof output.image === "object") {
    if (!(output.image.blob instanceof Blob)) {
      throw new DBError("image.blob must be a Blob when image is provided.");
    }
  }

  return output;
}

async function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("category", "category", { unique: false });
        store.createIndex("subcategory", "subcategory", { unique: false });
        store.createIndex("difficulty", "difficulty", { unique: false });
        store.createIndex("isFavorite", "isFavorite", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("category_subcategory", ["category", "subcategory"], { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new DBError("Failed to open database.", req.error));
    req.onblocked = () => reject(new DBError("Database open request blocked by another tab."));
  });

  return dbPromise;
}

async function withStore(mode, run) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, mode);
  const store = tx.objectStore(STORE_NAME);

  try {
    const result = await run(store, tx);
    await txDone(tx);
    return result;
  } catch (error) {
    try {
      tx.abort();
    } catch (_) {
      // Ignore abort failure when tx already completed
    }
    throw error instanceof DBError ? error : new DBError("Database operation failed.", error);
  }
}

function withTimestamps(question, existing = null) {
  const now = new Date().toISOString();
  return {
    ...question,
    createdAt: existing?.createdAt || question.createdAt || now,
    updatedAt: now
  };
}

export async function initDB() {
  await openDB();
}

export async function createQuestion(payload) {
  const normalized = withTimestamps(validateQuestionInput(payload));

  return withStore("readwrite", async (store) => {
    const id = await reqToPromise(store.add(normalized));
    return { id, ...normalized };
  });
}

export async function updateQuestion(id, patch) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new DBError("Invalid question id.");
  }

  return withStore("readwrite", async (store) => {
    const current = await reqToPromise(store.get(numericId));
    if (!current) {
      throw new DBError(`Question ${numericId} not found.`);
    }

    const merged = validateQuestionInput({ ...current, ...patch });
    const next = { ...withTimestamps(merged, current), id: numericId };
    await reqToPromise(store.put(next));
    return next;
  });
}

export async function deleteQuestion(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new DBError("Invalid question id.");
  }

  return withStore("readwrite", async (store) => {
    await reqToPromise(store.delete(numericId));
    return true;
  });
}

export async function clearQuestions() {
  return withStore("readwrite", async (store) => {
    await reqToPromise(store.clear());
    return true;
  });
}

export async function getQuestionById(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new DBError("Invalid question id.");
  }

  return withStore("readonly", async (store) => reqToPromise(store.get(numericId)));
}

export async function getAllQuestions() {
  return withStore("readonly", async (store) => reqToPromise(store.getAll()));
}

export async function toggleFavorite(id) {
  const question = await getQuestionById(Number(id));
  if (!question) {
    throw new DBError("Question not found.");
  }
  return updateQuestion(question.id, { isFavorite: !question.isFavorite });
}

export async function queryQuestions(filters = {}) {
  const all = await getAllQuestions();

  return all
    .filter((q) => {
      if (filters.type && !typeMatches(q.type, filters.type)) return false;
      if (filters.category && q.category !== filters.category) return false;
      if (filters.subcategory && q.subcategory !== filters.subcategory) return false;
      if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
      if (typeof filters.isFavorite === "boolean" && q.isFavorite !== filters.isFavorite) return false;
      if (filters.search) {
        const t = filters.search.toLowerCase();
        const haystack = `${q.text} ${q.category} ${q.subcategory}`.toLowerCase();
        if (!haystack.includes(t)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
      if (filters.sort === "difficulty") return a.difficulty.localeCompare(b.difficulty);
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export async function getHierarchy() {
  const all = await getAllQuestions();
  const map = new Map();

  for (const q of all) {
    if (!map.has(q.category)) {
      map.set(q.category, new Set());
    }
    map.get(q.category).add(q.subcategory);
  }

  const result = [];
  for (const [category, subSet] of map.entries()) {
    result.push({ category, subcategories: Array.from(subSet).sort((a, b) => a.localeCompare(b, "tr")) });
  }

  result.sort((a, b) => a.category.localeCompare(b.category, "tr"));
  return result;
}

export async function getRandomQuestion(filters = {}) {
  const list = await queryQuestions(filters);
  if (!list.length) return null;
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

export async function bulkInsertQuestions(items) {
  if (!Array.isArray(items)) {
    throw new DBError("items must be an array.");
  }

  let inserted = 0;
  const errors = [];

  await withStore("readwrite", async (store) => {
    for (let i = 0; i < items.length; i += 1) {
      try {
        const normalized = withTimestamps(validateQuestionInput(items[i]));
        await reqToPromise(store.add(normalized));
        inserted += 1;
      } catch (error) {
        errors.push(`Satir ${i + 1}: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
      }
    }
  });

  return { inserted, failed: errors.length, errors };
}
