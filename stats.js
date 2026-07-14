// İstatistikler modülü
import { QUESTION_TYPES, DIFFICULTY } from "./constants.js";

export class StatsManager {
  constructor() {
    this.stats = new Map();
  }

  async calculateStats(questions) {
    const stats = {
      total: questions.length,
      favorite: questions.filter(q => q.isFavorite).length,
      today: 0,
      week: 0,
      month: 0,
      byCategory: new Map(),
      byDifficulty: {
        [DIFFICULTY.EASY]: 0,
        [DIFFICULTY.MEDIUM]: 0,
        [DIFFICULTY.HARD]: 0
      },
      byType: {
        [QUESTION_TYPES.OPEN]: 0,
        [QUESTION_TYPES.MULTIPLE]: 0
      },
      successRate: 0,
      averageReviewCount: 0,
      overdue: 0
    };

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let totalReviews = 0;
    let correctReviews = 0;

    for (const q of questions) {
      // Kategori istatistikleri
      if (!stats.byCategory.has(q.category)) {
        stats.byCategory.set(q.category, { total: 0, correct: 0, failed: 0 });
      }
      const catStats = stats.byCategory.get(q.category);
      catStats.total++;
      if (q.lastResult === 'correct') catStats.correct++;
      if (q.lastResult === 'wrong') catStats.failed++;

      // Zorluk ve tip
      stats.byDifficulty[q.difficulty]++;
      stats.byType[q.type]++;

      // Tarih bazlı
      const createdDate = q.createdAt?.split('T')[0];
      if (createdDate === today) stats.today++;
      if (createdDate >= weekAgo) stats.week++;
      if (createdDate >= monthAgo) stats.month++;

      // Tekrar istatistikleri
      if (q.reviewCount) {
        totalReviews += q.reviewCount;
        if (q.lastResult === 'correct') correctReviews++;
      }

      // Gecikmiş sorular
      if (q.nextReviewDate && q.nextReviewDate < today) {
        stats.overdue++;
      }
    }

    stats.averageReviewCount = questions.length > 0 ? totalReviews / questions.length : 0;
    stats.successRate = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0;

    return stats;
  }

  getCategoryStats(stats) {
    return Array.from(stats.byCategory.entries()).map(([name, data]) => ({
      name,
      total: data.total,
      correct: data.correct,
      failed: data.failed,
      successRate: data.total > 0 ? (data.correct / data.total) * 100 : 0
    }));
  }

  getProgressData(questions, days = 7) {
    const data = {};
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      data[dateStr] = { added: 0, reviewed: 0 };
    }

    for (const q of questions) {
      const createdDate = q.createdAt?.split('T')[0];
      if (createdDate && data[createdDate]) {
        data[createdDate].added++;
      }
      const reviewedDate = q.lastReviewedAt?.split('T')[0];
      if (reviewedDate && data[reviewedDate]) {
        data[reviewedDate].reviewed++;
      }
    }

    return Object.entries(data).map(([date, counts]) => ({
      date: new Date(date).toLocaleDateString('tr-TR', { weekday: 'short', month: 'short', day: 'numeric' }),
      added: counts.added,
      reviewed: counts.reviewed
    }));
  }
}

export const statsManager = new StatsManager();