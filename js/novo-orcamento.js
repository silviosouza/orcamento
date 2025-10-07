import { supabase } from '../supabaseClient.js';
import { renderIcons } from './icons.js';

renderIcons(); // Render static icons on page load

const clienteSelect = document.getElementById('cliente_id');
const productSelect = document.getElementById('product-select');
const addItemBtn = document.getElementById('add-item-btn');
const itemsTableBody = document.querySelector('#orcamento-items-table tbody');
const totalOrcamentoSpan = document.getElementById('total-orcamento');
const orcamentoForm = document.getElementById('orcamento-form');
const dataInput = document.getElementById('data');

let products = [];
let orcamentoItems = [];

const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const loadInitialData = async () => {
    // Carregar clientes
    const { data: clientes, error: clientesError } = await supabase.from('clientes').select('id, nome').order('nome');
    if (clientesError) console.error('Erro ao buscar clientes:', clientesError);
    else {
        clienteSelect.innerHTML = '<option value="">Selecione um cliente</option>';
        clientes.forEach(c => clienteSelect.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
    }

    // Carregar produtos
    const { data: productsData, error: productsError } = await supabase.from('produtos').select('id, nome, preco').order('nome');
    if (productsError) console.error('Erro ao buscar produtos:', productsError);
    else {
        products = productsData;
        productSelect.innerHTML = '<option value="">Selecione um produto</option>';
        products.forEach(p => productSelect.innerHTML += `<option value="${p.id}">${p.nome}</option>`);
    }
};

const updateTotal = () => {
    const total = orcamentoItems.reduce((sum, item) => sum + item.subtotal, 0);
    totalOrcamentoSpan.textContent = formatCurrency(total);
};

const renderItems = () => {
    itemsTableBody.innerHTML = '';
    orcamentoItems.forEach(item => {
        const row = document.createElement('tr');
        row.dataset.productId = item.produto_id;
        row.innerHTML = `
            <td>${item.nome}</td>
            <td><input type="number" class="item-qty" value="${item.quantidade}" min="1" style="width: 70px;"></td>
            <td>${formatCurrency(item.valor_unitario)}</td>
            <td>${formatCurrency(item.subtotal)}</td>
            <td class="actions">
                <button type="button" class="btn-icon delete-item-btn"><i data-lucide="trash-2"></i></button>
            </td>
        `;
        itemsTableBody.appendChild(row);
    });
    renderIcons(); // Render icons for dynamically added rows
    updateTotal();
};


addItemBtn.addEventListener('click', () => {
    const selectedProductId = productSelect.value;
    if (!selectedProductId) {
        alert('Por favor, selecione um produto.');
        return;
    }

    const existingItem = orcamentoItems.find(item => item.produto_id == selectedProductId);
    if (existingItem) {
        alert('Este produto já foi adicionado ao orçamento.');
        return;
    }

    const product = products.find(p => p.id == selectedProductId);
    if (product) {
        orcamentoItems.push({
            produto_id: product.id,
            nome: product.nome,
            quantidade: 1,
            valor_unitario: product.preco,
            subtotal: product.preco
        });
        renderItems();
    }
});

itemsTableBody.addEventListener('change', (e) => {
    if (e.target.classList.contains('item-qty')) {
        const newQty = parseInt(e.target.value, 10);
        const productId = e.target.closest('tr').dataset.productId;
        const item = orcamentoItems.find(i => i.produto_id == productId);

        if (item && newQty > 0) {
            item.quantidade = newQty;
            item.subtotal = item.valor_unitario * newQty;
            renderItems();
        }
    }
});

itemsTableBody.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-item-btn');
    if (deleteBtn) {
        const productId = deleteBtn.closest('tr').dataset.productId;
        orcamentoItems = orcamentoItems.filter(i => i.produto_id != productId);
        renderItems();
    }
});

orcamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (orcamentoItems.length === 0) {
        alert('Adicione pelo menos um item ao orçamento.');
        return;
    }

    const formData = new FormData(orcamentoForm);
    const orcamentoData = {
        cliente_id: formData.get('cliente_id'),
        data: formData.get('data'),
        observacoes: formData.get('observacoes'),
        valor_total: orcamentoItems.reduce((sum, item) => sum + item.subtotal, 0)
    };

    // 1. Inserir o orçamento principal
    const { data: newOrcamento, error: orcamentoError } = await supabase
        .from('orcamentos')
        .insert(orcamentoData)
        .select()
        .single();

    if (orcamentoError) {
        alert('Erro ao salvar o orçamento: ' + orcamentoError.message);
        return;
    }

    // 2. Preparar e inserir os itens do orçamento
    const itemsToInsert = orcamentoItems.map(item => ({
        orcamento_id: newOrcamento.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario
    }));

    const { error: itemsError } = await supabase
        .from('orcamento_itens')
        .insert(itemsToInsert);

    if (itemsError) {
        // Tenta reverter o orçamento principal se a inserção dos itens falhar
        await supabase.from('orcamentos').delete().eq('id', newOrcamento.id);
        alert('Erro ao salvar os itens do orçamento: ' + itemsError.message);
        return;
    }

    alert('Orçamento salvo com sucesso!');
    window.location.href = 'orcamentos.html';
});


// Inicialização
dataInput.valueAsDate = new Date();
loadInitialData();
