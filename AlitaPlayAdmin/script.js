// VARIÁVEL GLOBAL PARA ARMAZENAR O CÓDIGO DO USUÁRIO LOGADO
let currentRevendedorUser = null; 

document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const loginScreen = document.getElementById('login-screen');
    const dashboardApp = document.getElementById('dashboard-app');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Elementos de Login
    const loginCodeInput = document.getElementById('loginCode'); // Campo de Código
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // Elementos do Dashboard
    const welcomeUser = document.getElementById('welcome-user');
    const displayUserEmail = document.getElementById('display-user-email');
    const mainMenu = document.getElementById('main-menu');
    const dashboardContent = document.getElementById('dashboard-content');


    // MOCK DE USUÁRIOS: CHAVE AGORA É O CÓDIGO DE ACESSO (em minúsculo)
    const REVENDEDOR_STORAGE_KEY = 'alita_play_revendedores_mock';

    let USUARIOS_MOCK = {
        // OWNER (ADMINISTRADOR)
        "alita-owner": { id: "OWN-001", code: "ALITA-OWNER", profile: "owner", status: "ativo", name: "AlitaPlayz" }, 
        
        // REVENDEDORES
        "rvd-001": { id: "RVD-001", code: "RVD-001", profile: "revendedor", status: "ativo", email: "revendedor1@alita.com" }, 
        "rvd-002": { id: "RVD-002", code: "RVD-002", profile: "revendedor", status: "ativo", email: "revendedor2@alita.com" }  
    };

    // --- FUNÇÕES DE DADOS GLOBAIS (Owner e Revendedor) ---

    function loadUsersMock() {
        const storedRevendedores = localStorage.getItem(REVENDEDOR_STORAGE_KEY);
        if (storedRevendedores) {
            const revendedores = JSON.parse(storedRevendedores);
            USUARIOS_MOCK = {
                "alita-owner": USUARIOS_MOCK["alita-owner"],
                ...revendedores
            };
        }
        return USUARIOS_MOCK;
    }

    function saveRevendedoresToStorage() {
        const revendedores = Object.keys(USUARIOS_MOCK)
            .filter(key => USUARIOS_MOCK[key].profile === 'revendedor')
            .reduce((obj, key) => {
                obj[key] = USUARIOS_MOCK[key];
                return obj;
            }, {});
        
        localStorage.setItem(REVENDEDOR_STORAGE_KEY, JSON.stringify(revendedores));
    }
    
    // Chave única para clientes, baseada no código do revendedor logado
    function getClientesStorageKey(code) {
        return `clientes_data_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }

    function carregarClientes() {
        if (!currentRevendedorUser) return [];
        const key = getClientesStorageKey(currentRevendedorUser);
        const clientesJSON = localStorage.getItem(key);
        return clientesJSON ? JSON.parse(clientesJSON) : [];
    }

    function salvarClientes(clientes) {
        if (!currentRevendedorUser) return;
        const key = getClientesStorageKey(currentRevendedorUser);
        localStorage.setItem(key, JSON.stringify(clientes));
    }

    // --- FUNÇÕES DE AUTENTICAÇÃO E TELA ---

    function saveCredentials(code) {
        localStorage.setItem('remembered_code', code);
    }

    function clearCredentials() {
        localStorage.removeItem('remembered_code');
    }

    function loadCredentials() {
        const code = localStorage.getItem('remembered_code');
        
        if (code) {
            loginCodeInput.value = code;
            rememberMeCheckbox.checked = true;
        }
    }

    function generateMenu(profile) {
        let menuHTML = '';
        if (profile === 'owner') {
            menuHTML = `
                <li><a href="#" class="active" data-view="gerenciar-revendedores"><i class="fas fa-users-cog"></i> Gerenciar Revendedores</a></li>
                <li><a href="#" data-view="status-sistema"><i class="fas fa-server"></i> Status do Sistema</a></li>
                <li><a href="#" data-view="relatorios-globais"><i class="fas fa-chart-line"></i> Relatórios Globais</a></li>
            `;
            document.querySelector('.top-header h1').innerHTML = `<span class="fade-in-down">Painel do Owner:</span> <span id="welcome-user"></span>`;
        } else if (profile === 'revendedor') {
            menuHTML = `
                <li><a href="#" class="active" data-view="revendedor-dashboard"><i class="fas fa-home"></i> Início</a></li>
                <li><a href="#" data-view="meus-clientes"><i class="fas fa-users"></i> Meus Clientes</a></li>
                <li><a href="#" data-view="planos-valores"><i class="fas fa-tags"></i> Planos & Valores</a></li>
                <li><a href="#" data-view="financeiro"><i class="fas fa-file-invoice-dollar"></i> Financeiro</a></li>
            `;
            document.querySelector('.top-header h1').innerHTML = `<span class="fade-in-down">Painel do Revendedor:</span> <span id="welcome-user"></span>`;
        }
        mainMenu.innerHTML = menuHTML;
        
        // Lógica de navegação entre views
        mainMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                mainMenu.querySelectorAll('a').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                const view = link.getAttribute('data-view');
                if (view === 'gerenciar-revendedores') {
                    loadOwnerRevendedorView();
                } else if (view === 'revendedor-dashboard' || view === 'meus-clientes') {
                    loadRevendedorDashboardView();
                } else {
                     dashboardContent.innerHTML = `<div class="data-management fade-in-up delay-5">
                        <h2><i class="fas fa-info-circle"></i> View: ${view.toUpperCase().replace('-', ' ')}</h2>
                        <p>Conteúdo em desenvolvimento...</p>
                        </div>`;
                }
            });
        });
    }

    // FUNÇÃO CENTRAL DE REDIRECIONAMENTO APÓS O LOGIN
    function showDashboard(code, userData) {
        currentRevendedorUser = code;
        loginScreen.classList.add('hidden');
        dashboardApp.classList.remove('hidden');
        
        generateMenu(userData.profile);
        
        const displayName = userData.profile === 'owner' ? userData.name : userData.code;
        const displaySub = userData.profile === 'owner' ? `Owner: ${userData.code}` : `Revendedor: ${userData.email || userData.code}`;
        
        welcomeUser.textContent = displayName.toUpperCase();
        displayUserEmail.textContent = `Olá, ${displaySub}`;
        
        // Redirecionamento Automático
        if (userData.profile === 'owner') {
             loadOwnerRevendedorView(); // Padrão: Gerenciar Revendedores
        } else {
             loadRevendedorDashboardView(); // Padrão: Cadastro de Clientes
        }
        
        Toastify({
            text: `Bem-vindo, ${displayName}! Seu painel (${userData.profile.toUpperCase()}) foi carregado.`,
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

    // --- AUTENTICAÇÃO E INICIALIZAÇÃO ---

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = loginCodeInput.value.toLowerCase(); 
        const rememberMe = rememberMeCheckbox.checked;
        
        const userData = USUARIOS_MOCK[code];
        
        if (userData) {
            
            if (rememberMe) {
                saveCredentials(code);
            } else {
                clearCredentials();
            }

            localStorage.setItem('current_revendedor_user', code); // Usa o código como identificador
            showDashboard(code, userData);

        } else {
            Toastify({
                text: "Código de acesso inválido. Verifique seu código.",
                duration: 4000,
                close: true,
                gravity: "top", 
                position: "center",
                style: { background: "red", color: "white", fontWeight: "bold" }
            }).showToast();
        }
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showLogin(true); 
    });
    
    function initializeApp() {
        loadUsersMock(); 
        loadCredentials();

        const storedCode = localStorage.getItem('current_revendedor_user');
        if (storedCode) {
            const userData = USUARIOS_MOCK[storedCode];
            if (userData) {
                 showDashboard(storedCode, userData);
            } else {
                 showLogin(); 
            }
        } else {
            showLogin(); 
        }
    }
    
    setTimeout(() => {
        splashScreen.classList.add('splash-fade-out'); 
        initializeApp(); 
    }, 4000); 

    // --- FUNÇÕES DE GERENCIAMENTO DE REVENDEDORES (OWNER) ---

    function getNextRevendedorId() {
        const revendedores = Object.values(USUARIOS_MOCK).filter(u => u.profile === 'revendedor');
        if (revendedores.length === 0) return 1;
        
        const maxId = revendedores.reduce((max, user) => {
            const idNum = parseInt(user.id.split('-')[1]); 
            return idNum > max ? idNum : max;
        }, 0);

        return maxId + 1;
    }

    function renderRevendedoresTable() {
        const listaRevendedoresBody = document.getElementById('listaRevendedoresBody');
        if (!listaRevendedoresBody) return;

        listaRevendedoresBody.innerHTML = '';
        const revendedores = Object.values(USUARIOS_MOCK).filter(u => u.profile === 'revendedor');
        
        revendedores.forEach(user => {
            const row = listaRevendedoresBody.insertRow();
            row.insertCell().textContent = user.code; 
            row.insertCell().textContent = user.email || 'N/A'; 
            row.insertCell().textContent = user.status.toUpperCase();
            
            const acoesCell = row.insertCell();
            const btnExcluir = document.createElement('button');
            btnExcluir.textContent = 'Excluir';
            btnExcluir.classList.add('btn-delete');
            
            btnExcluir.onclick = () => excluirRevendedor(user.code.toLowerCase()); 
            
            acoesCell.appendChild(btnExcluir);
        });

        const nextIdNum = getNextRevendedorId();
        const nextCode = `RVD-${nextIdNum.toString().padStart(3, '0')}`;
        
        document.getElementById('totalRevendedoresCard').textContent = revendedores.length;
        document.getElementById('nextRevendedorId').textContent = nextCode;
        
        const revendedorCodeInput = document.getElementById('revendedorCode');
        if (revendedorCodeInput) {
             revendedorCodeInput.value = nextCode; 
        }
    }

    function loadOwnerRevendedorView() {
        const template = document.getElementById('owner-revendedor-template');
        if (!template) return;
        
        const clone = document.importNode(template.content, true);
        dashboardContent.innerHTML = '';
        dashboardContent.appendChild(clone);
        
        renderRevendedoresTable(); 
        
        const cadastroForm = document.getElementById('cadastroRevendedorForm');
        cadastroForm.addEventListener('submit', cadastrarNovoRevendedor);
    }
    
    function cadastrarNovoRevendedor(e) {
        e.preventDefault();
        
        const email = document.getElementById('revendedorEmail').value; 
        const code = document.getElementById('revendedorCode').value; 
        const codeKey = code.toLowerCase(); 

        if (USUARIOS_MOCK[codeKey]) {
            Toastify({ text: `Erro: O código ${code} já está cadastrado.`, style: { background: "red" } }).showToast();
            return;
        }

        const novoRevendedor = { 
            id: code, 
            code: code, 
            profile: "revendedor", 
            status: "ativo",
            email: email
        };
        
        USUARIOS_MOCK[codeKey] = novoRevendedor;
        
        saveRevendedoresToStorage();
        renderRevendedoresTable();
        
        Toastify({
            text: `Revendedor ${code} (${email}) adicionado com sucesso!`,
            duration: 5000,
            style: { background: "#18BC9C" }
        }).showToast();
        
        document.getElementById('revendedorEmail').value = '';
    }

    window.excluirRevendedor = function(codeKey) {
        if (!confirm(`Tem certeza que deseja EXCLUIR o Revendedor com código: ${codeKey.toUpperCase()}?`)) return;

        if (USUARIOS_MOCK[codeKey]) {
            delete USUARIOS_MOCK[codeKey];
            saveRevendedoresToStorage();
            renderRevendedoresTable();
            
            Toastify({
                text: `Revendedor ${codeKey.toUpperCase()} excluído com sucesso.`,
                duration: 4000,
                style: { background: "#E74C3C" }
            }).showToast();
        }
    }
    
    // --- FUNÇÕES DE GERENCIAMENTO DE CLIENTES (REVENDEDOR) ---
    
    function renderClientesTable(data = carregarClientes()) {
        const listaClientesBody = document.getElementById('listaClientesBody');
        const totalClientesSpan = document.getElementById('totalClientes');
        const totalClientesCard = document.getElementById('totalClientesCard');
        const faturamentoCard = document.getElementById('faturamentoCard');
        
        if (!listaClientesBody) return;
        
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
            
            btnExcluir.onclick = () => excluirCliente(index); 
            
            acoesCell.appendChild(btnExcluir);
        });
        
        // Atualiza os cards
        const clientesCompletos = carregarClientes();
        if (totalClientesSpan) totalClientesSpan.textContent = `(${clientesCompletos.length})`;
        if (totalClientesCard) totalClientesCard.textContent = clientesCompletos.length; 
        if (faturamentoCard) faturamentoCard.textContent = `R$ ${totalFaturamento.toFixed(2).replace('.', ',')}`;
    }

    function loadRevendedorDashboardView() {
        // Carrega o template HTML do Revendedor
        const template = document.getElementById('revendedor-dashboard-template');
        if (!template) return;
        
        const clone = document.importNode(template.content, true);
        dashboardContent.innerHTML = '';
        dashboardContent.appendChild(clone);
        
        renderClientesTable(); 
        
        const cadastroForm = document.getElementById('cadastroClienteForm');
        cadastroForm.addEventListener('submit', cadastrarNovoCliente);
    }
    
    function cadastrarNovoCliente(e) {
        e.preventDefault();
        
        const nome = document.getElementById('clienteNome').value.trim();
        const plano = document.getElementById('clientePlano').value;
        const valor = parseFloat(document.getElementById('clienteValor').value);
        const fornecedor = document.getElementById('clienteFornecedor').value.trim();

        if (nome === "" || plano === "" || isNaN(valor) || fornecedor === "") {
             Toastify({ text: `Preencha todos os campos corretamente!`, style: { background: "red" } }).showToast();
             return;
        }

        const clientes = carregarClientes();
        const novoCliente = { nome, plano, valor, fornecedor, dataCadastro: new Date().toISOString() };
        
        clientes.push(novoCliente);
        salvarClientes(clientes);
        renderClientesTable();
        
        Toastify({
            text: `Cliente ${nome} cadastrado com sucesso!`,
            duration: 3000,
            style: { background: "#18BC9C" }
        }).showToast();

        e.target.reset();
    }

    window.excluirCliente = function(index) {
        if (!confirm(`Tem certeza que deseja EXCLUIR este cliente?`)) return;

        const clientes = carregarClientes();
        
        if (index >= 0 && index < clientes.length) {
            const nomeExcluido = clientes[index].nome;
            clientes.splice(index, 1); 
            salvarClientes(clientes);
            renderClientesTable();
            
            Toastify({
                text: `Cliente ${nomeExcluido} excluído com sucesso.`,
                duration: 4000,
                style: { background: "#E74C3C" }
            }).showToast();
        }
    }
});
