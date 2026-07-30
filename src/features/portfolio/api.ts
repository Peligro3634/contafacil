import { supabase } from '@/lib/supabase'
import type { PortfolioItem, PortfolioItemInput } from './types'

export async function fetchPortfolio(): Promise<PortfolioItem[]> {
  const { data, error } = await supabase
    .from('investment_portfolio')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createPortfolioItem(userId: string, input: PortfolioItemInput): Promise<PortfolioItem> {
  const { data, error } = await supabase
    .from('investment_portfolio')
    .insert({ user_id: userId, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePortfolioItem(id: string, input: PortfolioItemInput): Promise<PortfolioItem> {
  const { data, error } = await supabase
    .from('investment_portfolio')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Atajo para la accion mas frecuente (carga manual de valor actualizado):
// pisa solo current_value sin tocar cantidad/precio de compra/etc.
export async function updatePortfolioValue(id: string, currentValue: number): Promise<PortfolioItem> {
  const { data, error } = await supabase
    .from('investment_portfolio')
    .update({ current_value: currentValue, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePortfolioItem(id: string): Promise<void> {
  const { error } = await supabase.from('investment_portfolio').delete().eq('id', id)
  if (error) throw error
}
