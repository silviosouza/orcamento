import { supabase } from '../supabaseClient.js';
import { renderIcons } from './icons.js';

renderIcons(); // Render static icons on page load

const content = document.getElementById('price-list-content');
const loading = document.getElementById('loading-state');
const printBtn = document.getElementById('print-btn');

const formatCurrency = (value) => {
    if (typeof value !== 'number') {
        return 'N/A';
    }
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const loadPriceList = async () => {
    const { data: products, error } = await supabase
        .from('produtos')
        .select('nome, preco, grupos_produtos ( nome )')
        .order('nome', { foreignTable: 'grupos_produtos', ascending: true })
        .order('nome', { ascending: true });

    loading.style.display = 'none';

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        content.innerHTML = '<p class="error-message">Não foi possível carregar a lista de preços.</p>';
        return;
    }

    if (products.length === 0) {
        content.innerHTML = '<p>Nenhum produto cadastrado para exibir.</p>';
        return;
    }

    // Agrupar produtos por grupo
    const groupedProducts = products.reduce((acc, product) => {
        const groupName = product.grupos_produtos?.nome || 'Outros';
        if (!acc[groupName]) {
            acc[groupName] = [];
        }
        acc[groupName].push(product);
        return acc;
    }, {});

    renderPriceList(groupedProducts);
};

const renderPriceList = (groupedProducts) => {
    let html = '';

    for (const groupName in groupedProducts) {
        html += `
            <section class="price-group">
                <h2 class="group-title">${groupName}</h2>
                <div class="product-grid">
        `;

        groupedProducts[groupName].forEach(product => {
            html += `
                <div class="product-card-price">
                    <h3 class="product-name">${product.nome}</h3>
                    <p class="product-price">${formatCurrency(product.preco)}</p>
                </div>
            `;
        });

        html += `
                </div>
            </section>
        `;
    }

    content.innerHTML = html;
};

printBtn.addEventListener('click', () => {
    window.print();
});

loadPriceList();
