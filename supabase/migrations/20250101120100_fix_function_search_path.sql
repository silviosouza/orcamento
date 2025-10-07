/*
# [Fix Function Search Path]
This operation updates the `calcula_valor_total_orcamento` function to explicitly set the `search_path`. This is a security best practice that prevents potential hijacking of the function by malicious actors who could create objects with the same names in other schemas.

## Query Description: [This query modifies an existing PostgreSQL function to enhance its security. It sets a fixed `search_path` to `public`, ensuring that the function only accesses objects within the `public` schema, mitigating risks associated with mutable search paths. This change does not affect existing data and is reversible.]

## Metadata:
- Schema-Category: ["Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function being affected: `public.calcula_valor_total_orcamento`

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [N/A]
- **Note**: This change directly addresses the `[WARN] Function Search Path Mutable` security advisory by hardening the function's execution context.

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [None. This is a security and stability improvement with no performance overhead.]
*/
ALTER FUNCTION public.calcula_valor_total_orcamento() SET search_path = public;
