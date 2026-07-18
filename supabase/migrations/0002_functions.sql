-- Atomic inventory adjustments (avoids read-then-write races between caregivers on different phones).

create or replace function decrement_units(med_id uuid, amount numeric)
returns void
language sql
as $$
  update medications
  set units_on_hand = greatest(coalesce(units_on_hand, 0) - amount, 0)
  where id = med_id and units_on_hand is not null;
$$;

create or replace function increment_units(med_id uuid, amount numeric)
returns void
language sql
as $$
  update medications
  set units_on_hand = coalesce(units_on_hand, 0) + amount
  where id = med_id and units_on_hand is not null;
$$;
