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


    // MOCK DE USUÁRIOS: SENHA DO OWNER SIMPLIFICADA PARA EVITAR ERROS DE BASE64
    const USUARIOS_MOCK = {
        // CORRIGIDO: Senha em texto simples 'APL@1910z'
        "alitaplayz": { hash: "APL@1910z", profile: "owner" }, 
        
        // MANTIDO: Revendedores usando '123456' (Base64: 'MTIzNDU2')
        "revendedor1@alita.com": { hash: "MTIzNDU2", profile: "revendedor" }, 
        "revendedor2@alita.com": { hash: "MTIzNDU2", profile: "revendedor" }  
    };

    // Apenas para decodificar senhas do Revendedor
    function decodeBase64(encoded) {
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
        // Salvamos a senha (real ou hash) aqui. No caso do Owner é real, no Revendedor é hash.
        const storedPassword = USUARIOS_MOCK[user].profile === 'owner' ? btoa(password) : password;
        localStorage.setItem('remembered_password', storedPassword); 
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
            rememberMeCheckbox.checked = true;
            
            // Opcional: pré-preencher a senha, apenas para fins de demonstração (Remover em produção real)
            // if (user === 'alitaplayz') {
            //      loginPasswordInput.value = decodeBase64(encodedPassword);
            // } 
        }
    }

    // --- FUNÇÕES DE TELA E MENU ---

    function generateMenu(profile) {
        let menuHTML = '';
        if (profile === 'owner') {
            menuHTML = `
                <li><a href="#" class="active"><i class="fas fa-hammer"></i> Painel Owner</a></li>
                <li><a href="#" id="menuGerenciarRevendedores"><i class="fas fa-users-cog"></i> Gerenciar Revendedores</a></li>
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
        
        if (profile === 'revendedor') {
            // Implementação futura da tela do Revendedor
            renderizarTabela(); 
        } else if (profile === 'owner') {
            // Conteúdo inicial do Owner: Gerenciar Revendedores
             loadOwnerRevendedorView();
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
        let authSuccessful = false;

        if (userData) {
            // Lógica de autenticação para o Owner (senha real)
            if (userData.profile === 'owner') {
                authSuccessful = (userData.hash === password);
            } 
            // Lógica de autenticação para o Revendedor (senha em Base64)
            else if (userData.profile === 'revendedor') {
                try {
                    authSuccessful = (decodeBase64(userData.hash) === password);
                } catch (error) {
                    console.error("Erro na decodificação Base64:", error);
                    authSuccessful = false;
                }
            }
        }


        if (authSuccessful) {
            
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

    // --- FUNÇÕES DO DASHBOARD REVENDEDOR (SIMPLIFICADAS) ---
    function renderizarTabela(data = carregarClientes()) {
        // Esta é a função do Revendedor, deixaremos vazia por enquanto
    }

    // --- FUNÇÕES DO DASHBOARD OWNER (PRÓXIMO PASSO) ---
    function loadOwnerRevendedorView() {
        // Conteúdo inicial da tela "Gerenciar Revendedores"
        dashboardContent.innerHTML = `
            <section class="summary-cards">
                <div class="card fade-in-up delay-2">
                    <i class="fas fa-users-cog icon-card"></i>
                    <h3>Total de Revendedores</h3>
                    <p class="card-value" id="totalRevendedoresCard">2</p>
                </div>
                <div class="card fade-in-up delay-3">
                    <i class="fas fa-sign-in-alt icon-card"></i>
                    <h3>Revendedores Ativos</h3>
                    <p class="card-value">2</p>
                </div>
                <div class="card fade-in-up delay-4">
                    <i class="fas fa-handshake icon-card"></i>
                    <h3>Fornecedores Globais</h3>
                    <p class="card-value">12</p>
                </div>
            </section>
            
            <div class="data-management fade-in-up delay-5">
                <h2><i class="fas fa-users-cog"></i> Gerenciar Contas de Revendedores</h2>
                <p>Aqui você poderá cadastrar, editar e desativar contas de Revendedores.</p>
                </div>
        `;
    }
});
