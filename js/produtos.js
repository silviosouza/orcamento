import { supabase } from '../supabaseClient.js';
import { renderIcons } from './icons.js';

renderIcons(); // Render static icons on page load

const tableBody = document.querySelector('#products-table tbody');
const loading = document.getElementById('loading-state');
const modal = document.getElementById('product-modal');
const modalTitle = document.getElementById('modal-title');
const productForm = document.getElementById('product-form');
const productIdInput = document.getElementById('product-id');
const addProductBtn = document.getElementById('add-product-btn');
const cancelBtn = document.getElementById('cancel-btn');
const groupSelect = document.getElementById('grupo_id');

const openModal = (product = null) => {
    productForm.reset();
    if (product) {
        modalTitle.textContent = 'Editar Produto';
        productIdInput.value = product.id;
        document.getElementById('nome').value = product.nome;
        document.getElementById('preco').value = product.preco;
        groupSelect.value = product.grupo_id;
    } else {
        modalTitle.textContent = 'Adicionar Produto';
        productIdInput.value = '';
    }
    modal.style.display = 'flex';
};

const closeModal = () => {
    modal.style.display = 'none';
};

const fetchProductGroups = async () => {
    const { data, error } = await supabase.from('grupos_produtos').select('id, nome').order('nome');
    if (error) {
        console.error('Erro ao buscar grupos:', error);
        groupSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        return;
    }

    groupSelect.innerHTML = '<option value="">Selecione um grupo</option>';
    data.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.nome;
        groupSelect.appendChild(option);
    });
};

const fetchProducts = async () => {
    loading.style.display = 'block';
    tableBody.innerHTML = '';

    const { data: products, error } = await supabase
        .from('produtos')
        .select('*, grupos_produtos(nome)')
        .order('nome', { ascending: true });

    loading.style.display = 'none';

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        tableBody.innerHTML = `<tr><td colspan="4">Erro ao carregar dados.</td></tr>`;
        return;
    }

    if (products.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4">Nenhum produto cadastrado.</td></tr>`;
    } else {
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.nome}</td>
                <td>${product.grupos_produtos.nome || 'Sem grupo'}</td>
                <td>${Number(product.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td class="actions">
                    <button class="btn-icon edit-btn" data-id="${product.id}"><i data-lucide="edit"></i></button>
                    <button class="btn-icon delete-btn" data-id="${product.id}"><i data-lucide="trash-2"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        renderIcons(); // Render icons for dynamically added rows
    }
};

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(productForm);
    const productData = Object.fromEntries(formData.entries());
    const productId = productIdInput.value;

    let result;
    if (productId) {
        result = await supabase.from('produtos').update(productData).eq('id', productId);
    } else {
        result = await supabase.from('produtos').insert([productData]);
    }

    if (result.error) {
        alert('Erro ao salvar produto: ' + result.error.message);
    } else {
        closeModal();
        fetchProducts();
    }
});

tableBody.addEventListener('click', async (e) => {
    const editButton = e.target.closest('.edit-btn');
    const deleteButton = e.target.closest('.delete-btn');

    if (editButton) {
        const productId = editButton.dataset.id;
        const { data: product, error } = await supabase.from('produtos').select('*').eq('id', productId).single();
        if (error) {
            alert('Erro ao buscar dados do produto.');
        } else {
            openModal(product);
        }
    }

    if (deleteButton) {
        const productId = deleteButton.dataset.id;
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            const { error } = await supabase.from('produtos').delete().eq('id', productId);
            if (error) {
                alert('Erro ao excluir produto: ' + error.message);
            } else {
                fetchProducts();
            }
        }
    }
});

addProductBtn.addEventListener('click', () => openModal());
cancelBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Initial fetch
fetchProductGroups();
fetchProducts();
