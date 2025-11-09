/**
 * Custom Hook para recibir actualizaciones de stock en tiempo real
 *
 * US-INV-001 CA-3: Sincronización en Tiempo Real
 *
 * Este hook se conecta al servidor WebSocket y escucha eventos de
 * actualización de stock, permitiendo que las vistas se actualicen
 * automáticamente sin necesidad de refrescar la página.
 */
import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

let socket = null;

export const useStockUpdates = (onStockUpdate) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Crear conexión WebSocket solo si no existe
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      // Evento de conexión
      socket.on('connect', () => {
        setIsConnected(true);
      });

      // Evento de desconexión
      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      // Evento de confirmación de conexión
      socket.on('connected', (data) => {
        // Conexión confirmada
      });
    }

    // Listener para actualizaciones de stock
    const handleStockUpdate = (data) => {
      setLastUpdate({
        ...data,
        timestamp: new Date()
      });

      // Llamar al callback si existe
      if (onStockUpdate && typeof onStockUpdate === 'function') {
        onStockUpdate(data);
      }
    };

    socket.on('stock_updated', handleStockUpdate);

    // Cleanup: remover solo el listener específico, no cerrar el socket
    return () => {
      socket.off('stock_updated', handleStockUpdate);
    };
  }, [onStockUpdate]);

  // Función para suscribirse a un producto específico
  const subscribeToProduct = useCallback((productId) => {
    if (socket && isConnected) {
      socket.emit('subscribe_product', { product_id: productId });
    }
  }, [isConnected]);

  // Función para desconectar manualmente (solo usar cuando sea necesario)
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }, []);

  return {
    isConnected,
    lastUpdate,
    subscribeToProduct,
    disconnect
  };
};

/**
 * Hook simplificado que solo indica si hay conexión con el servidor
 */
export const useStockConnection = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });
    }

    return () => {
      // No cerrar el socket aquí, solo actualizar el estado
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
      }
    };
  }, []);

  return { isConnected };
};

export default useStockUpdates;
