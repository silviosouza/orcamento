/*
# [Security Fix] Set Function Search Path
Corrige o aviso de segurança "Function Search Path Mutable" definindo explicitamente o search_path para a função `calcula_valor_total_orcamento`. Isso evita que a função seja suscetível a ataques de sequestro de caminho de busca (search path hijacking).

## Query Description: "This operation modifies a database function to enhance security by setting a fixed search path. It is a safe, non-destructive change that prevents potential vulnerabilities. No data will be affected."

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Modifies function: `public.calcula_valor_total_orcamento()`

## Security Implications:
- RLS Status: Not Applicable
- Policy Changes: No
- Auth Requirements: None
- Mitigates: Search Path Hijacking vulnerability.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible performance impact.
*/

ALTER FUNCTION public.calcula_valor_total_orcamento() SET search_path = public;
