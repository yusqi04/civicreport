"use client";

import { useSyncExternalStore } from "react";

function formatRelative(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = now - then;
  const sec = Math.max(0, Math.floor(diffMs / 1000));

  if (sec < 10) return "baru saja";
  if (sec < 60) return `${sec} detik lalu`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;

  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} jam lalu`;

  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} hari lalu`;

  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAbsolute(iso: string, includeTime = false): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

const listeners = new Set<() => void>();
let currentTime = Date.now();
let refreshInterval: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (refreshInterval === null) {
    refreshInterval = setInterval(() => {
      currentTime = Date.now();
      listeners.forEach((notify) => notify());
    }, 30_000);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && refreshInterval !== null) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  };
}

function getSnapshot() {
  return currentTime;
}

function getServerSnapshot(): null {
  return null;
}

export function RelativeTime({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const label = now === null ? formatAbsolute(date) : formatRelative(date, now);
  return (
    <time
      dateTime={date}
      className={className}
      title={formatAbsolute(date, true)}
    >
      {label}
    </time>
  );
}
