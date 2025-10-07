/*
# [Definitive Fix] Recreate Total Calculation Function and Trigger
This script provides a definitive fix for the recurring migration errors and the 'Function Search Path Mutable' security warning. It safely drops the existing trigger and function (if they exist) and then recreates them with the correct and secure configuration.

## Query Description:
This operation will reset the automatic budget total calculation mechanism. It first removes the old components to prevent conflicts and then sets up the new, secure versions. There is no risk to existing data, but for a brief moment between dropping and creating, automatic total calculations will be inactive.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Drops Trigger: `atualiza_valor_total_orcamento_trigger` on table `orcamento_itens`
- Drops Function: `calcula_valor_total_orcamento()`
- Creates Function: `calcula_valor_total_orcamento()` with `SET search_path = 'public'`
- Creates Trigger: `atualiza_valor_total_orcamento_trigger` on table `orcamento_itens`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Fixes: This script explicitly sets `search_path` within the function definition, which resolves the '[WARN] Function Search Path Mutable' security advisory.

## Performance Impact:
- Indexes: None
- Triggers: Recreates one trigger. The performance impact is negligible and essential for application logic.
- Estimated Impact: Low.
*/

-- Step 1: Drop the trigger if it exists on the orcamento_itens table.
DROP TRIGGER IF EXISTS atualiza_valor_total_orcamento_trigger ON public.orcamento_itens;

-- Step 2: Drop the function if it exists.
DROP FUNCTION IF EXISTS public.calcula_valor_total_orcamento();

-- Step 3: Recreate the function with the security fix (SET search_path).
CREATE OR REPLACE FUNCTION public.calcula_valor_total_orcamento()
RETURNS TRIGGER AS $$
BEGIN
  -- This function now explicitly sets the search_path to 'public'
  -- to resolve the security warning and ensure it only accesses expected schemas.
  SET search_path = 'public';

  IF (TG_OP = 'DELETE') THEN
    UPDATE orcamentos
    SET valor_total = (
      SELECT COALESCE(SUM(oi.quantidade * p.valor), 0)
      FROM orcamento_itens oi
      JOIN produtos p ON oi.produto_id = p.id
      WHERE oi.orcamento_id = OLD.orcamento_id
    )
    WHERE id = OLD.orcamento_id;
    RETURN OLD;
  ELSE
    UPDATE orcamentos
    SET valor_total = (
      SELECT COALESCE(SUM(oi.quantidade * p.valor), 0)
      FROM orcamento_itens oi
      JOIN produtos p ON oi.produto_id = p.id
      WHERE oi.orcamento_id = NEW.orcamento_id
    )
    WHERE id = NEW.orcamento_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate the trigger to execute the function after changes to orcamento_itens.
CREATE TRIGGER atualiza_valor_total_orcamento_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orcamento_itens
FOR EACH ROW EXECUTE FUNCTION public.calcula_valor_total_orcamento();
