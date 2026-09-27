import assert from 'node:assert/strict'
import test from 'node:test'
import { buildVCard } from '../src/utils/vcard.js'

function unfoldedLines(card) {
  assert.ok(card.endsWith('\r\n'))
  const physical = card.slice(0, -2).split('\r\n')
  for (const line of physical) assert.ok(new TextEncoder().encode(line).length <= 75)
  return card.replace(/\r\n /g, '').trimEnd().split('\r\n')
}

test('vCard 3.0 contiene los campos obligatorios y conserva UTF-8, escapes y números', () => {
  const card = buildVCard({
    name: 'Café Ñandú, S.A.; Quito',
    category: 'Restaurante',
    phone: '+593 99 123 4567',
    whatsapp: '+593991234567',
    email: 'hola@example.com',
    website: 'ejemplo.com/contacto',
    description: 'Menú de temporada, platos; bebidas\r\nReserva aquí. '.repeat(4),
  })
  const lines = unfoldedLines(card)
  assert.equal(lines[0], 'BEGIN:VCARD')
  assert.equal(lines[1], 'VERSION:3.0')
  assert.equal(lines.at(-1), 'END:VCARD')
  assert.ok(lines.includes('N:Café Ñandú\\, S.A.\\; Quito;;;;'))
  assert.ok(lines.includes('FN:Café Ñandú\\, S.A.\\; Quito'))
  assert.ok(lines.includes('ORG:Café Ñandú\\, S.A.\\; Quito'))
  assert.ok(lines.includes('TEL;TYPE=CELL:+593 99 123 4567'))
  assert.equal(lines.filter((line) => line.startsWith('TEL;')).length, 1)
  assert.ok(lines.includes('EMAIL:hola@example.com'))
  assert.ok(lines.includes('URL:https://ejemplo.com/contacto'))
  assert.ok(lines.some((line) => line.startsWith('NOTE:Menú de temporada\\, platos\\; bebidas\\nReserva aquí.')))
  assert.equal(card.includes('\r\nReserva aquí'), false)
})

test('usa teléfono de WhatsApp cuando no hay otro y admite un segundo número distinto', () => {
  const onlyWhatsApp = unfoldedLines(buildVCard({ name: 'Negocio', whatsapp: '+593999999999' }))
  assert.ok(onlyWhatsApp.includes('TEL;TYPE=WORK:+593999999999'))
  const twoNumbers = unfoldedLines(buildVCard({ name: 'Negocio', phone: '+5932111111', whatsapp: '+593999999999' }))
  assert.equal(twoNumbers.filter((line) => line.startsWith('TEL;')).length, 2)
})
