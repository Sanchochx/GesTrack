import { useEffect, useRef } from 'react';

/**
 * US-REP-001 CA-4: Actualización periódica de métricas del dashboard.
 * Reintenta cada `intervalMs` y refresca inmediatamente al volver a la pestaña,
 * pausando el intervalo mientras la pestaña está oculta (evita llamadas innecesarias).
 *
 * @param {Function} callback - función a invocar en cada refresco (no debe cambiar en cada render)
 * @param {number} intervalMs - intervalo en milisegundos (default 60s)
 * @param {boolean} enabled - permite desactivar el polling condicionalmente
 */
const usePolling = (callback, intervalMs = 60000, enabled = true) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return undefined;

    const intervalId = setInterval(() => {
      if (!document.hidden) callbackRef.current();
    }, intervalMs);

    const handleVisibility = () => {
      if (!document.hidden) callbackRef.current();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [intervalMs, enabled]);
};

export default usePolling;
