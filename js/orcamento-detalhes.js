import { supabase } from '../supabaseClient.js';
import { renderIcons } from './icons.js';

renderIcons(); // Render static icons on page load

const content = document.getElementById('orcamento-details-content');
const loading = document.getElementById('loading-state');
const printBtn = document.getElementById('print-btn');

const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

const urlParams = new URLSearchParams(window.location.search);
const orcamentoId = urlParams.get('id');

const loadOrcamentoDetails = async () => {
    if (!orcamentoId) {
        content.innerHTML = '<p>ID do orçamento não fornecido.</p>';
        loading.style.display = 'none';
        return;
    }

    // Fetch orcamento principal e dados do cliente
    // FIX: Changed 'data' column to 'created_at' to match the database schema.
    const { data: orcamento, error: orcamentoError } = await supabase
        .from('orcamentos')
        .select(`
            id,
            created_at,
            observacoes,
            valor_total,
            valor_bruto,
            desconto,
            print_count,
            clientes ( nome, email, telefone )
        `)
        .eq('id', orcamentoId)
        .single();

    if (orcamentoError || !orcamento) {
        console.error('Erro ao buscar orçamento:', orcamentoError);
        content.innerHTML = `<p>Orçamento não encontrado. Verifique se as colunas 'valor_bruto', 'desconto' e 'print_count' existem na tabela 'orcamentos'.</p>`;
        loading.style.display = 'none';
        return;
    }

    // Fetch itens do orçamento
    const { data: items, error: itemsError } = await supabase
        .from('orcamento_itens')
        .select(`
            quantidade,
            valor_unitario,
            produtos ( nome )
        `)
        .eq('orcamento_id', orcamentoId);

    if (itemsError) {
        console.error('Erro ao buscar itens:', itemsError);
        content.innerHTML = '<p>Erro ao carregar itens do orçamento.</p>';
        loading.style.display = 'none';
        return;
    }

    renderDetails(orcamento, items);
    loading.style.display = 'none';
};

const renderDetails = (orcamento, items) => {
    let itemsHtml = '';
    items.forEach(item => {
        const subtotal = item.quantidade * item.valor_unitario;
        itemsHtml += `
            <tr>
                <td>${item.produtos.nome}</td>
                <td>${item.quantidade}</td>
                <td>${formatCurrency(item.valor_unitario)}</td>
                <td>${formatCurrency(subtotal)}</td>
            </tr>
        `;
    });

    const hasDiscount = orcamento.desconto > 0;
    const totalBruto = orcamento.valor_bruto ?? items.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0);

    content.innerHTML = `
        <div class="details-header">
            <h2>Orçamento #${orcamento.id}</h2>
            <p><strong>Data:</strong> ${formatDate(orcamento.created_at)}</p>
        </div>

        <div class="details-section">
            <h3>Cliente</h3>
            <p><strong>Nome:</strong> ${orcamento.clientes.nome}</p>
            <p><strong>Email:</strong> ${orcamento.clientes.email || 'Não informado'}</p>
            <p><strong>Telefone:</strong> ${orcamento.clientes.telefone || 'Não informado'}</p>
        </div>

        <div class="details-section">
            <h3>Itens</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Quantidade</th>
                            <th>Valor Unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>
        </div>

        ${orcamento.observacoes ? `
        <div class="details-section">
            <h3>Observações</h3>
            <p>${orcamento.observacoes}</p>
        </div>
        ` : ''}

        <div class="details-total">
            <div class="total-breakdown">
                ${hasDiscount ? `<p>Total Bruto: ${formatCurrency(totalBruto)}</p>` : ''}
                ${hasDiscount ? `<p>Desconto: ${orcamento.desconto.toFixed(2)}%</p>` : ''}
                <h3>Valor Total: ${formatCurrency(orcamento.valor_total)}</h3>
            </div>
        </div>
    `;
};

printBtn.addEventListener('click', async () => {
    if (!orcamentoId) return;

    // Incrementa o contador de impressão no banco de dados
    const { data: current, error: fetchError } = await supabase
        .from('orcamentos')
        .select('print_count')
        .eq('id', orcamentoId)
        .single();
    
    if (fetchError) {
        console.error("Erro ao buscar contagem de impressão:", fetchError.message);
        // Prossegue com a impressão mesmo em caso de erro
        window.print();
        return;
    }

    const newCount = (current.print_count || 0) + 1;
    const { error: updateError } = await supabase
        .from('orcamentos')
        .update({ print_count: newCount })
        .eq('id', orcamentoId);

    if (updateError) {
        console.error("Erro ao atualizar contagem de impressão:", updateError.message);
    }

    // Dispara a impressão
    window.print();
});

loadOrcamentoDetails();
