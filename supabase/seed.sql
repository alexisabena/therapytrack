-- therapytrack: seed data for Elenilla, prescription dated 2026-07-18
-- Sources: Google Sheet "Elenilla" (inventory/units, source of truth for stock)
--          + agenda_medicamentos_elenilla.html (concrete meal-anchored times: desayuno 10am, comida 4pm, cena 9pm)
--
-- IMPORTANT: durations kept as originally prescribed by the doctor, even where
-- units on hand fall short of the full course. The app surfaces that gap as a
-- restock alert instead of silently shortening the prescribed course — confirm
-- any such gap with the doctor before assuming a substitution or early switch.

insert into medications
  (id, name, strength, form, dose_description, route, schedule_type, times, weekly_anchor_date, weekly_interval_days,
   condition_note, duration_description, is_chronic, start_date, course_end_date,
   units_per_dose, units_on_hand, units_label, low_stock_threshold_days, notes)
values
  ('11111111-1111-1111-1111-111111111101', 'Clonazepam', '2mg', 'tableta', '1/2 tableta', 'oral',
   'fixed_times', array['22:00'], null, null,
   'Por las noches', '30 dias', false, '2026-07-18', '2026-08-17',
   0.5, 27, 'tabletas', 5, null),

  ('11111111-1111-1111-1111-111111111102', 'Parche de Nicotina', '21mg', 'parche', '1 parche', 'transdermica',
   'fixed_times', array['08:00'], null, null,
   'Al despertar, antes del desayuno. Cambiar en zona de piel diferente cada vez.', '6 semanas (indicacion medica)', false, '2026-07-18', '2026-08-29',
   1, 4, 'parches', 5,
   'Solo hay 4 parches en existencia para un curso de 6 semanas (~42 dias). Confirmar con el medico si se requiere comprar mas 21mg antes de agotar.'),

  ('11111111-1111-1111-1111-111111111103', 'Parche de Nicotina', '14mg', 'parche', '1 parche', 'transdermica',
   'fixed_times', array['08:00'], null, null,
   'Posterior al parche de 21mg. Al despertar.', '2 semanas (indicacion medica)', false, '2026-08-29', '2026-09-12',
   1, 7, 'parches', 5,
   'Inicia cuando termine el parche de 21mg. Solo 7 parches en existencia para un curso de 2 semanas (14 dias) — confirmar con el medico si se requieren mas.'),

  ('11111111-1111-1111-1111-111111111104', 'Paracetamol', '500mg', 'tableta', '2 tabletas', 'oral',
   'fixed_times', array['10:00','14:00','22:00'], null, null,
   'Con comida ligera si es posible', '5 dias', false, '2026-07-18', '2026-07-23',
   2, 17, 'tabletas', 3,
   'El curso completo (5 dias x 3 tomas x 2 tabletas) requiere 30 tabletas; solo hay 17.'),

  ('11111111-1111-1111-1111-111111111105', 'Alopurinol', '300mg', 'tableta', '1 tableta', 'oral',
   'fixed_times', array['10:00'], null, null,
   'Tomar con bastante agua, con el desayuno', 'sin suspencion', true, '2026-07-18', null,
   1, 27, 'tabletas', 7, null),

  ('11111111-1111-1111-1111-111111111106', 'Lactulosa', '100ml/frasco', 'jarabe', '10 ml', 'oral',
   'fixed_times', array['10:00','16:00','21:00'], null, null,
   'Tomar con agua o jugo', 'sin suspencion', true, '2026-07-18', null,
   10, 125, 'ml', 5, null),

  ('11111111-1111-1111-1111-111111111107', 'Bezafibrato', '200mg', 'tableta', '1 tableta', 'oral',
   'fixed_times', array['10:00'], null, null,
   'Tomar con comida (desayuno)', '3 meses', false, '2026-07-18', '2026-10-18',
   1, 28, 'tabletas', 10,
   'El curso completo (3 meses) requiere ~92 tabletas; solo hay 28 — se necesitara reabastecer.'),

  ('11111111-1111-1111-1111-111111111108', 'Tramadol', '100mg/ml', 'gotas', '10 gotas', 'oral',
   'prn', array[]::text[], null, null,
   'Solo si dolor intenso, maximo cada 8 hrs', '10 dias (si hay dolor)', false, '2026-07-18', '2026-07-28',
   null, 100, 'ml', 5,
   'Existencia en ml del frasco; dosis en gotas no se descuenta automaticamente. Ajustar existencia manualmente.'),

  ('11111111-1111-1111-1111-111111111109', 'Levofloxacino', '750mg', 'tableta', '1 tableta', 'oral',
   'fixed_times', array['10:00'], null, null,
   'Antibiotico — terminar el curso completo aunque mejore', '7 dias', false, '2026-07-18', '2026-07-25',
   1, 7, 'tabletas', 3, null),

  ('11111111-1111-1111-1111-111111111110', 'Denvar (Cefixima)', '400mg', 'capsula', '1 capsula', 'oral',
   'fixed_times', array['10:00'], null, null,
   'No suspender aunque mejore', '10 dias', false, '2026-07-18', '2026-07-28',
   1, 12, 'capsulas', 3, null),

  ('11111111-1111-1111-1111-111111111111', 'Omeprazol', '40mg', 'capsula', '1 capsula', 'oral',
   'fixed_times', array['09:30'], null, null,
   'Antes del desayuno, 15-30 min previo. Protege el estomago del resto de medicamentos.', 'sin suspencion', true, '2026-07-18', null,
   1, null, 'capsulas', 7,
   'Existencia no reportada en la receta original — registrar manualmente en Inventario.'),

  ('11111111-1111-1111-1111-111111111112', 'Pregabalina', '75mg', 'tableta', '1 tableta', 'oral',
   'fixed_times', array['16:00'], null, null,
   'Con la comida, reduce mareos', 'sin suspencion', true, '2026-07-18', null,
   1, 26, 'tabletas', 7, null),

  ('11111111-1111-1111-1111-111111111113', 'Celecoxib', '200mg', 'capsula', '1 capsula', 'oral',
   'fixed_times', array['10:00','22:00'], null, null,
   'Antiinflamatorio, sin suspension aunque mejore', '5 dias', false, '2026-07-18', '2026-07-23',
   1, 29, 'capsulas', 3, null),

  ('11111111-1111-1111-1111-111111111114', 'Furosemida', '40mg', 'tableta', '1 tableta', 'oral',
   'fixed_times', array['10:00'], null, null,
   'Diuretico — tomar en la manana para no interrumpir el sueno', '10 dias', false, '2026-07-18', '2026-07-28',
   1, 20, 'tabletas', 3, null),

  ('11111111-1111-1111-1111-111111111115', 'Soloro 7 (Buprenorfina)', '10mg', 'parche', '1 parche', 'transdermica',
   'weekly', array[]::text[], '2026-07-17', 7,
   'Presionar firmemente 20 segundos al colocar. Rotar zona de piel cada semana.', '1 mes (~4-5 parches)', false, '2026-07-17', '2026-08-14',
   1, null, 'parches', 7,
   'Existencia no reportada en la receta original — registrar manualmente en Inventario.')
on conflict (id) do nothing;

-- Historical record: Soloro 7 was already applied 2026-07-17, before this app existed.
insert into dose_events (medication_id, scheduled_date, scheduled_time, status, actual_at, caregiver_name, notes)
values
  ('11111111-1111-1111-1111-111111111115', '2026-07-17', null, 'taken', '2026-07-17 12:00:00-06', 'Registro inicial', 'Aplicacion previa al uso de la app')
on conflict do nothing;
