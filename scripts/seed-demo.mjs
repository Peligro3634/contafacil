// Seed de datos de ejemplo para poder visualizar la app sin cargar todo a
// mano: crea (o reutiliza) un usuario demo con un grupo de familia, un
// ingreso fijo de empleado y un emprendimiento personal con capital, ventas
// y costos de los últimos 3 meses.
//
// Re-corrible: cada corrida borra y vuelve a cargar las fuentes de ingreso
// PERSONALES del usuario demo (sueldo + emprendimiento, con sus entries,
// investments y business_expenses en cascada) para dejar un estado limpio.
// El grupo de familia se reutiliza si ya existe, porque `groups` no tiene
// policy de delete en la app (no hay forma de borrarlo desde el cliente).
//
// Requiere VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env, y que
// "Confirm email" esté desactivado en Supabase Auth (si no, el signup no
// devuelve sesión y hay que confirmarlo a mano antes de re-correr esto).
//
// Uso: node scripts/seed-demo.mjs

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const DEMO_EMAIL = 'demo@contafacil.test'
const DEMO_PASSWORD = 'Demo1234!'
const DEMO_NAME = 'Usuario Demo'

loadEnvFile('.env')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

function loadEnvFile(path) {
  let content
  try {
    content = readFileSync(path, 'utf8')
  } catch {
    return
  }
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

function monthKey(offsetMonths) {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function dateKey(offsetMonths, day) {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() + offsetMonths, day)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function ensureDemoSession() {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    options: { data: { name: DEMO_NAME } },
  })

  if (!signUpError && signUpData.session) {
    console.log('Usuario demo creado.')
    return signUpData.session
  }

  console.log(
    signUpError
      ? `signUp no devolvió sesión (${signUpError.message}), intentando iniciar sesión...`
      : 'El usuario demo ya existía, iniciando sesión...',
  )

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })
  if (signInError || !signInData.session) {
    throw new Error(
      `No se pudo autenticar al usuario demo (signUp: ${signUpError?.message ?? 'sin sesión'}; ` +
        `signIn: ${signInError?.message ?? 'sin sesión'}). Si "Confirm email" está activado en Supabase, ` +
        'desactivalo (Authentication > Sign In / Providers > Email) y volvé a correr el script.',
    )
  }
  return signInData.session
}

async function resetPersonalIncomeSources(userId) {
  const { data: existing, error: fetchError } = await supabase
    .from('income_sources')
    .select('id')
    .eq('owner_type', 'user')
    .eq('owner_id', userId)
  if (fetchError) throw fetchError

  if (existing.length > 0) {
    const { error: deleteError } = await supabase
      .from('income_sources')
      .delete()
      .in(
        'id',
        existing.map((s) => s.id),
      )
    if (deleteError) throw deleteError
    console.log(`Borradas ${existing.length} fuente(s) de ingreso personales previas (y sus datos asociados).`)
  }
}

async function ensureFamilyGroup(userId) {
  const { data: existingGroups, error: fetchError } = await supabase.from('groups').select('*').eq('name', 'Familia Demo')
  if (fetchError) throw fetchError

  const mine = existingGroups.find((g) => g.created_by === userId)
  if (mine) {
    console.log('Grupo "Familia Demo" ya existía, lo reutilizo.')
    return mine
  }

  const { data: group, error } = await supabase.rpc('create_group', { p_name: 'Familia Demo', p_type: 'familia' })
  if (error) throw error
  console.log('Grupo "Familia Demo" creado.')
  return group
}

async function seedSueldoFijo(userId) {
  const { data: source, error } = await supabase
    .from('income_sources')
    .insert({ owner_type: 'user', owner_id: userId, type: 'empleado_fijo', name: 'Sueldo Empresa Demo S.A.' })
    .select()
    .single()
  if (error) throw error

  const entries = [
    { offset: -2, day: 1, base_amount: 850000, extra_amount: 0, note: 'Sueldo mensual' },
    { offset: -1, day: 1, base_amount: 850000, extra_amount: 40000, note: 'Sueldo + bono' },
    { offset: 0, day: 1, base_amount: 900000, extra_amount: 0, note: 'Sueldo mensual' },
  ]

  for (const entry of entries) {
    const { error: entryError } = await supabase.from('income_entries').insert({
      income_source_id: source.id,
      date: dateKey(entry.offset, entry.day),
      base_amount: entry.base_amount,
      extra_amount: entry.extra_amount,
      units_sold: null,
      note: entry.note,
    })
    if (entryError) throw entryError
  }

  console.log('Ingreso fijo de empleado cargado (3 meses).')
}

async function seedEmprendimiento(userId) {
  const { data: source, error } = await supabase
    .from('income_sources')
    .insert({
      owner_type: 'user',
      owner_id: userId,
      type: 'monotributo',
      name: 'Feria de Artesanías',
      product_mode: 'simple',
    })
    .select()
    .single()
  if (error) throw error

  const { error: investmentError } = await supabase.from('investments').insert({
    income_source_id: source.id,
    date: dateKey(-3, 15),
    amount: 300000,
    note: 'Capital inicial: stock + mesa de feria',
  })
  if (investmentError) throw investmentError

  const monthly = [
    { offset: -2, ventas: 80000, costoMercaderia: 32000, gastoOperativo: 8000 },
    { offset: -1, ventas: 95000, costoMercaderia: 38000, gastoOperativo: 8000 },
    { offset: 0, ventas: 60000, costoMercaderia: 24000, gastoOperativo: 8000 },
  ]

  for (const m of monthly) {
    const { error: entryError } = await supabase.from('income_entries').insert({
      income_source_id: source.id,
      date: dateKey(m.offset, 10),
      base_amount: m.ventas,
      extra_amount: 0,
      units_sold: null,
      note: 'Ventas de la feria',
    })
    if (entryError) throw entryError

    const { error: costoError } = await supabase.from('business_expenses').insert({
      income_source_id: source.id,
      type: 'costo_mercaderia',
      category: 'Insumos',
      month: monthKey(m.offset),
      amount: m.costoMercaderia,
    })
    if (costoError) throw costoError

    const { error: gastoError } = await supabase.from('business_expenses').insert({
      income_source_id: source.id,
      type: 'gasto_operativo',
      category: 'Puesto/traslado',
      month: monthKey(m.offset),
      amount: m.gastoOperativo,
    })
    if (gastoError) throw gastoError
  }

  console.log('Emprendimiento "Feria de Artesanías" cargado (capital + 3 meses de ventas/costos).')
}

async function main() {
  const session = await ensureDemoSession()
  const userId = session.user.id

  await resetPersonalIncomeSources(userId)
  await ensureFamilyGroup(userId)
  await seedSueldoFijo(userId)
  await seedEmprendimiento(userId)

  console.log('\nListo. Iniciá sesión en la app con:')
  console.log(`  email: ${DEMO_EMAIL}`)
  console.log(`  contraseña: ${DEMO_PASSWORD}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nError al seedear datos de demo:', err.message ?? err)
    process.exit(1)
  })
