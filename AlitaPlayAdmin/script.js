document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cadastroClienteForm');
    const listaClientesBody = document.getElementById('listaClientesBody');
    const totalClientesSpan = document.getElementById('totalClientes');
    const totalClientesCard = document.getElementById('totalClientesCard');

    // Funções de Gerenciamento do LocalStorage
    function carregarClientes() {
        const clientesJSON = localStorage.getItem('clientes_admin_pro');
        return clientesJSON ? JSON.parse(clientesJSON) : [];
    }

    function salvarClientes(clientes) {
        localStorage.setItem('clientes_admin_pro', JSON.stringify(clientes));
    }

    // Função principal para montar a tabela
    function renderizarTabela(data = carregarClientes()) {
        listaClientesBody.innerHTML = '';
        
        data.forEach((cliente, index) => {
            const row = listaClientesBody.insertRow();
            
            row.insertCell().textContent = index + 1; 
            row.insertCell().textContent = cliente.nome;
            row.insertCell().textContent = cliente.plano;
            row.insertCell().textContent = `R$ ${parseFloat(cliente.valor).toFixed(2).replace('.', ',')}`;
            row.insertCell().textContent = cliente.fornecedor;
            
            const acoesCell = row.insertCell();
            
            const btnExcluir = document.createElement('button');
            btnExcluir.textContent = 'Excluir';
            btnExcluir.classList.add('btn-delete');
            
            // Usamos a busca por nome/plano para excluir o item correto
            btnExcluir.onclick = () => excluirCliente(carregarClientes().findIndex(c => c.nome === cliente.nome && c.plano === cliente.plano)); 
            
            acoesCell.appendChild(btnExcluir);
        });

        // Atualiza contadores (sempre baseado no array completo)
        const clientesCompletos = carregarClientes();
        totalClientesSpan.textContent = clientesCompletos.length;
        totalClientesCard.textContent = clientesCompletos.length; 
    }

    // NOVA FUNÇÃO DE FILTRO DE BUSCA
    window.filterTable = function() {
        const input = document.getElementById('searchInput').value.toLowerCase();
        const clientes = carregarClientes();
        
        const clientesFiltrados = clientes.filter(cliente => {
            return cliente.nome.toLowerCase().includes(input) || 
                   cliente.plano.toLowerCase().includes(input);
        });

        renderizarTabela(clientesFiltrados);
    }

    // Evento de Submissão do Formulário
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome').value;
        const plano = document.getElementById('plano').value;
        const valor = document.getElementById('valor').value;
        const fornecedor = document.getElementById('fornecedor').value;

        const novoCliente = { nome, plano, valor, fornecedor };

        const clientes = carregarClientes();
        clientes.push(novoCliente);
        salvarClientes(clientes);

        // Notificação Visual Toastify
        Toastify({
            text: `Cliente "${nome}" cadastrado com sucesso!`,
            duration: 3000,
            close: true,
            gravity: "top", 
            position: "right",
            stopOnFocus: true,
            style: {
                background: "#18BC9C", 
                color: "#121212",
                fontWeight: "bold"
            }
        }).showToast();

        form.reset();
        renderizarTabela();
        document.getElementById('searchInput').value = ''; 
    });

    // Função de Exclusão com Notificação
    window.excluirCliente = function(index) {
        if (index === -1 || !confirm("Tem certeza que deseja EXCLUIR este registro? Esta ação é irreversível (localmente).")) return;

        let clientes = carregarClientes();
        const nomeCliente = clientes[index].nome;
        
        clientes.splice(index, 1);
        salvarClientes(clientes);
        renderizarTabela();

        // Notificação de Exclusão (Vermelha)
        Toastify({
            text: `Cliente "${nomeCliente}" excluído.`,
            duration: 4000,
            close: true,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: {
                background: "#E74C3C",
                color: "white",
                fontWeight: "bold"
            }
        }).showToast();
        
        filterTable(); 
    }
    
    renderizarTabela();
});