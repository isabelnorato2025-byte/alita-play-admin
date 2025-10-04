// VARIÁVEL GLOBAL PARA ARMAZENAR O EMAIL DO REVENDEDOR LOGADO
let currentRevendedorEmail = null; 

document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const dashboardApp = document.getElementById('dashboard-app');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Elementos do Dashboard
    const form = document.getElementById('cadastroClienteForm');
    const listaClientesBody = document.getElementById('listaClientesBody');
    const totalClientesSpan = document.getElementById('totalClientes');
    const totalClientesCard = document.getElementById('totalClientesCard');
    const welcomeUser = document.getElementById('welcome-user');
    const displayUserEmail = document.getElementById('display-user-email');

    // ❗ CHAVE ÚNICA DO LOCAL STORAGE BASEADA NO EMAIL DO REVENDEDOR ❗
    function getStorageKey(email) {
        // Ex: "clientes_admin_pro_joao@email.com"
        return `clientes_admin_pro_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }

    // --- FUNÇÕES DE GERENCIAMENTO DE DADOS ---

    function carregarClientes() {
        if (!currentRevendedorEmail) return [];
        const key = getStorageKey(currentRevendedorEmail);
        const clientesJSON = localStorage.getItem(key);
        return clientesJSON ? JSON.parse(clientesJSON) : [];
    }

    function salvarClientes(clientes) {
        if (!currentRevendedorEmail) return;
        const key = getStorageKey(currentRevendedorEmail);
        localStorage.setItem(key, JSON.stringify(clientes));
    }

    // --- FUNÇÕES DE TELA ---

    function showDashboard(email) {
        currentRevendedorEmail = email;
        loginScreen.classList.add('hidden');
        dashboardApp.classList.remove('hidden');
        
        // Atualiza informações do Revendedor no painel
        welcomeUser.textContent = email.split('@')[0].toUpperCase();
        displayUserEmail.textContent = `Olá, ${email}`;
        
        renderizarTabela(); 
        
        Toastify({
            text: `Bem-vindo, ${email}! Seu painel foi carregado.`,
            duration: 3000,
            close: true,
            gravity: "top", 
            position: "right",
            style: { background: "#18BC9C", color: "#121212", fontWeight: "bold" }
        }).showToast();
    }

    function showLogin() {
        localStorage.removeItem('current_revendedor_email');
        currentRevendedorEmail = null;
        dashboardApp.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        
        Toastify({
            text: "Você saiu do painel com segurança.",
            duration: 3000,
            close: true,
            gravity: "top", 
            position: "right",
            style: { background: "#E74C3C", color: "white", fontWeight: "bold" }
        }).showToast();
    }

    // --- AUTENTICAÇÃO E EVENTOS ---

    // Senha "123456" codificada em Base64 é "MTIzNDU2"
    const USUARIOS_MOCK = {
        "revendedor1@alita.com": "MTIzNDU2", 
        "revendedor2@alita.com": "MTIzNDU2"  
    };

    function decodeBase64(encoded) {
        // Usa a função nativa do navegador para decodificar o hash
        return atob(encoded);
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.toLowerCase();
        const password = document.getElementById('loginPassword').value;
        
        const storedHash = USUARIOS_MOCK[email];

        // Compara a senha digitada com a senha decodificada do código
        if (storedHash && decodeBase64(storedHash) === password) {
            // Guarda o email na sessão para manter o login após recarregar a página
            localStorage.setItem('current_revendedor_email', email);
            showDashboard(email);
        } else {
            Toastify({
                text: "Credenciais inválidas. Verifique seu email e senha.",
                duration: 4000,
                close: true,
                gravity: "top", 
                position: "center",
                style: { background: "red", color: "white", fontWeight: "bold" }
            }).showToast();
        }
    });

    // Logout
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });

    // Verifica se há um usuário logado ao carregar a página
    const storedEmail = localStorage.getItem('current_revendedor_email');
    if (storedEmail) {
        // Verifica se o email armazenado existe na lista de usuários MOCK
        if (USUARIOS_MOCK[storedEmail]) {
             showDashboard(storedEmail);
        } else {
             // Caso o usuário tenha sido removido da lista MOCK
             showLogin();
        }
    } else {
        showLogin();
    }
    
    // --- FUNÇÕES DO DASHBOARD (Ajustadas para usar a nova lógica de dados) ---
    
    function renderizarTabela(data = carregarClientes()) {
        listaClientesBody.innerHTML = '';
        
        let totalFaturamento = 0;

        data.forEach((cliente, index) => {
            const row = listaClientesBody.insertRow();
            
            row.insertCell().textContent = index + 1; 
            row.insertCell().textContent = cliente.nome;
            row.insertCell().textContent = cliente.plano;
            
            const valor = parseFloat(cliente.valor || 0);
            row.insertCell().textContent = `R$ ${valor.toFixed(2).replace('.', ',')}`;
            totalFaturamento += valor; 
            
            row.insertCell().textContent = cliente.fornecedor;
            
            const acoesCell = row.insertCell();
            const btnExcluir = document.createElement('button');
            btnExcluir.textContent = 'Excluir';
            btnExcluir.classList.add('btn-delete');
            
            btnExcluir.onclick = () => excluirCliente(carregarClientes().findIndex(c => c.nome === cliente.nome && c.plano === cliente.plano)); 
            
            acoesCell.appendChild(btnExcluir);
        });

        const clientesCompletos = carregarClientes();
        totalClientesSpan.textContent = clientesCompletos.length;
        totalClientesCard.textContent = clientesCompletos.length; 
        
        // Atualiza Faturamento
        document.querySelector('.card-value:nth-child(2)').textContent = `R$ ${totalFaturamento.toFixed(2).replace('.', ',')}`;
    }

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

        Toastify({
            text: `Cliente "${nome}" cadastrado com sucesso!`,
            duration: 3000,
            close: true,
            gravity: "top", 
            position: "right",
            style: { background: "#18BC9C", color: "#121212", fontWeight: "bold" }
        }).showToast();

        form.reset();
        renderizarTabela();
        document.getElementById('searchInput').value = ''; 
    });

    window.excluirCliente = function(index) {
        if (index === -1 || !confirm("Tem certeza que deseja EXCLUIR este registro?")) return;

        let clientes = carregarClientes();
        const nomeCliente = clientes[index].nome;
        
        clientes.splice(index, 1);
        salvarClientes(clientes);
        renderizarTabela();

        Toastify({
            text: `Cliente "${nomeCliente}" excluído.`,
            duration: 4000,
            close: true,
            gravity: "top",
            position: "right",
            style: { background: "#E74C3C", color: "white", fontWeight: "bold" }
        }).showToast();
        
        filterTable(); 
    }

    window.filterTable = function() {
        const input = document.getElementById('searchInput').value.toLowerCase();
        const clientes = carregarClientes();
        
        const clientesFiltrados = clientes.filter(cliente => {
            return cliente.nome.toLowerCase().includes(input) || 
                   cliente.plano.toLowerCase().includes(input);
        });

        renderizarTabela(clientesFiltrados);
    }
});
