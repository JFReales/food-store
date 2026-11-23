import axios from 'axios';

// Convierte un error de la API en un mensaje para mostrar en pantalla.
// FastAPI responde { detail: "texto" } (400, 401, 403, 404, 409) o
// { detail: [{ loc, msg }] } en los 422 de validación.
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Verificá que el backend esté en ejecución.';
    }
    const datos: unknown = error.response.data;
    if (typeof datos === 'object' && datos !== null && 'detail' in datos) {
      const { detail } = datos;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        const mensajes = detail
          .map((item: unknown) =>
            typeof item === 'object' && item !== null && 'msg' in item ? String(item.msg) : '',
          )
          .filter(Boolean);
        if (mensajes.length > 0) return `Datos inválidos: ${mensajes.join('. ')}`;
      }
    }
    return `Error ${error.response.status} al comunicarse con el servidor`;
  }
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado';
};

export const esErrorCliente = (error: unknown): boolean =>
  axios.isAxiosError(error) &&
  error.response !== undefined &&
  error.response.status >= 400 &&
  error.response.status < 500;
