# Finanzas Personales/Familiares — Plan del Proyecto

## Decisiones tomadas

- **Plataforma**: web app responsive (mobile-first) por ahora. Mobile nativo (Capacitor) queda para una fase posterior, no bloquea el desarrollo actual.
- **Datos**: requiere cuentas y sincronización — backend con autenticación real.
- **Metodología**: fases incrementales, cada una entregable y usable antes de pasar a la siguiente.
- **Tarjeta de crédito**: soporta pago único y en cuotas desde el MVP (pensado para finanzas de corto y largo plazo, no solo el mes actual).
- **Comprobantes (ventas de emprendimiento, transferencias)**: se pueden cargar a mano o por foto/PDF con extracción automática vía IA + paso de confirmación manual antes de guardar.
- **Cartera de inversiones financieras**: carga manual en el MVP; conexión a API de cotizaciones (IOL, Alpha Vantage, etc.) queda como mejora futura, no bloquea el desarrollo actual.
- **Todo usuario es individual por default**: se registra solo, y todas sus finanzas (ingresos, gastos, inversiones, metas) son privadas salvo que decida compartir algo dentro de un grupo.
- **Grupos (generaliza "familia")**: un usuario puede crear o unirse a uno o más grupos vía código de invitación. Un grupo puede ser una familia, pero también un grupo de amigos ahorrando para un viaje, o cualquier objetivo compartido — mismo mecanismo para todos los casos.
- **Fondo común**: opcional y a nivel de cada gasto/aporte compartido, no obligatorio para todo el grupo. Dentro de un grupo, cada gasto compartido puede saldarse contra el fondo común del grupo o quedar a cargo personal de un miembro (pero igual queda visible/etiquetado en el grupo).
- **Vista dual**: cada usuario tiene su vista personal (100% privada) y, si pertenece a uno o más grupos, una vista por grupo que muestra solo lo que ese grupo comparte (metas, gastos y fondo del grupo) — nunca el resto de las finanzas privadas de los otros miembros.
- **Emprendimientos entre varias personas**: un emprendimiento puede pertenecer a un usuario individual o a un grupo (socios). Si es de grupo, la recuperación de inversión y la ganancia se ven en la vista del grupo, repartida proporcionalmente entre los socios según su aporte/participación.
- **Complejidad de productos — simplificado en dos modos**: por default, un emprendimiento usa **modo simple** (costo y precio promedio, como ya lo tenemos — cargar una venta es solo "monto vendido hoy" + unidades opcional). El **modo detallado** (catálogo de productos, cada venta por producto + cantidad) queda como opción para activar más adelante, solo para quien realmente lo necesita — no es el flujo por default.

## Stack propuesto

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | React + Vite + Tailwind | Rápido de iterar, mobile-first fácil, migrable a Capacitor después sin reescribir |
| Backend + Auth + DB | Supabase (Postgres + Auth + Row Level Security) | Auth de usuarios individuales + pertenencia a grupos sin escribir backend a mano; RLS resuelve "cada usuario ve lo suyo, cada grupo ve lo del grupo" a nivel de base |
| Hosting | Vercel / Netlify | Deploy directo del frontend, gratis para MVP |

Alternativa si en algún momento se prefiere no depender de Supabase: backend propio en Node/Express + Postgres. Lo dejamos como plan B si surgen necesidades muy custom de lógica de servidor.

## Modelo de datos (borrador)

### Usuario individual (siempre privado por default)

