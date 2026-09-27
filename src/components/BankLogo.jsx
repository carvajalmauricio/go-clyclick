import deuna from '../../logos-bancarios/deunalogo.png'
import guayaquil from '../../logos-bancarios/logo-guayaquil.jpg'
import produbanco from '../../logos-bancarios/logo-produbanco.jpg'
import pacifico from '../../logos-bancarios/logo-pacifico.jpg'
import pichincha from '../../logos-bancarios/Banco-Pichincha.png'

const logos = { deuna, guayaquil, produbanco, pacifico, pichincha }

const BANK_NAMES = {
  deuna: 'Deuna',
  guayaquil: 'Banco Guayaquil',
  produbanco: 'Produbanco',
  pacifico: 'Banco del Pacífico',
  pichincha: 'Banco Pichincha',
}

export default function BankLogo({ bank, label }) {
  return <img src={logos[bank]} alt={label || BANK_NAMES[bank] || bank || ''} className="h-10 w-14 shrink-0 rounded-lg bg-white object-contain" />
}
