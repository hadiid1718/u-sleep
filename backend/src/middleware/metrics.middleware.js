import { recordMetric } from '../services/metrics.service.js';

const extractModuleName = path => {
  if (!path) return 'unknown';
  const cleanPath = String(path).split('?')[0];

  if (cleanPath.startsWith('/api/v1/')) {
    const remainder = cleanPath.replace('/api/v1/', '');
    const segment = remainder.split('/')[0];
    return segment || 'api';
  }

  if (cleanPath.startsWith('/webhooks')) {
    return 'webhooks';
  }

  return 'public';
};

const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    recordMetric({
      module: extractModuleName(req.originalUrl || req.url),
      durationMs,
      statusCode: res.statusCode,
    });
  });

  next();
};

export default metricsMiddleware;
