import { useEffect, useState } from 'react';

// Devuelve el valor recién cuando dejó de cambiar durante `demoraMs`.
// Evita pedir el catálogo al servidor en cada tecla de la búsqueda.
// (No obtiene datos: solo retrasa un valor; la consulta la hace TanStack Query.)
export function useDebounce<T>(valor: T, demoraMs = 350): T {
  const [demorado, setDemorado] = useState(valor);
  useEffect(() => {
    const temporizador = setTimeout(() => setDemorado(valor), demoraMs);
    return () => clearTimeout(temporizador);
  }, [valor, demoraMs]);
  return demorado;
}
