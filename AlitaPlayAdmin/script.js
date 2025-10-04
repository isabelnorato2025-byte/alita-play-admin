// VARIÁVEL GLOBAL PARA ARMAZENAR O EMAIL/USUÁRIO DO REVENDEDOR LOGADO
let currentRevendedorUser = null; 

document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const loginScreen = document.getElementById('login-screen');
    const dashboardApp = document.getElementById('dashboard-app');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Elementos de Login
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // Elementos do Dashboard
    const totalClientesSpan = document.getElementById('totalClientes');
    const totalClientesCard = document.getElementById('totalClientesCard');
    const welcomeUser = document.getElementById('welcome-user');
    const displayUserEmail = document.getElementById('display-user-email');
    const mainMenu = document.getElementById('main-menu');
    const dashboardContent = document.getElementById('dashboard-content');


    // Senha "123456" codificada em Base64 é "MTIzNDU2"
    // Senha "APL@1910z" codificada em Base64 é "QVBMAEAxOTEwWg=="
    const USUARIOS_MOCK = {
        "alitaplayz": { hash: "QVBMAEAxOTEwWg==", profile: "owner" }, // NOVO: Usuário Owner
        "revendedor1@alita.com": { hash: "MTIzNDU2", profile: "revendedor" }, 
        "revendedor2@alita.com": { hash: "MTIzNDU2", profile: "revendedor" }  
    };

    function decodeBase64(encoded) {
        // A função atob() decodifica de Base64
        return atob(encoded);
    }
    
    // --- FUNÇÕES DE ARMAZENAMENTO E DADOS ---

    // ❗ CHAVE ÚNICA DO LOCAL STORAGE BASEADA NO USUÁRIO LOGADO ❗
    function getStorageKey(user) {
        return `clientes_admin_pro_${user.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }

    function carregarClientes() {
        if (!currentRevendedorUser) return [];
        const key = getStorageKey(currentRevendedorUser);
        const clientesJSON = localStorage.getItem(key);
        return clientesJSON ? JSON.parse(clientesJSON) : [];
    }

    function salvarClientes(clientes) {
        if (!currentRevendedorUser) return;
        const key = getStorageKey(currentRevendedorUser);
        localStorage.setItem(key, JSON.stringify(clientes));
    }
    
    // Funções para salvar/carregar credenciais do "Lembrar de mim"
    function saveCredentials(user, password) {
        localStorage.setItem('remembered_user', user);
        localStorage.setItem('remembered_password', btoa(password)); // Salva a senha codificada
    }

    function clearCredentials() {
        localStorage.removeItem('remembered_user');
        localStorage.removeItem('remembered_password');
    }

    function loadCredentials() {
        const user = localStorage.getItem('remembered_user');
        const encodedPassword = localStorage.getItem('remembered_password');
        
        if (user && encodedPassword) {
            loginEmailInput.value = user;
            // Não pré-preenche a senha por segurança, mas marca o checkbox
            rememberMeCheckbox.checked = true;
            
            // Opcional: pré-preencher a senha, apenas para fins de demonstração (Remover em produção real)
            // loginPasswordInput.value = decodeBase64(encodedPassword); 
        }
    }

    // --- FUNÇÕES DE TELA E MENU ---

    function generateMenu(profile) {
        let menuHTML = '';
        if (profile === 'owner') {
            menuHTML = `
                <li><a href="#" class="active"><i class="fas fa-hammer"></i> Painel Owner</a></li>
                <li><a href="#"><i class="fas fa-users-cog"></i> Gerenciar Revendedores</a></li>
                <li><a href="#"><i class="fas fa-server"></i> Status do Sistema</a></li>
                <li><a href="#"><i class="fas fa-chart-line"></i> Relatórios Globais</a></li>
            `;
            // Atualiza o título
            document.querySelector('.top-header h1').innerHTML = `<span class="fade-in-down">Painel do Owner:</span> <span id="welcome-user"></span>`;
        } else if (profile === 'revendedor') {
            menuHTML = `
                <li><a href="#" class="active"><i class="fas fa-home"></i> Início</a></li>
                <li><a href="#"><i class="fas fa-users"></i> Meus Clientes</a></li>
                <li><a href="#"><i class="fas fa-tags"></i> Planos & Valores</a></li>
                <li><a href="#"><i class="fas fa-truck"></i> Fornecedores</a></li>
                <li><a href="#"><i class="fas fa-file-invoice-dollar"></i> Financeiro</a></li>
            `;
            // Atualiza o título
            document.querySelector('.top-header h1').innerHTML = `<span class="fade-in-down">Painel do Revendedor:</span> <span id="welcome-user"></span>`;
        }
        mainMenu.innerHTML = menuHTML;
    }

    function showDashboard(user, profile) {
        currentRevendedorUser = user;
        loginScreen.classList.add('hidden');
        dashboardApp.classList.remove('hidden');
        
        // Configura o menu e o título
        generateMenu(profile);
        
        // Atualiza informações do Revendedor no painel
        welcomeUser.textContent = user.split('@')[0].toUpperCase();
        displayUserEmail.textContent = `Olá, ${user}`;
        
        // Se for Revendedor, renderiza a tabela (O Owner não tem tabela de clientes padrão)
        if (profile === 'revendedor') {
            // AQUI VOCÊ PODE CARREGAR A TELA DE GESTÃO DE CLIENTES DO REVENDEDOR
            // Por enquanto, apenas atualiza os cards
            renderizarTabela(); 
        } else if (profile === 'owner') {
            // AQUI VOCÊ CARREGA O CONTEÚDO ESPECÍFICO DO OWNER
             dashboardContent.innerHTML = `<div class="data-management fade-in-up delay-5">
                <h2><i class="fas fa-hammer"></i> Gerenciamento do Sistema</h2>
                <p>Este é o painel de nível superior. Use o menu lateral para gerenciar Revendedores e configurações globais.</p>
                </div>`;
        }
        
        Toastify({
            text: `Bem-vindo, ${user}! Seu painel (${profile.toUpperCase()}) foi carregado.`,
            duration: 3000,
            close: true,
            gravity: "top", 
            position: "right",
            style: { background: "#18BC9C", color: "#121212", fontWeight: "bold" }
        }).showToast();
    }

    function showLogin(showToast = false) { 
        localStorage.removeItem('current_revendedor_user');
        currentRevendedorUser = null;
        dashboardApp.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        
        // Limpa a senha, mas mantém o usuário se "Lembrar de mim" estiver marcado
        loginPasswordInput.value = '';

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
        const user = loginEmailInput.value.toLowerCase();
        const password = loginPasswordInput.value;
        const rememberMe = rememberMeCheckbox.checked;
        
        const userData = USUARIOS_MOCK[user];

        if (userData && decodeBase64(userData.hash) === password) {
            
            // Lógica de "Lembrar de mim"
            if (rememberMe) {
                saveCredentials(user, password);
            } else {
                clearCredentials();
            }

            localStorage.setItem('current_revendedor_user', user);
            showDashboard(user, userData.profile);

        } else {
            Toastify({
                text: "Credenciais inválidas. Verifique seu usuário e senha.",
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
        showLogin(true); 
    });
    
    // LÓGICA DE INICIALIZAÇÃO E SPLASH SCREEN
    
    function initializeApp() {
        // 1. Tenta pré-preencher credenciais salvas
        loadCredentials();

        // 2. Tenta fazer login automático se a sessão ainda estiver ativa
        const storedUser = localStorage.getItem('current_revendedor_user');
        if (storedUser) {
            const userData = USUARIOS_MOCK[storedUser];
            if (userData) {
                 showDashboard(storedUser, userData.profile);
            } else {
                 showLogin(); 
            }
        } else {
            showLogin(); 
        }
    }
    
    // Atraso de 4 segundos para o Splash Screen
    setTimeout(() => {
        splashScreen.classList.add('splash-fade-out'); 
        initializeApp(); 
    }, 4000); 

    // --- FUNÇÕES DO DASHBOARD (MANTIDAS DO REVENDEDOR POR ENQUANTO) ---
    // Estas funções só serão usadas se o perfil for 'revendedor'
    
    function renderizarTabela(data = carregarClientes()) {
        const listaClientesBody = document.getElementById('listaClientesBody');
        
        if (!listaClientesBody) return; // Se for o Owner, o corpo da tabela pode não existir na view
        
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
        
        // Este seletor assume que o card de faturamento é o segundo.
        const faturamentoCard = document.querySelector('.summary-cards .card-value:nth-child(2)');
        if(faturamentoCard) {
            faturamentoCard.textContent = `R$ ${totalFaturamento.toFixed(2).replace('.', ',')}`;
        }
    }

    // Ações de formulário e exclusão foram omitidas por serem específicas do Revendedor,
    // mas devem ser movidas para dentro da lógica de carregamento do conteúdo do Revendedor (próximos passos).
});