```
users
 ├─ id, name, email

income_sources
 ├─ id, owner_type ("user" | "group"), owner_id, type ("empleado_fijo" | "monotributo" | "responsable_inscripto")
 ├─ name (ej: "Sueldo agencia", "Emprendimiento X")
 └─ si type es monotributo/RI (emprendimiento): product_mode ("simple" | "detallado", default "simple")

income_source_partners (solo si owner_type = "group" — reparto entre socios)
 ├─ id, income_source_id, user_id, aporte_inicial, participacion_pct
 └─ la inversión y ganancia se calculan a nivel del emprendimiento; esta tabla solo define cómo se reparte entre socios para mostrar en la vista de cada uno

income_entries (ventas — carga mensual o diaria)
 ├─ id, income_source_id, date, base_amount, extra_amount (bonos/ventas), units_sold (opcional), note
 └─ en modo simple: esto es todo lo que se carga ("venta del día" = monto + unidades opcional)

products (solo si product_mode = "detallado")
 ├─ id, income_source_id, name, costo_unitario, precio_venta

sale_items (solo si product_mode = "detallado" — detalle de una venta por producto)
 ├─ id, income_entry_id, product_id, quantity, unit_price_at_sale
 └─ el income_entry.base_amount se calcula como suma de estas líneas en vez de cargarse a mano

fixed_expenses
 ├─ id, user_id, name (alquiler, luz, gas, internet...)

fixed_expense_entries (editable mes a mes)
 ├─ id, fixed_expense_id, month, amount

variable_expenses
 ├─ id, user_id, category, month, amount

investments (por emprendimiento — reusa la lógica ya construida)
 ├─ id, income_source_id, infraestructura, stock_inicial, costo_unitario, precio_venta
investment_monthly (calculado, no se guarda a mano: se deriva de income_entries + gastos fijos del emprendimiento)

savings_goals (metas personales)
 ├─ id, user_id, name, target_amount, target_date
 └─ cuota_mensual_sugerida = calculado en vivo (target_amount - ahorrado) / meses_restantes

credit_cards
 ├─ id, user_id, name (ej: "Visa Galicia"), closing_day, due_day

card_purchases (cada compra suelta, al momento de hacerla)
 ├─ id, credit_card_id, date, amount_total, description
 ├─ installments_count (1 si es pago único, N si es en cuotas)
 └─ installments: se generan N registros de "cuota" con su monto (amount_total / N) y el mes en que cae cada una

card_statements (resumen de cierre — el gasto real que sale del bolsillo)
 ├─ id, credit_card_id, period (mes de cierre), due_month
 └─ total = suma de: compras de pago único del período + la cuota correspondiente de compras en cuotas (incluidas las de meses anteriores que siguen cuoteando)
 → este total es el que se trata como gasto (fijo/variable) en el mes de vencimiento

receipts (comprobantes: ventas de emprendimiento, transferencias, compras)
 ├─ id, related_entity ("income_entry" | "card_purchase" | "expense"), file_url (foto o PDF)
 ├─ extracted_amount, extracted_date, extracted_note (lo que interpretó la IA)
 ├─ status ("pendiente_confirmacion" | "confirmado" | "editado_manualmente")
 └─ el registro final (income_entry, gasto, etc.) solo se crea/actualiza después de la confirmación del usuario

investment_portfolio (cartera financiera — distinta de la inversión de emprendimiento)
 ├─ id, user_id, instrument_type ("acción" | "CEDEAR" | "plazo_fijo" | "fondo" | "cripto" | "otro")
 ├─ name, quantity, purchase_price, current_value (carga manual por ahora, actualizable a mano)
 └─ pensado para que "current_value" luego se pueda reemplazar por una consulta a API sin cambiar el resto del modelo
```

### Grupos (familia, viaje con amigos, o cualquier objetivo compartido)

```
groups
 ├─ id, name, type ("familia" | "viaje" | "otro"), invite_code

group_members
 ├─ group_id, user_id, joined_at, role ("admin" | "miembro")

group_goals (metas compartidas del grupo — ej: "Viaje a Bariloche", "Fondo de la familia")
 ├─ id, group_id, name, target_amount, target_date
 └─ cuota_mensual_sugerida por miembro = calculado en vivo, se puede repartir en partes iguales o por aporte definido

group_fund (fondo común del grupo — opcional, no todo gasto del grupo tiene que pasar por acá)
 ├─ id, group_id
fund_contributions (aportes de cada miembro al fondo)
 ├─ id, group_fund_id, user_id, month, amount

group_expenses (gastos compartidos del grupo)
 ├─ id, group_id, generated_by_user_id, description, amount, month
 ├─ source ("fondo_comun" | "personal")
 │   - "fondo_comun": se descuenta del saldo de group_fund
 │   - "personal": lo paga el miembro de su propio bolsillo, pero queda visible/etiquetado en el grupo para que todos vean quién puso qué
 └─ esta es la tabla que alimenta tanto la vista "gastos del grupo" como la vista "gastos por miembro dentro del grupo"
```

