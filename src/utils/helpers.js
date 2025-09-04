// src/utils/helpers.js
// Minimal utilities: sanitization, validation, and debounce (no deps)

// Escapes HTML special characters for safe text rendering
export function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[ch]);
}

// Basic input sanitization: trims, normalizes whitespace, and strips control chars
export function sanitizeInput(str = '', maxLen = 500) {
  const s = String(str);
  // Remove ASCII control characters without using control-char regex (lint-safe)
  let noCtl = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code >= 32 && code !== 127) noCtl += s[i];
  }
  const collapsed = noCtl.replace(/\s{2,}/g, ' ').trim();
  return collapsed.slice(0, maxLen);
}

// Simple validations
export const isNonEmpty = (v) => typeof v === 'string' ? v.trim().length > 0 : v != null;
export const maxLength = (v = '', n = 500) => String(v).length <= n;

// Debounce (vanilla): returns a debounced function with cancel/flush
export function debounce(fn, delay = 300) {
  let timer = null;
  let lastArgs = null;
  let lastThis = null;

  const debounced = function(...args) {
    lastArgs = args;
    lastThis = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(lastThis, lastArgs);
    }, delay);
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer);
      const args = lastArgs;
      const ctx = lastThis;
      timer = null;
      fn.apply(ctx, args);
    }
  };

  return debounced;
}

// React hook variant that cleans up on unmount
// Usage: const saveLater = useDebouncedCallback(saveFn, 500);
import { useEffect, useRef, useMemo } from 'react';
export function useDebouncedCallback(fn, delay = 300) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timerRef = useRef(null);

  const api = useMemo(() => {
    const call = (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        fnRef.current(...args);
      }, delay);
    };
    call.cancel = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    call.flush = (...args) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        fnRef.current(...args);
      }
    };
    return call;
  }, [delay]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return api;
}
