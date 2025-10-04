// VARIÁVEL GLOBAL PARA ARMAZENAR O CÓDIGO DO USUÁRIO LOGADO
let currentRevendedorUser = null; 

document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const loginScreen = document.getElementById('login-screen');
    const dashboardApp = document.getElementById('dashboard-app');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Elementos de Login
    const loginCodeInput = document.getElementById('loginCode'); // NOVO: Campo de Código
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // Elementos do Dashboard
    const welcomeUser = document.getElementById('welcome-user');
    const displayUserEmail = document.getElementById('display-user-email');
    const mainMenu = document.getElementById('main-menu');
    const dashboardContent = document.getElementById('dashboard-content');


    // MOCK DE USUÁRIOS: CHAVE AGORA É O CÓDIGO DE ACESSO
    const REVENDEDOR_STORAGE_KEY = 'alita_play_revendedores_mock';

    // Os códigos de acesso DEVEM SER SEMPRE MINÚSCULOS no MOCK, para comparação.
    let USUARIOS_MOCK = {
        // OWNER (ADMINISTRADOR) - Código fixo e fácil de memorizar
        "alita-owner": { id: "OWN-001", code: "ALITA-OWNER", profile: "owner", status: "ativo", name: "AlitaPlayz" }, 
        
        // REVENDEDORES - Códigos baseados no ID
        "rvd-001": { id: "RVD-001", code: "RVD-001", profile: "revendedor", status: "ativo", email: "revendedor1@alita.com" }, 
        "rvd-002": { id: "RVD-002", code: "RVD-002", profile: "revendedor", status: "ativo", email: "revendedor2@alita.com" }  
    };

    // --- FUNÇÕES DE DADOS GLOBAIS (OWNER) ---

    // Carrega o mock de usuários, com prioridade para o localStorage
    function loadUsersMock() {
        const storedRevendedores = localStorage.getItem(REVENDEDOR_STORAGE_KEY);
        if (storedRevendedores) {
            const revendedores = JSON.parse(storedRevendedores);
            // Mescla o Owner original (fixo) com os Revendedores do localStorage
            USUARIOS_MOCK = {
                "alita-owner": USUARIOS_MOCK["alita-owner"],
                ...revendedores
            };
        }
        return USUARIOS_MOCK;
    }

    // Salva apenas as contas de Revendedores no localStorage
    function saveRevendedoresToStorage() {
        // Filtra os usuários com profile 'revendedor' e o owner (se for um novo owner)
        const revendedores = Object.keys(USUARIOS_MOCK)
            .filter(key => USUARIOS_MOCK[key].profile === 'revendedor')
            .reduce((obj, key) => {
                obj[key] = USUARIOS_MOCK[key];
                return obj;
            }, {});
        
        localStorage.setItem(REVENDEDOR_STORAGE_KEY, JSON.stringify(revendedores));
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
                <li><a href="#" class="active" data-view="owner-home"><i class="fas fa-hammer"></i> Painel Owner</a></li>
                <li><a href="#" data-view="gerenciar-revendedores" id="menuGerenciarRevendedores"><i class="fas fa-users-cog"></i> Gerenciar Revendedores</a></li>
                <li><a href="#" data-view="status-sistema"><i class="fas fa-server"></i> Status do Sistema</a></li>
                <li><a href="#" data-view="relatorios-globais"><i class="fas fa-chart-line"></i> Relatórios Globais</a></li>
            `;
            document.querySelector('.top-header h1').innerHTML = `<span class="fade-in-down">Painel do Owner:</span> <span id="welcome-user"></span>`;
        } else if (profile === 'revendedor') {
            menuHTML = `
                <li><a href="#" class="active"><i class="fas fa-home"></i> Início</a></li>
                <li><a href="#"><i class="fas fa-users"></i> Meus Clientes</a></li>
                <li><a href="#"><i class="fas fa-tags"></i> Planos & Valores</a></li>
                <li><a href="#"><i class="fas fa-truck"></i> Fornecedores</a></li>
                <li><a href="#"><i class="fas fa-file-invoice-dollar"></i> Financeiro</a></li>
            `;
            document.querySelector('.top-header h1').innerHTML = `<span class="fade-in-down">Painel do Revendedor:</span> <span id="welcome-user"></span>`;
        }
        mainMenu.innerHTML = menuHTML;
        
        // Adicionar eventos de clique ao menu
        mainMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                mainMenu.querySelectorAll('a').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                const view = link.getAttribute('data-view');
                if (view === 'gerenciar-revendedores') {
                    loadOwnerRevendedorView();
                } else {
                     dashboardContent.innerHTML = `<div class="data-management fade-in-up delay-5">
                        <h2><i class="fas fa-info-circle"></i> View: ${view.toUpperCase().replace('-', ' ')}</h2>
                        <p>Conteúdo em desenvolvimento...</p>
                        </div>`;
                }
            });
        });
    }

    function showDashboard(code, userData) {
        currentRevendedorUser = code;
        loginScreen.classList.add('hidden');
        dashboardApp.classList.remove('hidden');
        
        generateMenu(userData.profile);
        
        const displayName = userData.profile === 'owner' ? userData.name : userData.code;
        const displaySub = userData.profile === 'owner' ? `Owner: ${userData.code}` : `Revendedor: ${userData.email}`;
        
        welcomeUser.textContent = displayName.toUpperCase();
        displayUserEmail.textContent = `Olá, ${displaySub}`;
        
        if (userData.profile === 'owner') {
             loadOwnerRevendedorView();
        } else {
             // Conteúdo padrão do revendedor será carregado aqui.
             dashboardContent.innerHTML = `<div class="data-management fade-in-up delay-5">
                <h2><i class="fas fa-home"></i> Painel do Revendedor</h2>
                <p>Use o menu lateral para gerenciar seus clientes.</p>
                </div>`;
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
        // O código de acesso é a chave de login
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
        loadUsersMock(); // Carrega os usuários na inicialização
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
    
    // Atraso de 4 segundos para o Splash Screen
    setTimeout(() => {
        splashScreen.classList.add('splash-fade-out'); 
        initializeApp(); 
    }, 4000); 

    // --- FUNÇÕES DE GERENCIAMENTO DE REVENDEDORES (OWNER) ---

    function getNextRevendedorId() {
        const revendedores = Object.values(USUARIOS_MOCK).filter(u => u.profile === 'revendedor');
        if (revendedores.length === 0) return 1;
        
        const maxId = revendedores.reduce((max, user) => {
            // Assume que o ID tem o formato RVD-XXX
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
            
            btnExcluir.onclick = () => excluirRevendedor(user.code.toLowerCase()); // Passa o código para exclusão
            
            acoesCell.appendChild(btnExcluir);
        });

        // Atualiza os cards de resumo e o campo de cadastro
        const nextIdNum = getNextRevendedorId();
        const nextCode = `RVD-${nextIdNum.toString().padStart(3, '0')}`;
        
        document.getElementById('totalRevendedoresCard').textContent = revendedores.length;
        document.getElementById('nextRevendedorId').textContent = nextCode;
        
        const revendedorCodeInput = document.getElementById('revendedorCode');
        if (revendedorCodeInput) {
             revendedorCodeInput.value = nextCode; // Pré-preenche o novo código
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
        
        const email = document.getElementById('revendedorEmail').value; // Email pode ter maiúsculas
        const code = document.getElementById('revendedorCode').value; // RVD-003
        const codeKey = code.toLowerCase(); // rvd-003 (chave do MOCK)

        // 1. Validação
        if (USUARIOS_MOCK[codeKey]) {
            Toastify({ text: `Erro: O código ${code} já está cadastrado.`, style: { background: "red" } }).showToast();
            return;
        }

        // 2. Adicionar ao MOCK
        const novoRevendedor = { 
            id: code, // Mantém o ID formatado RVD-XXX
            code: code, // Mantém o código formatado RVD-XXX
            profile: "revendedor", 
            status: "ativo",
            email: email
        };
        
        USUARIOS_MOCK[codeKey] = novoRevendedor;
        
        // 3. Salvar no Storage e Renderizar
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
});
