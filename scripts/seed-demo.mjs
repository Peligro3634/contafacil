// Seed de datos de ejemplo para poder visualizar TODA la app sin cargar
// nada a mano: dos usuarios demo (uno principal + un "compañero" que se une
// al mismo grupo, para poder mostrar deudas entre miembros) con:
//   - ingreso fijo de empleado + emprendimiento personal (Fases 1/3)
//   - gastos fijos (alquiler/internet) y gastos variables random (Fase 1)
//   - tarjeta de credito con compras en pago unico y en cuotas (Fase 2)
//   - meta de ahorro personal con aportes (Fase 4)
//   - cartera de inversiones (Fase 7)
//   - grupo de familia con meta compartida, fondo comun y gastos (con y sin
//     reparto entre miembros, para ver el resumen de deudas) (Fase 5)
//
// Re-corrible: cada corrida borra y vuelve a cargar TODOS los datos
// PERSONALES del usuario principal (fuentes de ingreso, gastos fijos/
// variables, tarjetas, metas, cartera — todo con cascada a lo que dependa
// de eso) para dejar un estado limpio. Los datos de GRUPO se siembran una
// sola vez (si el grupo ya tiene una meta cargada, se asume que ya está
// poblado y no se duplica) porque `groups`/`group_goals` no tienen forma de
// resetearse limpiamente desde el cliente en todos los casos.
//
// Requiere VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env, y que
// "Confirm email" esté desactivado en Supabase Auth (si no, el signup no
// devuelve sesión y hay que confirmarlo a mano antes de re-correr esto).
//
// Uso: node scripts/seed-demo.mjs

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const DEMO_PASSWORD = 'Demo1234!'
const USER1 = { email: 'demo@contafacil.test', name: 'Usuario Demo' }
const USER2 = { email: 'demo2@contafacil.test', name: 'Compañera Demo' }

loadEnvFile('.env')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env')
}

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

function randomAmount(min, max) {
  return Math.round((min + Math.random() * (max - min)) / 100) * 100
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)]
}

// Cada usuario demo necesita su propio cliente: supabase-js ata la sesion
// de auth a la instancia del cliente, asi que dos sesiones simultaneas
// (usuario principal + compañero de grupo) necesitan dos instancias.
async function ensureDemoSession(user) {
  const client = createClient(supabaseUrl, supabaseAnonKey)

  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email: user.email,
    password: DEMO_PASSWORD,
    options: { data: { name: user.name } },
  })

  if (!signUpError && signUpData.session) {
    console.log(`Usuario demo ${user.email} creado.`)
    return { client, userId: signUpData.session.user.id }
  }

  console.log(
    signUpError
      ? `signUp de ${user.email} no devolvió sesión (${signUpError.message}), intentando iniciar sesión...`
      : `El usuario demo ${user.email} ya existía, iniciando sesión...`,
  )

  const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email: user.email,
    password: DEMO_PASSWORD,
  })
  if (signInError || !signInData.session) {
    throw new Error(
      `No se pudo autenticar a ${user.email} (signUp: ${signUpError?.message ?? 'sin sesión'}; ` +
        `signIn: ${signInError?.message ?? 'sin sesión'}). Si "Confirm email" está activado en Supabase, ` +
        'desactivalo (Authentication > Sign In / Providers > Email) y volvé a correr el script.',
    )
  }
  return { client, userId: signInData.session.user.id }
}

async function resetPersonalData(client, userId) {
  const tables = [
    { name: 'income_sources', filter: { owner_type: 'user', owner_id: userId } },
    { name: 'fixed_expenses', filter: { user_id: userId } },
    { name: 'variable_expenses', filter: { user_id: userId } },
    { name: 'savings_goals', filter: { user_id: userId } },
    { name: 'investment_portfolio', filter: { user_id: userId } },
    { name: 'credit_cards', filter: { user_id: userId } },
  ]

  for (const table of tables) {
    const { data: existing, error: fetchError } = await client.from(table.name).select('id').match(table.filter)
    if (fetchError) throw fetchError
    if (existing.length === 0) continue

    const { error: deleteError } = await client
      .from(table.name)
      .delete()
      .in('id', existing.map((row) => row.id))
    if (deleteError) throw deleteError
    console.log(`Borrados ${existing.length} registro(s) previos de ${table.name}.`)
  }
}

async function ensureFamilyGroup(client, userId) {
  const { data: existingGroups, error: fetchError } = await client.from('groups').select('*').eq('name', 'Familia Demo')
  if (fetchError) throw fetchError

  const mine = existingGroups.find((g) => g.created_by === userId)
  if (mine) {
    console.log('Grupo "Familia Demo" ya existía, lo reutilizo.')
    return mine
  }

  const { data: group, error } = await client.rpc('create_group', { p_name: 'Familia Demo', p_type: 'familia' })
  if (error) throw error
  console.log('Grupo "Familia Demo" creado.')
  return group
}

