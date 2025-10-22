import { supabase } from '../supabaseClient.js';
import { renderIcons } from './icons.js';

renderIcons();

const clientFilter = document.getElementById('filter-client');
const groupFilter = document.getElementById('filter-group');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const groupBySelect = document.getElementById('group-by');
const generateBtn = document.getElementById('generate-report-btn');
const printBtn = document.getElementById('print-report-btn');
const loading = document.getElementById('loading-state');
const reportOutput = document.getElementById('report-output');

const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

const loadFilters = async () => {
    // Carregar clientes
    const { data: clientes, error: clientError } = await supabase.from('clientes').select('id, nome').order('nome');
    if (clientError) console.error('Erro ao carregar clientes:', clientError);
    else {
        clientes.forEach(c => clientFilter.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
    }

    // Carregar grupos de produtos
    const { data: grupos, error: groupError } = await supabase.from('grupos_produtos').select('id, nome').order('nome');
    if (groupError) console.error('Erro ao carregar grupos:', groupError);
    else {
        grupos.forEach(g => groupFilter.innerHTML += `<option value="${g.id}">${g.nome}</option>`);
    }
};

const generateReport = async () => {
    loading.style.display = 'block';
    reportOutput.innerHTML = '';

    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const clientId = clientFilter.value;
    const groupId = groupFilter.value;
    const groupBy = groupBySelect.value;

    // FIX: Removed 'print_count' from select as it does not exist.
    let query = supabase
        .from('orcamentos')
        .select(`
            id, created_at, valor_total, desconto,
            clientes (id, nome),
            orcamento_itens (
                quantidade,
                produtos!inner (
                    id, nome,
                    grupos_produtos!inner (id, nome)
                )
            )
        `)
        .order('created_at', { ascending: true });

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
    if (clientId) query = query.eq('cliente_id', clientId);
    if (groupId) query = query.eq('orcamento_itens.produtos.grupos_produtos.id', groupId);

    const { data: orcamentos, error } = await query;

    loading.style.display = 'none';

    if (error) {
        reportOutput.innerHTML = `<p class="error-message">Erro ao gerar relatório: ${error.message}</p>`;
        return;
    }

    if (orcamentos.length === 0) {
        reportOutput.innerHTML = `<p class="report-placeholder">Nenhum orçamento encontrado para os filtros selecionados.</p>`;
        return;
    }

    renderReport(orcamentos, groupBy);
};

const renderReport = (orcamentos, groupBy) => {
    let groupedData = {};

    orcamentos.forEach(orc => {
        let key = 'Relatório Geral';
        let keyName = 'Relatório Geral';

        if (groupBy === 'cliente') {
            key = orc.clientes.id;
            keyName = orc.clientes.nome;
        } else if (groupBy === 'data') {
            key = orc.created_at.split('T')[0]; // Group by date part only
            keyName = formatDate(orc.created_at);
        } else if (groupBy === 'grupo_produto') {
            // Um orçamento pode ter múltiplos grupos, então o tratamos de forma especial
            // Aqui, vamos simplificar e agrupar pelo primeiro grupo encontrado, mas uma lógica mais complexa poderia ser necessária
            const firstItem = orc.orcamento_itens[0];
            if (firstItem) {
                key = firstItem.produtos.grupos_produtos.id;
                keyName = firstItem.produtos.grupos_produtos.nome;
            } else {
                key = 'sem-grupo';
                keyName = 'Itens Sem Grupo';
            }
        }

        if (!groupedData[key]) {
            groupedData[key] = {
                name: keyName,
                orcamentos: [],
                subtotal: 0
            };
        }
        groupedData[key].orcamentos.push(orc);
        groupedData[key].subtotal += orc.valor_total;
    });

    let reportHtml = '';
    let totalGeral = 0;
    let totalOrcamentos = orcamentos.length;

    for (const key in groupedData) {
        const group = groupedData[key];
        totalGeral += group.subtotal;

        reportHtml += `
            <div class="report-group">
                <div class="report-group-header">${group.name}</div>
                <div class="report-group-content table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Data</th>
                                ${groupBy !== 'cliente' ? '<th>Cliente</th>' : ''}
                                <th>Valor Total</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        group.orcamentos.forEach(orc => {
            reportHtml += `
                <tr>
                    <td>#${orc.id}</td>
                    <td>${formatDate(orc.created_at)}</td>
                    ${groupBy !== 'cliente' ? `<td>${orc.clientes.nome}</td>` : ''}
                    <td>${formatCurrency(orc.valor_total)}</td>
                </tr>
            `;
        });

        reportHtml += `
                        </tbody>
                    </table>
                </div>
                <div class="group-subtotal">
                    Subtotal do Grupo: ${formatCurrency(group.subtotal)}
                </div>
            </div>
        `;
    }

    reportHtml += `
        <div class="report-summary">
            <h3>Resumo Geral</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-item-label">Valor Total Geral</span>
                    <span class="summary-item-value">${formatCurrency(totalGeral)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Nº de Orçamentos</span>
                    <span class="summary-item-value">${totalOrcamentos}</span>
                </div>
            </div>
        </div>
    `;

    reportOutput.innerHTML = reportHtml;
};

generateBtn.addEventListener('click', generateReport);
printBtn.addEventListener('click', () => window.print());

// Set default dates (optional)
const today = new Date();
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
startDateInput.value = firstDayOfMonth.toISOString().split('T')[0];
endDateInput.value = today.toISOString().split('T')[0];

loadFilters();
