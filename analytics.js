// Analytics tracking helper

export async function trackEvent(eventName, data = {}) {
  const event = {
    name: eventName,
    timestamp: new Date().toISOString(),
    data
  };

  try {
    let events = JSON.parse(localStorage.getItem("analytics_events") || "[]");
    events.push(event);

    // Son 1000 event'i tut
    if (events.length > 1000) events = events.slice(-1000);
    localStorage.setItem("analytics_events", JSON.stringify(events));
  } catch (error) {
    console.warn("Analytics tracking failed:", error);
  }
}

export function getAnalytics() {
  try {
    const events = JSON.parse(localStorage.getItem("analytics_events") || "[]");
    const byType = events.reduce((acc, e) => {
      acc[e.name] = (acc[e.name] ?? 0) + 1;
      return acc;
    }, {});

    return {
      totalEvents: events.length,
      byType,
      recentEvents: events.slice(-10),
      firstEvent: events[0],
      lastEvent: events[events.length - 1]
    };
  } catch (error) {
    console.warn("Analytics retrieval failed:", error);
    return null;
  }
}

export function clearAnalytics() {
  try {
    localStorage.removeItem("analytics_events");
  } catch (error) {
    console.warn("Analytics clear failed:", error);
  }
}
