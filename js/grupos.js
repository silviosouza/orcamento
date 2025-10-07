import { supabase } from '../supabaseClient.js';
import { renderIcons } from './icons.js';

renderIcons(); // Render static icons on page load

const tableBody = document.querySelector('#groups-table tbody');
const loading = document.getElementById('loading-state');
const modal = document.getElementById('group-modal');
const modalTitle = document.getElementById('modal-title');
const groupForm = document.getElementById('group-form');
const groupIdInput = document.getElementById('group-id');
const addGroupBtn = document.getElementById('add-group-btn');
const cancelBtn = document.getElementById('cancel-btn');

const openModal = (group = null) => {
    groupForm.reset();
    if (group) {
        modalTitle.textContent = 'Editar Grupo';
        groupIdInput.value = group.id;
        document.getElementById('nome').value = group.nome;
    } else {
        modalTitle.textContent = 'Adicionar Grupo';
        groupIdInput.value = '';
    }
    modal.style.display = 'flex';
};

const closeModal = () => {
    modal.style.display = 'none';
};

const fetchGroups = async () => {
    loading.style.display = 'block';
    tableBody.innerHTML = '';

    const { data: groups, error } = await supabase
        .from('grupos_produtos')
        .select('*')
        .order('nome', { ascending: true });

    loading.style.display = 'none';

    if (error) {
        console.error('Erro ao buscar grupos:', error);
        tableBody.innerHTML = `<tr><td colspan="2">Erro ao carregar dados.</td></tr>`;
        return;
    }

    if (groups.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="2">Nenhum grupo cadastrado.</td></tr>`;
    } else {
        groups.forEach(group => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${group.nome}</td>
                <td class="actions">
                    <button class="btn-icon edit-btn" data-id="${group.id}"><i data-lucide="edit"></i></button>
                    <button class="btn-icon delete-btn" data-id="${group.id}"><i data-lucide="trash-2"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        renderIcons(); // Render icons for dynamically added rows
    }
};

groupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(groupForm);
    const groupData = Object.fromEntries(formData.entries());
    const groupId = groupIdInput.value;

    let result;
    if (groupId) {
        result = await supabase.from('grupos_produtos').update(groupData).eq('id', groupId);
    } else {
        result = await supabase.from('grupos_produtos').insert([groupData]);
    }

    if (result.error) {
        alert('Erro ao salvar grupo: ' + result.error.message);
    } else {
        closeModal();
        fetchGroups();
    }
});

tableBody.addEventListener('click', async (e) => {
    const editButton = e.target.closest('.edit-btn');
    const deleteButton = e.target.closest('.delete-btn');

    if (editButton) {
        const groupId = editButton.dataset.id;
        const { data: group, error } = await supabase.from('grupos_produtos').select('*').eq('id', groupId).single();
        if (error) {
            alert('Erro ao buscar dados do grupo.');
        } else {
            openModal(group);
        }
    }

    if (deleteButton) {
        const groupId = deleteButton.dataset.id;
        if (confirm('Tem certeza que deseja excluir este grupo? Produtos associados a ele podem ser afetados.')) {
            const { error } = await supabase.from('grupos_produtos').delete().eq('id', groupId);
            if (error) {
                alert('Erro ao excluir grupo: ' + error.message);
            } else {
                fetchGroups();
            }
        }
    }
});

addGroupBtn.addEventListener('click', () => openModal());
cancelBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

fetchGroups();
