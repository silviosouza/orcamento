/*
          # [Fix] Optional Function Drop
          This script corrects a previous migration by safely dropping a function only if it exists, preventing errors during migration runs. It then recreates the function with the proper security settings.

          ## Query Description: This operation modifies a database function. It first attempts to drop the 'calcula_valor_total_orcamento' function if it exists and then recreates it. This is a safe operation and will not result in data loss. It ensures the function is defined correctly for budget calculations.
          
          ## Metadata:
          - Schema-Category: ["Safe", "Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Functions affected: `public.calcula_valor_total_orcamento`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [authenticated]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Negligible. Function definition is updated.]
          */

-- Drop the function only if it exists to avoid errors
DROP FUNCTION IF EXISTS public.calcula_valor_total_orcamento();

-- Recreate the function with the search_path set for security
CREATE OR REPLACE FUNCTION public.calcula_valor_total_orcamento(p_orcamento_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_valor numeric;
BEGIN
    SELECT COALESCE(SUM(oi.quantidade * p.valor), 0)
    INTO total_valor
    FROM orcamento_itens oi
    JOIN produtos p ON oi.produto_id = p.id
    WHERE oi.orcamento_id = p_orcamento_id;

    RETURN total_valor;
END;
$$;
