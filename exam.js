// Sınav/Exam modülü
export class ExamManager {
  constructor() {
    this.currentExam = null;
    this.examHistory = [];
  }

  createExam(questions, settings = {}) {
    const exam = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      settings: {
        questionCount: settings.questionCount || Math.min(questions.length, 20),
        timeLimit: settings.timeLimit || 0, // dakika, 0 = sınırsız
        randomOrder: settings.randomOrder !== false,
        showAnswerImmediately: settings.showAnswerImmediately || false,
        includeCategories: settings.includeCategories || [],
        includeDifficulty: settings.includeDifficulty || ['easy', 'medium', 'hard']
      },
      questions: this.selectQuestions(questions, settings),
      answers: [],
      startTime: new Date().toISOString(),
      endTime: null,
      score: 0,
      status: 'active' // active, completed, abandoned
    };

    this.currentExam = exam;
    return exam;
  }

  selectQuestions(allQuestions, settings) {
    let filtered = allQuestions;

    // Kategori filtresi
    if (settings.includeCategories && settings.includeCategories.length > 0) {
      filtered = filtered.filter(q => settings.includeCategories.includes(q.category));
    }

    // Zorluk filtresi
    if (settings.includeDifficulty) {
      filtered = filtered.filter(q => settings.includeDifficulty.includes(q.difficulty));
    }

    // Rastgele seçim
    let selected = filtered.sort(() => Math.random() - 0.5);
    const count = settings.questionCount || 20;
    return selected.slice(0, Math.min(count, selected.length));
  }

  submitAnswer(questionIndex, answer) {
    if (!this.currentExam || questionIndex >= this.currentExam.questions.length) {
      throw new Error('Geçersiz sorum indeksi');
    }

    const question = this.currentExam.questions[questionIndex];
    const isCorrect = this.checkAnswer(question, answer);

    this.currentExam.answers[questionIndex] = {
      answer,
      correct: isCorrect,
      submittedAt: new Date().toISOString()
    };

    return isCorrect;
  }

  checkAnswer(question, userAnswer) {
    const correct = String(question.answer).toLowerCase().trim();
    const user = String(userAnswer).toLowerCase().trim();

    if (question.type === 'multiple-choice') {
      // A, B, C, D veya 0, 1, 2, 3 formatını kontrol et
      const userLetter = String.fromCharCode(65 + user.charCodeAt(0) - 65);
      const correctLetter = String.fromCharCode(65 + correct.charCodeAt(0) - 65);
      return userLetter === correctLetter || user === correct;
    }

    return user === correct;
  }

  finishExam() {
    if (!this.currentExam) throw new Error('Aktif sınav yok');

    this.currentExam.endTime = new Date().toISOString();
    this.currentExam.status = 'completed';
    this.currentExam.score = this.calculateScore();

    this.examHistory.push(this.currentExam);
    const completed = this.currentExam;
    this.currentExam = null;

    return completed;
  }

  calculateScore() {
    if (!this.currentExam) return 0;
    const correct = this.currentExam.answers.filter(a => a?.correct).length;
    const total = this.currentExam.questions.length;
    return Math.round((correct / total) * 100);
  }

  getExamStats() {
    if (this.examHistory.length === 0) return null;

    const scores = this.examHistory.map(e => e.score);
    return {
      totalExams: this.examHistory.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b) / scores.length),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      lastExam: this.examHistory[this.examHistory.length - 1]
    };
  }
}

export const examManager = new ExamManager();