// Mensaje de error de un campo de TanStack Form: solo después de que el
// usuario lo tocó, para no marcar en rojo un formulario recién abierto.
export const errorDe = (meta: { isTouched: boolean; errors: unknown[] }): string | undefined =>
  meta.isTouched && meta.errors.length > 0 ? meta.errors.map(String).join(', ') : undefined;
