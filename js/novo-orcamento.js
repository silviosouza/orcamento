import { supabase } from '../supabaseClient.js';
import { renderIcons } from './icons.js';

renderIcons(); // Render static icons on page load

const clienteSelect = document.getElementById('cliente_id');
const productSelect = document.getElementById('product-select');
const addItemBtn = document.getElementById('add-item-btn');
const itemsTableBody = document.querySelector('#orcamento-items-table tbody');
const totalBrutoSpan = document.getElementById('total-bruto');
const totalOrcamentoSpan = document.getElementById('total-orcamento');
const descontoInput = document.getElementById('desconto');
const orcamentoForm = document.getElementById('orcamento-form');
const dataInput = document.getElementById('data');
const discountTypeSwitch = document.querySelectorAll('input[name="discount-type"]');

let products = [];
let orcamentoItems = [];
let discountType = 'percent'; // 'percent' or 'valor'

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

const updateTotals = () => {
    const totalBruto = orcamentoItems.reduce((sum, item) => sum + item.subtotal, 0);
    const descontoInputValue = parseFloat(descontoInput.value) || 0;
    let descontoValor = 0;

    if (discountType === 'percent') {
        const percent = Math.min(descontoInputValue, 100);
        if (descontoInputValue > 100) {
            descontoInput.value = 100;
        }
        descontoValor = totalBruto * (percent / 100);
    } else { // 'valor'
        descontoValor = Math.min(descontoInputValue, totalBruto);
        if (descontoInputValue > totalBruto && totalBruto > 0) {
            descontoInput.value = totalBruto.toFixed(2);
        }
    }
    
    const totalLiquido = totalBruto - descontoValor;

    totalBrutoSpan.textContent = formatCurrency(totalBruto);
    totalOrcamentoSpan.textContent = formatCurrency(totalLiquido);
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
    updateTotals();
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

discountTypeSwitch.forEach(input => {
    input.addEventListener('change', (e) => {
        discountType = e.target.value;
        descontoInput.value = '0';
        if (discountType === 'percent') {
            descontoInput.max = '100';
            descontoInput.step = '0.1';
        } else {
            descontoInput.removeAttribute('max');
            descontoInput.step = '0.01';
        }
        updateTotals();
    });
});

descontoInput.addEventListener('input', updateTotals);

orcamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (orcamentoItems.length === 0) {
        alert('Adicione pelo menos um item ao orçamento.');
        return;
    }

    const formData = new FormData(orcamentoForm);
    const totalBruto = orcamentoItems.reduce((sum, item) => sum + item.subtotal, 0);
    const descontoInputValue = parseFloat(descontoInput.value) || 0;
    let descontoValor = 0;

    if (discountType === 'percent') {
        descontoValor = totalBruto * (descontoInputValue / 100);
    } else { // 'valor'
        descontoValor = descontoInputValue;
    }

    descontoValor = Math.min(descontoValor, totalBruto);
    const totalLiquido = totalBruto - descontoValor;
    const descontoPercentParaSalvar = totalBruto > 0 ? (descontoValor / totalBruto) * 100 : 0;

    const orcamentoData = {
        cliente_id: formData.get('cliente_id'),
        created_at: formData.get('data'),
        observacoes: formData.get('observacoes'),
        desconto: descontoPercentParaSalvar,
        valor_total: totalLiquido,
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
        await supabase.from('orcamentos').delete().eq('id', newOrcamento.id);
        alert('Erro ao salvar os itens do orçamento: ' + itemsError.message);
        return;
    }

    alert('Orçamento salvo com sucesso!');
    window.location.href = 'orcamentos.html';
});


// Inicialização
dataInput.valueAsDate = new Date();
descontoInput.step = '0.1';
descontoInput.max = '100';
loadInitialData();
