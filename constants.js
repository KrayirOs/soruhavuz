// Uygulama genelinde kullanilan sabitler.
// Amac: "open-ended" / "multiple-choice" gibi string'lerin
// kod icinde dagitik halde tekrar tekrar yazilmasini onlemek.
// Bir deger degisecek olursa (or: yeni bir soru tipi eklenirse)
// tek yerden guncellenir.

export const QUESTION_TYPES = Object.freeze({
  OPEN: "open-ended",
  MULTIPLE: "multiple-choice"
});

export const QUESTION_TYPE_LABELS = Object.freeze({
  [QUESTION_TYPES.OPEN]: "Açık Uçlu",
  [QUESTION_TYPES.MULTIPLE]: "Çoktan Seçmeli"
});

export const DIFFICULTY = Object.freeze({
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard"
});

export const DIFFICULTY_LABELS = Object.freeze({
  [DIFFICULTY.EASY]: "Kolay",
  [DIFFICULTY.MEDIUM]: "Orta",
  [DIFFICULTY.HARD]: "Zor"
});

export function isValidQuestionType(type) {
  return Object.values(QUESTION_TYPES).includes(type);
}

export function isValidDifficulty(value) {
  return Object.values(DIFFICULTY).includes(value);
}
