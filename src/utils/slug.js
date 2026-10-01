// Convierte un texto en un slug seguro para URL: "Pizzería Napolí!" -> "pizzeria-napoli"
// Compartido por el servidor (functions/api/_lib.js) y el navegador (vista
// previa de la dirección en la página de inicio).
export function slugify(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // solo alfanumérico, espacios y guiones
    .replace(/\s+/g, '-') // espacios -> guiones
    .replace(/-+/g, '-') // colapsa guiones repetidos
    .replace(/^-|-$/g, '') // sin guiones al inicio/fin
}
