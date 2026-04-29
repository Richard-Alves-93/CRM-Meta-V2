import { Request, Response } from "express";
import os from "os";
import { promisify } from "util";
import { execFile } from "child_process";
import cache from "../libs/cache";

const execFileAsync = promisify(execFile);

const CACHE_TTL_MS = 1500; // Reduzido para 1.5s para tempo real

let cachedPayload: any = null;
let cachedAt = 0;
let inflight: Promise<any> | null = null;

const formatBytes = (bytes: number): number => {
  if (!Number.isFinite(bytes) || bytes < 0) return 0;
  return bytes;
};

const parseDfK = (stdout: string) => {
  const lines = String(stdout || "")
    .trim()
    .split("\n")
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      filesystem: "-",
      total: 0,
      used: 0,
      free: 0,
      usedPercent: 0,
      mount: "/"
    };
  }

  const row = lines[lines.length - 1].trim().split(/\s+/);
  const filesystem = row[0] || "-";
  const totalKb = Number(row[1] || 0);
  const usedKb = Number(row[2] || 0);
  const freeKb = Number(row[3] || 0);
  const usedPercent = Number(String(row[4] || "0").replace("%", "")) || 0;
  const mount = row[5] || "/";

  return {
    filesystem,
    total: totalKb * 1024,
    used: usedKb * 1024,
    free: freeKb * 1024,
    usedPercent,
    mount
  };
};

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

const getRedisStatus = async () => {
  try {
    const redis = cache.getRedisInstance();
    const pong = await withTimeout(redis.ping(), 1200);
    return {
      status: pong === "PONG" ? "online" : "degraded",
      response: pong || "-"
    };
  } catch {
    return {
      status: "offline",
      response: "unreachable"
    };
  }
};

const getDiskUsage = async () => {
  try {
    const { stdout } = await withTimeout(execFileAsync("df", ["-kP", "/"]), 1800);
    return parseDfK(stdout);
  } catch {
    return {
      filesystem: "-",
      total: 0,
      used: 0,
      free: 0,
      usedPercent: 0,
      mount: "/"
    };
  }
};

const collectMetrics = async () => {
  const now = Date.now();

  if (cachedPayload && now - cachedAt < CACHE_TTL_MS) {
    return cachedPayload;
  }

  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    const [disk, redis] = await Promise.all([getDiskUsage(), getRedisStatus()]);

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = Math.max(totalMem - freeMem, 0);
    const cpus = os.cpus() || [];

    const payload = {
      status: "online",
      serverTime: new Date().toISOString(),
      uptimeSeconds: os.uptime(),
      processUptimeSeconds: process.uptime(),
      general: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        nodeVersion: process.version,
        pid: process.pid
      },
      memory: {
        total: formatBytes(totalMem),
        used: formatBytes(usedMem),
        free: formatBytes(freeMem),
        usedPercent: totalMem > 0 ? Number(((usedMem / totalMem) * 100).toFixed(2)) : 0
      },
      cpu: {
        model: cpus[0]?.model || "-",
        cores: cpus.length,
        loadAverage1m: os.loadavg()[0] || 0,
        loadAverage5m: os.loadavg()[1] || 0,
        loadAverage15m: os.loadavg()[2] || 0
      },
      disk,
      redis,
      collectedAt: new Date().toISOString(),
      cacheTtlMs: CACHE_TTL_MS
    };

    cachedPayload = payload;
    cachedAt = Date.now();
    inflight = null;

    return payload;
  })().catch((error) => {
    inflight = null;
    throw error;
  });

  return inflight;
};

export const collectMetricsForSocket = async () => {
  return collectMetrics();
};

export const index = async (_req: Request, res: Response): Promise<Response> => {
  const metrics = await collectMetrics();
  return res.status(200).json(metrics);
};
