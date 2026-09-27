// Color de la descripción del hero. Con modo claro/oscuro automático (#16), un
// color fijo elegido para un modo puede fallar el contraste en el otro; por eso
// bajo autoTheme se ignora descriptionColor y se usa theme.subtext, que sí se
// adapta al tema activo. Sin autoTheme se respeta el color fijo del comerciante.
// Helper puro (sin DOM) para poder testearlo de forma aislada.
export function descriptionColor(business, theme) {
  if (business?.autoTheme) return theme.subtext
  return business?.descriptionColor || theme.subtext
}
