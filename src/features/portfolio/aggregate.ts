import type { PortfolioItem } from './types'

export interface PortfolioItemStatus {
  item: PortfolioItem
  capitalInvertido: number
  gananciaPerdida: number
  gananciaPct: number
}

// capital invertido = quantity * purchase_price (precio unitario de compra).
// current_value es el valor TOTAL actual de la posicion (no unitario), asi
// que la ganancia sale directo de la resta, sin volver a multiplicar por
// quantity.
export function computePortfolioItemStatus(item: PortfolioItem): PortfolioItemStatus {
  const capitalInvertido = item.quantity * item.purchase_price
  const gananciaPerdida = item.current_value - capitalInvertido
  return {
    item,
    capitalInvertido,
    gananciaPerdida,
    gananciaPct: capitalInvertido > 0 ? (gananciaPerdida / capitalInvertido) * 100 : 0,
  }
}

export interface PortfolioSummary {
  capitalInvertido: number
  valorActual: number
  gananciaPerdida: number
  gananciaPct: number
}

export function computePortfolioSummary(statuses: PortfolioItemStatus[]): PortfolioSummary {
  const capitalInvertido = statuses.reduce((sum, s) => sum + s.capitalInvertido, 0)
  const valorActual = statuses.reduce((sum, s) => sum + s.item.current_value, 0)
  const gananciaPerdida = valorActual - capitalInvertido
  return {
    capitalInvertido,
    valorActual,
    gananciaPerdida,
    gananciaPct: capitalInvertido > 0 ? (gananciaPerdida / capitalInvertido) * 100 : 0,
  }
}
