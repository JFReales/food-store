import { Link } from 'react-router-dom';
import { Card } from '../../../shared/ui/Card';

export function UnauthorizedPage() {
  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <p className="text-5xl">🔒</p>
      <h1 className="mt-3 text-2xl font-bold text-stone-900">Sin permiso</h1>
      <p className="mt-2 text-stone-600">Tu usuario no tiene acceso a esta sección.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
      >
        Volver al inicio
      </Link>
    </Card>
  );
}
