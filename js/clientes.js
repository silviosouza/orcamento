import { supabase } from '../supabaseClient.js';
import { renderIcons } from './icons.js';

renderIcons(); // Render static icons on page load

const tableBody = document.querySelector('#clients-table tbody');
const loading = document.getElementById('loading-state');
const modal = document.getElementById('client-modal');
const modalTitle = document.getElementById('modal-title');
const clientForm = document.getElementById('client-form');
const clientIdInput = document.getElementById('client-id');
const addClientBtn = document.getElementById('add-client-btn');
const cancelBtn = document.getElementById('cancel-btn');

const openModal = (client = null) => {
    clientForm.reset();
    if (client) {
        modalTitle.textContent = 'Editar Cliente';
        clientIdInput.value = client.id;
        document.getElementById('nome').value = client.nome;
        document.getElementById('email').value = client.email;
        document.getElementById('telefone').value = client.telefone;
    } else {
        modalTitle.textContent = 'Adicionar Cliente';
        clientIdInput.value = '';
    }
    modal.style.display = 'flex';
};

const closeModal = () => {
    modal.style.display = 'none';
};

const fetchClients = async () => {
    loading.style.display = 'block';
    tableBody.innerHTML = '';

    const { data: clientes, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

    loading.style.display = 'none';

    if (error) {
        console.error('Erro ao buscar clientes:', error);
        tableBody.innerHTML = `<tr><td colspan="4">Erro ao carregar dados.</td></tr>`;
        return;
    }

    if (clientes.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4">Nenhum cliente cadastrado.</td></tr>`;
    } else {
        clientes.forEach(client => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${client.nome}</td>
                <td>${client.email || ''}</td>
                <td>${client.telefone || ''}</td>
                <td class="actions">
                    <button class="btn-icon edit-btn" data-id="${client.id}"><i data-lucide="edit"></i></button>
                    <button class="btn-icon delete-btn" data-id="${client.id}"><i data-lucide="trash-2"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        renderIcons(); // Render icons for dynamically added rows
    }
};

clientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(clientForm);
    const clientData = Object.fromEntries(formData.entries());
    const clientId = clientIdInput.value;

    let result;
    if (clientId) {
        // Update
        result = await supabase.from('clientes').update(clientData).eq('id', clientId);
    } else {
        // Insert
        result = await supabase.from('clientes').insert([clientData]);
    }

    if (result.error) {
        alert('Erro ao salvar cliente: ' + result.error.message);
    } else {
        closeModal();
        fetchClients();
    }
});

tableBody.addEventListener('click', async (e) => {
    const editButton = e.target.closest('.edit-btn');
    const deleteButton = e.target.closest('.delete-btn');

    if (editButton) {
        const clientId = editButton.dataset.id;
        const { data: client, error } = await supabase.from('clientes').select('*').eq('id', clientId).single();
        if (error) {
            alert('Erro ao buscar dados do cliente.');
        } else {
            openModal(client);
        }
    }

    if (deleteButton) {
        const clientId = deleteButton.dataset.id;
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            const { error } = await supabase.from('clientes').delete().eq('id', clientId);
            if (error) {
                alert('Erro ao excluir cliente: ' + error.message);
            } else {
                fetchClients();
            }
        }
    }
});

addClientBtn.addEventListener('click', () => openModal());
cancelBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Initial fetch
fetchClients();
