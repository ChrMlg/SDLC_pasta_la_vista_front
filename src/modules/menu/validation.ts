import type { Values } from './api';

export function validateMenuForm(values: Values) {
  const errors: Record<string, string> = {};
  const name = values.name.trim().replace(/\s+/gu, ' ');
  if (name.length < 2 || name.length > 80) errors.name = 'El nombre debe tener entre 2 y 80 caracteres';
  if (values.description.length > 300) errors.description = 'Máximo 300 caracteres';
  if (!values.category) errors.category = 'Seleccione una categoría';
  if (!/^(?:0|[1-9]\d{0,4})(?:\.\d{1,2})?$/.test(values.price) || Number(values.price) < 0.01 || Number(values.price) > 99999.99)
    errors.price = 'Ingrese un precio de $0.01 a $99,999.99 con hasta dos decimales';
  return errors;
}