async function ensureGroupMember(client, inviteCode) {
  const { data: group, error } = await client.rpc('join_group_by_code', { p_invite_code: inviteCode })
  if (error) throw error
  return group
}

async function seedSueldoFijo(client, userId) {
  const { data: source, error } = await client
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
    const { error: entryError } = await client.from('income_entries').insert({
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

async function seedEmprendimiento(client, userId) {
  const { data: source, error } = await client
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

  const { error: investmentError } = await client.from('investments').insert({
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
    const { error: entryError } = await client.from('income_entries').insert({
      income_source_id: source.id,
      date: dateKey(m.offset, 10),
      base_amount: m.ventas,
      extra_amount: 0,
      units_sold: null,
      note: 'Ventas de la feria',
    })
    if (entryError) throw entryError

    const { error: costoError } = await client.from('business_expenses').insert({
      income_source_id: source.id,
      type: 'costo_mercaderia',
      category: 'Insumos',
      month: monthKey(m.offset),
      amount: m.costoMercaderia,
    })
    if (costoError) throw costoError

    const { error: gastoError } = await client.from('business_expenses').insert({
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

async function seedGastosFijos(client, userId) {
  const fixedExpenses = [
    { name: 'Alquiler', amounts: [350000, 350000, 380000] },
    { name: 'Internet', amounts: [15000, 15000, 16500] },
  ]

  for (const fe of fixedExpenses) {
    const { data: created, error } = await client
      .from('fixed_expenses')
      .insert({ user_id: userId, name: fe.name })
      .select()
      .single()
    if (error) throw error

    for (const [i, amount] of fe.amounts.entries()) {
      const offset = -2 + i
      const { error: entryError } = await client
        .from('fixed_expense_entries')
        .insert({ fixed_expense_id: created.id, month: monthKey(offset), amount })
      if (entryError) throw entryError
    }
  }

  console.log('Gastos fijos cargados: Alquiler e Internet (3 meses cada uno).')
}

async function seedGastosVariables(client, userId) {
  const categories = ['Supermercado', 'Transporte', 'Salidas', 'Farmacia', 'Indumentaria', 'Delivery']

  for (const offset of [-2, -1, 0]) {
    const count = 4 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      const { error } = await client.from('variable_expenses').insert({
        user_id: userId,
        category: randomItem(categories),
        month: monthKey(offset),
        amount: randomAmount(3000, 40000),
      })
      if (error) throw error
    }
  }

  console.log('Consumos variables (gastos random) cargados para 3 meses.')
}

async function seedTarjeta(client, userId) {
  const { data: card, error } = await client
    .from('credit_cards')
    .insert({ user_id: userId, name: 'Visa Banco Demo', closing_day: 10, due_day: 20 })
    .select()
    .single()
  if (error) throw error

  const purchases = [
    { offset: -1, day: 5, amount_total: 45000, description: 'Supermercado', installments_count: 1 },
    { offset: -1, day: 12, amount_total: 180000, description: 'Zapatillas', installments_count: 3 },
    { offset: 0, day: 3, amount_total: 600000, description: 'Notebook', installments_count: 6 },
  ]

  for (const p of purchases) {
    const { error: purchaseError } = await client.rpc('create_card_purchase', {
      p_credit_card_id: card.id,
      p_date: dateKey(p.offset, p.day),
      p_amount_total: p.amount_total,
      p_description: p.description,
      p_installments_count: p.installments_count,
    })
    if (purchaseError) throw purchaseError
  }

  console.log('Tarjeta "Visa Banco Demo" cargada con compras en pago único y en cuotas.')
}

async function seedMetaAhorro(client, userId) {
  const { data: goal, error } = await client
    .from('savings_goals')
    .insert({
      user_id: userId,
      name: 'Viaje a Bariloche',
      target_amount: 800000,
      target_date: dateKey(8, 1),
    })
    .select()
    .single()
  if (error) throw error

  const contributions = [
    { offset: -1, day: 20, amount: 50000 },
    { offset: 0, day: 5, amount: 70000 },
  ]
  for (const c of contributions) {
    const { error: contribError } = await client
      .from('goal_contributions')
      .insert({ savings_goal_id: goal.id, date: dateKey(c.offset, c.day), amount: c.amount, note: null })
    if (contribError) throw contribError
  }

  console.log('Meta de ahorro "Viaje a Bariloche" cargada con 2 aportes.')
}

async function seedCartera(client, userId) {
  const items = [
    {
      instrument_type: 'plazo_fijo',
      name: 'Plazo fijo Banco Demo',
      quantity: 1,
      purchase_price: 500000,
      purchase_date: dateKey(-2, 1),
      current_value: 540000,
      note: null,
    },
    {
      instrument_type: 'accion',
      name: 'CEDEAR AAPL',
      quantity: 10,
      purchase_price: 12000,
      purchase_date: dateKey(-4, 15),
      current_value: 135000,
      note: null,
    },
    {
      instrument_type: 'cripto',
      name: 'Bitcoin',
      quantity: 0.01,
      purchase_price: 4500000,
      purchase_date: dateKey(-3, 10),
      current_value: 48000,
      note: 'Billetera Demo Exchange',
    },
  ]

  for (const item of items) {
    const { error } = await client.from('investment_portfolio').insert({ user_id: userId, ...item })
    if (error) throw error
  }

  console.log('Cartera de inversiones cargada (plazo fijo, acción y cripto).')
}

async function seedGroupSampleData(client1, client2, group, user1Id, user2Id) {
  const { data: existingGoals, error: fetchError } = await client1
    .from('group_goals')
    .select('id')
    .eq('group_id', group.id)
  if (fetchError) throw fetchError
  if (existingGoals.length > 0) {
    console.log('El grupo ya tiene datos de ejemplo cargados, no se vuelve a sembrar.')
    return
  }

  const { data: goal, error: goalError } = await client1
    .from('group_goals')
    .insert({ group_id: group.id, name: 'Vacaciones en familia', target_amount: 300000, target_date: dateKey(6, 1) })
    .select()
    .single()
  if (goalError) throw goalError

  const { error: contrib1Error } = await client1
    .from('group_goal_contributions')
    .insert({ group_goal_id: goal.id, user_id: user1Id, date: dateKey(-1, 15), amount: 40000, note: null })
  if (contrib1Error) throw contrib1Error

  const { error: contrib2Error } = await client2
    .from('group_goal_contributions')
    .insert({ group_goal_id: goal.id, user_id: user2Id, date: dateKey(-1, 18), amount: 35000, note: null })
  if (contrib2Error) throw contrib2Error

  const { error: fund1Error } = await client1
    .from('fund_contributions')
    .insert({ group_id: group.id, user_id: user1Id, date: dateKey(-1, 10), amount: 50000, note: null })
  if (fund1Error) throw fund1Error

  const { error: fund2Error } = await client2
    .from('fund_contributions')
    .insert({ group_id: group.id, user_id: user2Id, date: dateKey(-1, 11), amount: 30000, note: null })
  if (fund2Error) throw fund2Error

  const { error: fondoComunError } = await client1.rpc('create_group_expense', {
    p_group_id: group.id,
    p_description: 'Compras del súper para la casa',
    p_amount: 25000,
    p_month: monthKey(0),
    p_source: 'fondo_comun',
    p_shares: null,
  })
  if (fondoComunError) throw fondoComunError

  // Gasto personal repartido: genera una deuda real entre los dos
  // miembros, visible en el resumen de deudas del grupo.
  const { error: personalError } = await client1.rpc('create_group_expense', {
    p_group_id: group.id,
    p_description: 'Cena afuera',
    p_amount: 20000,
    p_month: monthKey(0),
    p_source: 'personal',
    p_shares: [
      { user_id: user1Id, amount: 10000 },
      { user_id: user2Id, amount: 10000 },
    ],
  })
  if (personalError) throw personalError

  console.log('Grupo "Familia Demo" poblado: meta compartida, fondo común y gastos (con deuda entre miembros).')
}

async function main() {
  const { client: client1, userId: user1Id } = await ensureDemoSession(USER1)
  const { client: client2, userId: user2Id } = await ensureDemoSession(USER2)

  await resetPersonalData(client1, user1Id)

  const group = await ensureFamilyGroup(client1, user1Id)
  await ensureGroupMember(client2, group.invite_code)

  await seedSueldoFijo(client1, user1Id)
  await seedEmprendimiento(client1, user1Id)
  await seedGastosFijos(client1, user1Id)
  await seedGastosVariables(client1, user1Id)
  await seedTarjeta(client1, user1Id)
  await seedMetaAhorro(client1, user1Id)
  await seedCartera(client1, user1Id)
  await seedGroupSampleData(client1, client2, group, user1Id, user2Id)

  console.log('\nListo. Iniciá sesión en la app con:')
  console.log(`  email: ${USER1.email}`)
  console.log(`  contraseña: ${DEMO_PASSWORD}`)
  console.log(`\n(el usuario ${USER2.email} / ${DEMO_PASSWORD} es el "compañero de grupo" de ejemplo)`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nError al seedear datos de demo:', err.message ?? err)
    process.exit(1)
  })
