/*
# [Create Table: clientes]
Cria a tabela para armazenar os dados dos clientes.

## Query Description: [Esta operação cria a tabela 'clientes' para armazenar informações como nome, email, telefone e endereço. Nenhum dado existente será afetado, pois esta é uma nova tabela.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Table: public.clientes
- Columns: id, nome, email, telefone, endereco, created_at

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Authenticated users]

## Performance Impact:
- Indexes: [Primary Key on id]
- Triggers: [None]
- Estimated Impact: [Baixo]
*/
create table public.clientes (
  id uuid not null default gen_random_uuid() primary key,
  nome text not null,
  email text,
  telefone text,
  endereco text,
  created_at timestamptz not null default now()
);
alter table public.clientes enable row level security;
create policy "Authenticated users can manage clients" on public.clientes
  for all
  to authenticated
  using (true)
  with check (true);

/*
# [Create Table: grupos_produtos]
Cria a tabela para categorizar os produtos.

## Query Description: [Esta operação cria a tabela 'grupos_produtos' para agrupar produtos. Nenhum dado existente será afetado.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Table: public.grupos_produtos
- Columns: id, nome, created_at

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Authenticated users]

## Performance Impact:
- Indexes: [Primary Key on id, Unique on nome]
- Triggers: [None]
- Estimated Impact: [Baixo]
*/
create table public.grupos_produtos (
  id uuid not null default gen_random_uuid() primary key,
  nome text not null unique,
  created_at timestamptz not null default now()
);
alter table public.grupos_produtos enable row level security;
create policy "Authenticated users can manage product groups" on public.grupos_produtos
  for all
  to authenticated
  using (true)
  with check (true);

/*
# [Create Table: produtos]
Cria a tabela para armazenar os produtos.

## Query Description: [Esta operação cria a tabela 'produtos' para o catálogo. Inclui um relacionamento com 'grupos_produtos'. Nenhum dado existente será afetado.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Table: public.produtos
- Columns: id, nome, descricao, preco, grupo_id, created_at

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Authenticated users]

## Performance Impact:
- Indexes: [Primary Key on id, Foreign Key on grupo_id]
- Triggers: [None]
- Estimated Impact: [Baixo]
*/
create table public.produtos (
  id uuid not null default gen_random_uuid() primary key,
  nome text not null,
  descricao text,
  preco numeric not null check (preco > 0),
  grupo_id uuid references public.grupos_produtos(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.produtos enable row level security;
create policy "Authenticated users can manage products" on public.produtos
  for all
  to authenticated
  using (true)
  with check (true);

/*
# [Create Table: orcamentos]
Cria a tabela principal para os orçamentos.

## Query Description: [Esta operação cria a tabela 'orcamentos' para armazenar os cabeçalhos dos orçamentos, relacionando-os com os clientes. Nenhum dado existente será afetado.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Table: public.orcamentos
- Columns: id, cliente_id, data_emissao, data_validade, valor_total, status, created_at

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Authenticated users]

## Performance Impact:
- Indexes: [Primary Key on id, Foreign Key on cliente_id]
- Triggers: [None]
- Estimated Impact: [Baixo]
*/
create table public.orcamentos (
  id uuid not null default gen_random_uuid() primary key,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  data_emissao date not null default current_date,
  data_validade date,
  valor_total numeric not null default 0,
  status text not null default 'Pendente', -- Pendente, Aprovado, Rejeitado
  created_at timestamptz not null default now()
);
alter table public.orcamentos enable row level security;
create policy "Authenticated users can manage quotes" on public.orcamentos
  for all
  to authenticated
  using (true)
  with check (true);

/*
# [Create Table: orcamento_itens]
Cria a tabela para os itens de cada orçamento.

## Query Description: [Esta operação cria a tabela 'orcamento_itens' para detalhar os produtos em cada orçamento. A exclusão de um orçamento removerá seus itens em cascata. Nenhum dado existente será afetado.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
reversible: [true]

## Structure Details:
- Table: public.orcamento_itens
- Columns: id, orcamento_id, produto_id, quantidade, preco_unitario

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Authenticated users]

## Performance Impact:
- Indexes: [Primary Key on id, Foreign Keys on orcamento_id and produto_id]
- Triggers: [None]
- Estimated Impact: [Médio, pois está ligada a operações de orçamento]
*/
create table public.orcamento_itens (
  id uuid not null default gen_random_uuid() primary key,
  orcamento_id uuid not null references public.orcamentos(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric not null
);
alter table public.orcamento_itens enable row level security;
create policy "Authenticated users can manage quote items" on public.orcamento_itens
  for all
  to authenticated
  using (true)
  with check (true);

/*
# [Create Function: update_orcamento_valor_total]
Cria uma função para recalcular o valor total de um orçamento.

## Query Description: [Esta operação cria a função 'update_orcamento_valor_total' que será usada por triggers para manter o 'valor_total' na tabela 'orcamentos' sempre atualizado quando itens são adicionados, alterados ou removidos.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: public.update_orcamento_valor_total

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [N/A]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [This function will be used by triggers, causing a slight overhead on INSERT/UPDATE/DELETE on orcamento_itens]
- Estimated Impact: [Baixo]
*/
create or replace function public.update_orcamento_valor_total()
returns trigger as $$
begin
  update public.orcamentos
  set valor_total = (
    select coalesce(sum(oi.quantidade * oi.preco_unitario), 0)
    from public.orcamento_itens as oi
    where oi.orcamento_id = coalesce(new.orcamento_id, old.orcamento_id)
  )
  where id = coalesce(new.orcamento_id, old.orcamento_id);
  return null;
end;
$$ language plpgsql;

/*
# [Create Trigger: trigger_update_total_after_change]
Cria um trigger para atualizar o valor total do orçamento após qualquer alteração nos itens.

## Query Description: [Esta operação cria o trigger 'trigger_update_total_after_change' na tabela 'orcamento_itens'. Ele será acionado após cada INSERT, UPDATE ou DELETE, chamando a função 'update_orcamento_valor_total' para garantir que o valor total do orçamento correspondente seja sempre preciso.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Trigger: trigger_update_total_after_change on public.orcamento_itens

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [N/A]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [Added]
- Estimated Impact: [Médio, pois adiciona uma operação extra em cada modificação de item de orçamento.]
*/
create trigger trigger_update_total_after_change
after insert or update or delete on public.orcamento_itens
for each row execute function public.update_orcamento_valor_total();
