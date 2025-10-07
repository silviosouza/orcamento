/*
# [Recreate Budget Total Calculation Function and Trigger]
This script safely drops and recreates the function and trigger responsible for calculating the total value of a budget. This ensures the database schema is consistent and resolves potential migration errors where the function might not exist.

## Query Description:
This operation will first attempt to remove the existing trigger and function if they are present. It will then recreate them with the correct definitions and security settings (specifying `search_path`). This is a safe operation as it rebuilds a piece of backend logic without affecting stored data.

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true (by dropping the created function and trigger)

## Structure Details:
- Function: `public.calcula_valor_total_orcamento` (Dropped and Recreated)
- Trigger: `atualiza_valor_total_orcamento_trigger` on `orcamento_itens` (Dropped and Recreated)

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Note: This script explicitly sets `search_path` for the function, resolving a security advisory ([WARN] Function Search Path Mutable).

## Performance Impact:
- Indexes: None
- Triggers: Recreates a trigger on `orcamento_itens`. The impact is minimal and only occurs on INSERT, UPDATE, or DELETE operations on that table.
- Estimated Impact: Negligible performance impact.
*/

-- Step 1: Safely drop the existing trigger on orcamento_itens if it exists.
DROP TRIGGER IF EXISTS atualiza_valor_total_orcamento_trigger ON public.orcamento_itens;

-- Step 2: Safely drop the existing function if it exists.
DROP FUNCTION IF EXISTS public.calcula_valor_total_orcamento();

-- Step 3: Recreate the function to calculate the total value of a budget.
-- This version includes the security fix for the search_path.
CREATE OR REPLACE FUNCTION public.calcula_valor_total_orcamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    orcamento_id_afetado INT;
    novo_valor_total NUMERIC;
BEGIN
    -- Determine the orcamento_id from the operation
    IF (TG_OP = 'DELETE') THEN
        orcamento_id_afetado := OLD.orcamento_id;
    ELSE
        orcamento_id_afetado := NEW.orcamento_id;
    END IF;

    -- Calculate the new total for the affected budget
    SELECT COALESCE(SUM(quantidade * valor_unitario), 0)
    INTO novo_valor_total
    FROM orcamento_itens
    WHERE orcamento_id = orcamento_id_afetado;

    -- Update the valor_total in the orcamentos table
    UPDATE orcamentos
    SET valor_total = novo_valor_total
    WHERE id = orcamento_id_afetado;

    -- Return the appropriate record
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Step 4: Recreate the trigger to execute the function after changes to orcamento_itens.
CREATE TRIGGER atualiza_valor_total_orcamento_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orcamento_itens
FOR EACH ROW
EXECUTE FUNCTION public.calcula_valor_total_orcamento();
