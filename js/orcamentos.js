import { supabase } from '../supabaseClient.js';
import { renderIcons } from './icons.js';

renderIcons(); // Render static icons on page load

const tableBody = document.querySelector('#orcamentos-table tbody');
const loading = document.getElementById('loading-state');

const formatCurrency = (value) => {
    if (typeof value !== 'number') {
        return 'R$ 0,00';
    }
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const fetchOrcamentos = async () => {
    loading.style.display = 'block';
    tableBody.innerHTML = '';

    const { data: orcamentos, error } = await supabase
        .from('orcamentos')
        .select(`
            id,
            data,
            valor_total,
            clientes ( nome )
        `)
        .order('data', { ascending: false });

    loading.style.display = 'none';

    if (error) {
        console.error('Erro ao buscar orçamentos:', error);
        tableBody.innerHTML = `<tr><td colspan="5">Erro ao carregar dados.</td></tr>`;
        return;
    }

    if (orcamentos.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5">Nenhum orçamento cadastrado.</td></tr>`;
    } else {
        orcamentos.forEach(orcamento => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${orcamento.id}</td>
                <td>${orcamento.clientes.nome}</td>
                <td>${formatDate(orcamento.data)}</td>
                <td>${formatCurrency(orcamento.valor_total)}</td>
                <td class="actions">
                    <a href="orcamento-detalhes.html?id=${orcamento.id}" class="btn-icon details-btn" title="Ver Detalhes"><i data-lucide="file-text"></i></a>
                    <button class="btn-icon delete-btn" data-id="${orcamento.id}" title="Excluir"><i data-lucide="trash-2"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        renderIcons(); // Render icons for dynamically added rows
    }
};

tableBody.addEventListener('click', async (e) => {
    const deleteButton = e.target.closest('.delete-btn');

    if (deleteButton) {
        const orcamentoId = deleteButton.dataset.id;
        if (confirm('Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.')) {
            // Primeiro, deletar os itens do orçamento
            const { error: itemsError } = await supabase.from('orcamento_itens').delete().eq('orcamento_id', orcamentoId);

            if (itemsError) {
                alert('Erro ao excluir os itens do orçamento: ' + itemsError.message);
                return;
            }

            // Depois, deletar o orçamento principal
            const { error: orcamentoError } = await supabase.from('orcamentos').delete().eq('id', orcamentoId);

            if (orcamentoError) {
                alert('Erro ao excluir o orçamento: ' + orcamentoError.message);
            } else {
                fetchOrcamentos();
            }
        }
    }
});

fetchOrcamentos();
