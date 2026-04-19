const moduleStats = new Map();

const ensureModule = name => {
  if (!moduleStats.has(name)) {
    moduleStats.set(name, {
      name,
      requests: 0,
      errors: 0,
      totalDurationMs: 0,
      lastStatusCode: null,
      lastDurationMs: null,
      lastRequestAt: null,
    });
  }

  return moduleStats.get(name);
};

const computeHealthStatus = stats => {
  if (!stats || stats.requests === 0) return 'idle';

  const avgMs = stats.totalDurationMs / Math.max(1, stats.requests);
  const errorRate = stats.errors / Math.max(1, stats.requests);

  if (stats.lastStatusCode >= 500) return 'down';
  if (errorRate >= 0.25) return 'degraded';
  if (avgMs >= 2000) return 'slow';
  return 'healthy';
};

export const recordMetric = ({ module, durationMs, statusCode }) => {
  const name = module || 'unknown';
  const stats = ensureModule(name);
  stats.requests += 1;
  stats.totalDurationMs += Number(durationMs) || 0;
  stats.lastStatusCode = statusCode || null;
  stats.lastDurationMs = Number(durationMs) || 0;
  stats.lastRequestAt = new Date();
  if (statusCode >= 500) stats.errors += 1;
};

export const getMetricsSnapshot = () => {
  const snapshot = [];

  for (const stats of moduleStats.values()) {
    const avgMs =
      stats.requests > 0 ? stats.totalDurationMs / stats.requests : 0;
    const errorRate =
      stats.requests > 0 ? stats.errors / stats.requests : 0;

    snapshot.push({
      name: stats.name,
      requests: stats.requests,
      errors: stats.errors,
      errorRate,
      avgResponseMs: Math.round(avgMs),
      lastStatusCode: stats.lastStatusCode,
      lastDurationMs: stats.lastDurationMs,
      lastRequestAt: stats.lastRequestAt
        ? stats.lastRequestAt.toISOString()
        : null,
      health: computeHealthStatus(stats),
    });
  }

  return snapshot;
};

export const getMetricsSummary = () => {
  const stats = getMetricsSnapshot();
  const totalRequests = stats.reduce((sum, item) => sum + item.requests, 0);
  const totalErrors = stats.reduce((sum, item) => sum + item.errors, 0);

  return {
    totalRequests,
    totalErrors,
    modulesTracked: stats.length,
  };
};
