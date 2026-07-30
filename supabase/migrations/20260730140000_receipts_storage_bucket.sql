-- Bucket privado para comprobantes (fotos/PDF de ventas, transferencias,
-- gastos). Nunca publico: son documentos financieros personales. El acceso
-- se resuelve por convencion de path "<user_id>/<archivo>" + RLS sobre
-- storage.objects (ver siguiente bloque); la app siempre lee via signed
-- URLs con expiracion, nunca URLs publicas.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

create policy "receipts_storage_owner_select"
on storage.objects for select
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "receipts_storage_owner_insert"
on storage.objects for insert
with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "receipts_storage_owner_delete"
on storage.objects for delete
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
