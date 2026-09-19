// Ruta protegida por la aplicación de Cloudflare Access configurada en /admin.
// La implementación se comparte con la ruta heredada /api/upload, que sigue
// exigiendo autenticación y por tanto no queda expuesta públicamente.
export { onRequestPost } from '../../api/upload.js'