**Cómo se arma un grupo en la práctica**: cualquier usuario ya registrado individualmente puede crear un grupo (queda como admin) y compartir el `invite_code` (o un link con ese código) para que otros usuarios, también ya registrados, se sumen. Un usuario puede pertenecer a varios grupos a la vez (ej: su familia y un grupo de viaje con amigos), y cada grupo es una vista separada — sus finanzas personales nunca se mezclan ni se exponen entre grupos.

## Fases

### Fase 0 — Fundaciones
- Setup del proyecto (React + Vite + Tailwind + Supabase)
- Auth: registro/login individual
- Estructura de navegación mobile-first con vista dual (Personal / Grupos)
- Crear grupo (genera invite_code) y unirse a grupo (ingresando el código)

### Fase 1 — Ingresos y gastos personales (base del dashboard)
- Alta de fuentes de ingreso (fijo / monotributo / RI), combinables
- Carga mensual de ingresos (sueldo + bonos, ventas de emprendimiento — carga manual)
- Gastos fijos editables mes a mes + gastos variables por categoría
- Dashboard personal: ingresos totales, gastos totales, disponible del mes

### Fase 2 — Tarjeta de crédito
- Alta de tarjetas (cierre, vencimiento)
- Carga de compras: pago único o en cuotas
- Generación del resumen mensual (agrupa todas las compras del período en un solo gasto al vencimiento)
- El resumen impacta el disponible del mes de vencimiento, no el mes de la compra

### Fase 3 — Inversiones (multi-emprendimiento)
- Reutilizar y extender la lógica de recuperación de inversión ya construida
- Soporta múltiples emprendimientos en paralelo, cada uno con su propia inversión y recuperación
- Modo simple por default: costo/precio promedio, carga rápida de "venta del día"
- Emprendimiento de grupo (socios): la recuperación/ganancia se ve en la vista del grupo, repartida por participación
- Vista consolidada + vista por emprendimiento

### Fase 3.1 — Modo detallado por producto (opcional, más adelante)
- Catálogo de productos por emprendimiento (costo/precio individual)
- Carga de ventas por producto + cantidad, con margen calculado por línea
- Solo se activa si el emprendimiento lo necesita — no reemplaza el modo simple

### Fase 4 — Metas de ahorro personales
- Alta de metas (monto + plazo)
- Cálculo en vivo de cuota mensual necesaria, recalculado si cambian ingresos/gastos
- Progreso visual de cada meta

### Fase 5 — Grupos: metas y gastos compartidos
- Vista de grupo: metas compartidas, fondo común (si aplica), gastos del grupo
- Alta de gasto compartido con elección de origen (fondo común o personal del miembro)
- Vista "gastos por miembro" dentro del grupo, sin exponer el resto de sus finanzas privadas
- Reutiliza la misma lógica de metas de ahorro (Fase 4) pero a nivel de grupo en vez de usuario

### Fase 6 — Comprobantes por IA (foto/PDF)
- Subida de foto o PDF de comprobante (venta de emprendimiento, transferencia, compra)
- Extracción automática de monto/fecha/nota vía IA
- Pantalla de confirmación manual antes de guardar el registro final
- Aplica tanto a ventas de emprendimiento como, más adelante, a compras de tarjeta

### Fase 7 — Cartera de inversiones financieras (pestaña Ahorros)
- Alta manual de instrumentos (acciones, CEDEARs, plazo fijo, fondos, cripto)
- Vista de valor total de cartera, carga manual de valor actualizado
- Dejar preparado el modelo para conectar una API de cotizaciones más adelante

### Fase 8 — Pulido UI/UX
- Diseño visual definitivo (paleta, tipografía, micro-interacciones)
- Optimización mobile (PWA: instalable, funciona offline para lectura)
- Revisión de accesibilidad y performance

### Fase 9 — Mobile nativo
- Wrap con Capacitor → build iOS y Android
- Ajustes específicos de plataforma (notificaciones, permisos, etc.)

## Próximo paso
Arrancar Fase 0: estructura del proyecto + auth individual + creación/unión a grupos vía código de invitación.
