'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function ensureAdminOrOffice(supabase: ReturnType<typeof createServerClient>) {
  // Ensure the current session user has admin or office role
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = userData?.user;
  if (!user) throw new Error('Не авторизован');

  const { data: roles, error: rolesErr } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (rolesErr) throw rolesErr;

  const allowed = roles && roles.some((r: any) => r.role === 'admin' || r.role === 'office');
  if (!allowed) throw new Error('Недостаточно прав');
}

const bonusSchema = z.object({
  network_id: z.string().uuid(),
  product_variant_id: z.string().uuid(),
  base_bonus: z.number().min(0),
  active: z.boolean().default(true)
})

const tierSchema = z.object({
  network_id: z.string().uuid(),
  min_percent: z.number().min(0),
  max_percent: z.number().nullable(),
  bonus_amount: z.number().min(0)
})

export type BonusFilter = {
  network_id?: string
  product_id?: string
  memory_gb?: number
  search?: string
}

export async function listBonuses(filter: BonusFilter = {}) {
  const supabase = createServerClient()
  
  let query = supabase
    .from('network_product_bonuses')
    .select(`
      *,
      networks (
        id,
        name,
        code
      ),
      product_variants (
        id,
        memory_gb,
        sku,
        products (
          id,
          name
        )
      )
    `)
    .eq('active', true)

  if (filter.network_id) {
    query = query.eq('network_id', filter.network_id)
  }

  if (filter.product_id) {
    query = query.eq('product_variants.product_id', filter.product_id)
  }

  if (filter.memory_gb) {
    query = query.eq('product_variants.memory_gb', filter.memory_gb)
  }

  if (filter.search) {
    query = query.or(`product_variants.products.name.ilike.%${filter.search}%,product_variants.sku.ilike.%${filter.search}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function createBonus(payload: z.infer<typeof bonusSchema>) {
  const supabase = createServerClient()
  await ensureAdminOrOffice(supabase)
  const { data: existing } = await supabase
    .from('network_product_bonuses')
    .select()
    .eq('network_id', payload.network_id)
    .eq('product_variant_id', payload.product_variant_id)
    .single()

  if (existing) {
    throw new Error('Бонус для этой комбинации сети и варианта уже существует')
  }

  const { error } = await supabase
    .from('network_product_bonuses')
    .insert(payload)

  if (error) throw error

  revalidatePath('/bonus-schemes')
}

export async function updateBonus(id: string, payload: z.infer<typeof bonusSchema>) {
  const supabase = createServerClient()
  await ensureAdminOrOffice(supabase)
  const { error } = await supabase
    .from('network_product_bonuses')
    .update(payload)
    .eq('id', id)

  if (error) throw error

  revalidatePath('/bonus-schemes')
}

export async function deleteBonus(id: string) {
  const supabase = createServerClient()
  await ensureAdminOrOffice(supabase)
  const { error } = await supabase
    .from('network_product_bonuses')
    .update({ active: false })
    .eq('id', id)

  if (error) throw error

  revalidatePath('/bonus-schemes')
}

export async function bulkUpsertBonuses(rows: z.infer<typeof bonusSchema>[]) {
  const supabase = createServerClient()
  await ensureAdminOrOffice(supabase)
  const { error } = await supabase
    .from('network_product_bonuses')
    .upsert(
      rows,
      {
        onConflict: 'network_id,product_variant_id',
        ignoreDuplicates: false
      }
    )

  if (error) throw error

  revalidatePath('/bonus-schemes')
}

export async function createTier(payload: z.infer<typeof tierSchema>) {
  const supabase = createServerClient()
  await ensureAdminOrOffice(supabase)
  // Проверяем пересечения
  const { data: existing } = await supabase
    .from('plan_bonus_tiers')
    .select()
    .eq('network_id', payload.network_id)
    .or(`min_percent.lte.${payload.max_percent || 999999},max_percent.gte.${payload.min_percent}`)

  if (existing && existing.length > 0) {
    throw new Error('Новый коридор пересекается с существующими')
  }

  const { error } = await supabase
    .from('plan_bonus_tiers')
    .insert(payload)

  if (error) throw error

  revalidatePath('/bonus-schemes')
}

export async function updateTier(id: string, payload: z.infer<typeof tierSchema>) {
  const supabase = createServerClient()
  await ensureAdminOrOffice(supabase)
  // Проверяем пересечения, исключая текущий
  const { data: existing } = await supabase
    .from('plan_bonus_tiers')
    .select()
    .eq('network_id', payload.network_id)
    .neq('id', id)
    .or(`min_percent.lte.${payload.max_percent || 999999},max_percent.gte.${payload.min_percent}`)

  if (existing && existing.length > 0) {
    throw new Error('Обновленный коридор пересекается с существующими')
  }

  const { error } = await supabase
    .from('plan_bonus_tiers')
    .update(payload)
    .eq('id', id)

  if (error) throw error

  revalidatePath('/bonus-schemes')
}

export async function deleteTier(id: string) {
  const supabase = createServerClient()
  await ensureAdminOrOffice(supabase)
  const { error } = await supabase
    .from('plan_bonus_tiers')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/bonus-schemes')
}

export async function listTiers(networkId?: string) {
  const supabase = createServerClient()

  let query = supabase
    .from('plan_bonus_tiers')
    .select(`
      *,
      networks (
        id,
        name,
        code
      )
    `)
    .order('min_percent')

  if (networkId) {
    query = query.eq('network_id', networkId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}