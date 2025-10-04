// VARIÁVEL GLOBAL PARA ARMAZENAR O EMAIL DO REVENDEDOR LOGADO
let currentRevendedorEmail = null; 

document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
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

    // Senha "123456" codificada em Base64 é "MTIzNDU2"
    const USUARIOS_MOCK = {
        "revendedor1@alita.com": "MTIzNDU2", 
        "revendedor2@alita.com": "MTIzNDU2"  
    };

    function decodeBase64(encoded) {
        return atob(encoded);
    }
    
    // ❗ CHAVE ÚNICA DO LOCAL STORAGE BASEADA NO EMAIL DO REVENDEDOR ❗
    function getStorageKey(email) {
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

    // MUDANÇA: Parâmetro showToast para controlar a mensagem de "Saída"
    function showLogin(showToast = false) { 
        localStorage.removeItem('current_revendedor_email');
        currentRevendedorEmail = null;
        dashboardApp.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        
        if (showToast) {
            Toastify({
                text: "Você saiu do painel com segurança.",
                duration: 3000,
                close: true,
                gravity: "top", 
                position: "right",
                style: { background: "#E74C3C", color: "white", fontWeight: "bold" }
            }).showToast();
        }
    }

    // --- AUTENTICAÇÃO E EVENTOS ---

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.toLowerCase();
        const password = document.getElementById('loginPassword').value;
        
        const storedHash = USUARIOS_MOCK[email];

        if (storedHash && decodeBase64(storedHash) === password) {
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

    // Logout: CHAMAR showLogin(true) para MOSTRAR O TOAST
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showLogin(true); 
    });
    
    // LÓGICA DE INICIALIZAÇÃO E SPLASH SCREEN
    
    function initializeApp() {
        const storedEmail = localStorage.getItem('current_revendedor_email');
        if (storedEmail) {
            if (USUARIOS_MOCK[storedEmail]) {
                 showDashboard(storedEmail);
            } else {
                 showLogin();
            }
        } else {
            showLogin();
        }
    }
    
    // Adiciona um atraso para mostrar o Splash Screen
    setTimeout(() => {
        splashScreen.classList.add('splash-fade-out'); // Faz o splash desaparecer
        initializeApp(); // Inicia o login/dashboard
    }, 2500); // 2.5 segundos

    // --- FUNÇÕES DO DASHBOARD ---
    
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
