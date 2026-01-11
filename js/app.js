/*
 * Money360 - Lógica Principal con Firebase
 */

import { 
    db, 
    auth, 
    collection, 
    addDoc, 
    onSnapshot, 
    doc, 
    deleteDoc, 
    updateDoc,
    increment, 
    query, 
    orderBy,
    signInAnonymously,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from './firebase.js';

// --- ESTADO LOCAL (Espejo de Firebase) ---
const AppData = {
    user: null, // Usuario autenticado
    accounts: [],
    transactions: [],
    categories: [],
    editingId: null, // ID del elemento que se está editando
    editingType: null // 'account', 'transaction', 'category'
};

// --- UTILIDADES ---
const Utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount);
    },
    getAccountById(id) {
        return AppData.accounts.find(acc => acc.id === id);
    },
    getCategoryById(id) {
        return AppData.categories.find(cat => cat.id === id);
    },
    formatDate(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
};

// --- INTERFAZ (UI) ---
const UI = {
    elements: {
        views: document.querySelectorAll('.view'),
        navLinks: document.querySelectorAll('.nav-links li'),
        totalIncome: document.getElementById('total-income'),
        totalExpense: document.getElementById('total-expense'),
        totalBalance: document.getElementById('total-balance'),
        accountsList: document.getElementById('accounts-list'),
        transactionsList: document.getElementById('transactions-list'),
        categoriesList: document.getElementById('categories-list'),
        
        // Modals
        modalTrans: document.getElementById('modal-transaction'),
        modalAcc: document.getElementById('modal-account'),
        modalCat: document.getElementById('modal-category'),
        
        // Selects
        transAccountSel: document.getElementById('trans-account'),
        transCategorySel: document.getElementById('trans-category'),
    },

    init() {
        this.bindEvents();
        Charts.init();
        this.initAuthUI();
    },

    initAuthUI() {
        const tabLogin = document.getElementById('tab-login');
        const tabRegister = document.getElementById('tab-register');
        const confirmPassGroup = document.getElementById('group-confirm-pass');
        const btnAction = document.getElementById('btn-auth-action');
        const formAuth = document.getElementById('form-auth-email');
        const loginError = document.getElementById('login-error');

        // Toggle Tabs
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabLogin.style.borderBottom = '2px solid var(--primary-color)';
            tabLogin.style.color = 'white';
            
            tabRegister.classList.remove('active');
            tabRegister.style.borderBottom = 'none';
            tabRegister.style.color = 'var(--text-secondary)';

            confirmPassGroup.classList.add('hidden');
            btnAction.textContent = 'Iniciar Sesión';
            loginError.textContent = '';
        });

        tabRegister.addEventListener('click', () => {
            tabRegister.classList.add('active');
            tabRegister.style.borderBottom = '2px solid var(--primary-color)';
            tabRegister.style.color = 'white';
            
            tabLogin.classList.remove('active');
            tabLogin.style.borderBottom = 'none';
            tabLogin.style.color = 'var(--text-secondary)';

            confirmPassGroup.classList.remove('hidden');
            btnAction.textContent = 'Registrarse';
            loginError.textContent = '';
        });

        // Form Submit
        formAuth.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            const confirmPass = document.getElementById('auth-confirm-pass').value;
            const isRegister = tabRegister.classList.contains('active');

            loginError.textContent = 'Procesando...';

            try {
                if(isRegister) {
                    if(password !== confirmPass) throw new Error("Las contraseñas no coinciden");
                    if(password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
                    
                    await createUserWithEmailAndPassword(auth, email, password);
                } else {
                    await signInWithEmailAndPassword(auth, email, password);
                }
                // Exito: onAuthStateChanged se encargará del resto
            } catch (error) {
                console.error(error);
                let msg = error.message;
                if(error.code === 'auth/email-already-in-use') msg = "El correo ya está registrado. Intenta iniciar sesión.";
                if(error.code === 'auth/wrong-password') msg = "Contraseña incorrecta.";
                if(error.code === 'auth/user-not-found') msg = "Usuario no encontrado.";
                if(error.code === 'auth/invalid-email') msg = "Correo inválido.";
                if(error.code === 'auth/weak-password') msg = "Contraseña muy débil.";
                
                loginError.textContent = msg;
            }
        });
    },

    bindEvents() {
        // Navegación (Query dinámico para asegurar que existen)
        const navLinks = document.querySelectorAll('.nav-links li');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Remover clase active de todos
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Agregar al clickeado
                const li = e.currentTarget; // Usar currentTarget es más seguro
                li.classList.add('active');
                
                const page = li.dataset.page;
                console.log("Navegando a:", page);
                this.switchView(page);
            });
        });

        // Logout
        const btnLogout = document.getElementById('btn-logout');
        if(btnLogout) {
            btnLogout.addEventListener('click', () => {
                if(confirm("¿Cerrar sesión?")) {
                    signOut(auth).then(() => {
                        console.log("Sesión cerrada");
                        // onAuthStateChanged manejará la redirección
                    }).catch(error => {
                        console.error("Error al cerrar sesión:", error);
                    });
                }
            });
        }

        // Modales - Abrir (Crear Nuevo)
        document.getElementById('btn-add-transaction').addEventListener('click', () => {
             this.resetForm('form-transaction');
             AppData.editingId = null;
             document.querySelector('#modal-transaction h2').textContent = 'Registrar Movimiento';
             this.populateSelects();
             this.openModal(this.elements.modalTrans);
        });
        
        document.getElementById('btn-add-account').addEventListener('click', () => {
             this.resetForm('form-account');
             AppData.editingId = null;
             document.querySelector('#modal-account h2').textContent = 'Nueva Cuenta';
             this.openModal(this.elements.modalAcc);
        });

        document.getElementById('btn-add-category').addEventListener('click', () => {
            this.resetForm('form-category');
            AppData.editingId = null;
            document.querySelector('#modal-category h2').textContent = 'Nueva Etiqueta';
            this.openModal(this.elements.modalCat);
       });

        // Modales - Cerrar
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('active');
            });
        });

        // Forms Submit (Crear o Editar)
        document.getElementById('form-account').addEventListener('submit', (e) => {
            e.preventDefault();
            Logic.saveAccount();
            this.closeModal(this.elements.modalAcc);
        });

        document.getElementById('form-transaction').addEventListener('submit', (e) => {
            e.preventDefault();
            Logic.saveTransaction();
            this.closeModal(this.elements.modalTrans);
        });

        document.getElementById('form-category').addEventListener('submit', (e) => {
            e.preventDefault();
            Logic.saveCategory();
            this.closeModal(this.elements.modalCat);
        });

        // Filtro dinámico en modal Transacción
        const typeRadios = document.querySelectorAll('input[name="type"]');
        typeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.populateSelects());
        });
    },

    switchView(viewName) {
        this.elements.views.forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('active');
        });
        const target = document.getElementById(`view-${viewName}`);
        if(target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }
    },

    openModal(modal) { modal.classList.add('active'); },
    closeModal(modal) { modal.classList.remove('active'); },
    
    resetForm(formId) {
        document.getElementById(formId).reset();
        // Reset defaults
        if(formId === 'form-transaction') {
            document.getElementById('trans-date').value = new Date().toISOString().split('T')[0];
        }
    },

    populateSelects(selectedCategoryId = null, selectedAccountId = null) {
        // Cuentas
        this.elements.transAccountSel.innerHTML = '';
        AppData.accounts.forEach(acc => {
            const opt = document.createElement('option');
            opt.value = acc.id;
            opt.textContent = `${acc.name} (${Utils.formatCurrency(acc.balance)})`;
            if (acc.id === selectedAccountId) opt.selected = true;
            this.elements.transAccountSel.appendChild(opt);
        });

        // Categorías (Filtradas por tipo)
        const type = document.querySelector('input[name="type"]:checked').value;
        this.elements.transCategorySel.innerHTML = '';
        const filteredCats = AppData.categories.filter(c => c.type === type);
        
        filteredCats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            if (cat.id === selectedCategoryId) opt.selected = true;
            this.elements.transCategorySel.appendChild(opt);
        });
    },

    // --- RENDERIZADO ---
    
    renderAll() {
        this.renderAccounts();
        this.renderTransactions();
        this.renderCategories();
        this.renderDashboard();
    },

    renderDashboard() {
        // Calcular totales basados en transacciones
        let income = 0;
        let expense = 0;

        AppData.transactions.forEach(t => {
            if(t.type === 'income') income += t.amount;
            else expense += t.amount;
        });

        // Balance total calculado sumando el saldo ACTUAL de cada cuenta
        // (El saldo de la cuenta es la fuente de verdad)
        const totalBalance = AppData.accounts.reduce((sum, acc) => sum + acc.balance, 0);

        this.elements.totalIncome.textContent = Utils.formatCurrency(income);
        this.elements.totalExpense.textContent = Utils.formatCurrency(expense);
        this.elements.totalBalance.textContent = Utils.formatCurrency(totalBalance);
        
        Charts.update();
    },

    renderAccounts() {
        const container = this.elements.accountsList;
        container.innerHTML = '';

        AppData.accounts.forEach(acc => {
            const el = document.createElement('div');
            el.className = 'account-card';
            // Enable editing
            el.onclick = (e) => {
                // Evitar editar si se hace click en un botón de borrar futuro (si lo hubiera)
                UI.openEditAccount(acc);
            };
            
            el.innerHTML = `
                <style>.account-card[data-id="${acc.id}"]::before { background-color: ${acc.color}; }</style>
                <div class="card-actions">
                     <i class='bx bxs-edit-alt' style="opacity:0.5"></i>
                </div>
                <div class="acc-type">${this.getAccountTypeName(acc.type)}</div>
                <div class="acc-name">${acc.name}</div>
                <div class="acc-balance">${Utils.formatCurrency(acc.balance)}</div>
            `;
            el.setAttribute('data-id', acc.id);
            container.appendChild(el);
        });
    },

    renderTransactions() {
        const container = this.elements.transactionsList;
        container.innerHTML = '';
        
        AppData.transactions.forEach(t => {
            const cat = Utils.getCategoryById(t.categoryId);
            const account = Utils.getAccountById(t.accountId);
            
            const el = document.createElement('div');
            el.className = 'transaction-item';
            el.onclick = () => UI.openEditTransaction(t);
            el.style.cursor = 'pointer';

            el.innerHTML = `
                <div class="t-info">
                    <div class="t-icon" style="color: ${cat?.color || '#ccc'}">
                        <i class='bx ${t.type === 'income' ? 'bxs-up-arrow-circle' : 'bxs-down-arrow-circle'}'></i>
                    </div>
                    <div class="t-details">
                        <h4>${t.description}</h4>
                        <small>${Utils.formatDate(t.date)} • ${cat?.name || 'S/C'} • ${account?.name || '?'}</small>
                    </div>
                </div>
                <div class="t-right">
                    <div class="t-amount ${t.type}">
                        ${t.type === 'income' ? '+' : '-'}${Utils.formatCurrency(t.amount)}
                    </div>
                     <button class="btn-icon-min delete-btn" data-id="${t.id}"><i class='bx bx-trash'></i></button>
                </div>
            `;
            
            // Manejador para botón borrar (evitar que abra el editar)
            const deleteBtn = el.querySelector('.delete-btn');
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if(confirm('¿Borrar este movimiento? Se ajustará el saldo de la cuenta.')) {
                    Logic.deleteTransaction(t);
                }
            };

            container.appendChild(el);
        });
    },

    renderCategories() {
        const containerIncome = document.getElementById('categories-list-income');
        const containerExpense = document.getElementById('categories-list-expense');
        
        if(!containerIncome || !containerExpense) return;

        containerIncome.innerHTML = '';
        containerExpense.innerHTML = '';

        AppData.categories.forEach(cat => {
            const el = document.createElement('div');
            el.className = 'category-card';
            el.onclick = () => UI.openEditCategory(cat);
            el.style.cursor = 'pointer';
            
            el.innerHTML = `
                <div class="color-dot" style="background-color: ${cat.color}"></div>
                <span>${cat.name}</span>
                <span style="font-size:0.7em; opacity:0.6; margin-left: 5px">(${cat.type === 'income' ? 'Ing.' : 'Gas.'})</span>
                <div style="margin-left:auto; display:flex; gap:5px">
                   <i class='bx bxs-pencil' style="opacity:0.3"></i>
                   <i class='bx bx-trash delete-cat' style="opacity:0.3; color: #ef4444"></i>
                </div>
            `;
            
            el.querySelector('.delete-cat').onclick = (e) => {
                e.stopPropagation();
                 if(confirm('¿Borrar etiqueta?')) Logic.deleteCategory(cat.id);
            };

            if(cat.type === 'income') containerIncome.appendChild(el);
            else containerExpense.appendChild(el);
        });
    },

    // --- MODALES DE EDICIÓN ---
    openEditAccount(acc) {
        AppData.editingId = acc.id;
        AppData.editingType = 'account';
        
        document.querySelector('#modal-account h2').textContent = 'Editar Cuenta';
        document.getElementById('acc-name').value = acc.name;
        document.getElementById('acc-type').value = acc.type;
        document.getElementById('acc-balance').value = acc.balance;
        document.getElementById('acc-balance').disabled = true; // No permitir editar balance directamente, solo vía transacciones
        document.getElementById('acc-color').value = acc.color;
        
        this.openModal(this.elements.modalAcc);
    },

    openEditTransaction(t) {
        AppData.editingId = t.id;
        AppData.editingType = 'transaction';

        document.querySelector('#modal-transaction h2').textContent = 'Editar Movimiento';
        
        // Settear valores
        const typeRadio = document.querySelector(`input[name="type"][value="${t.type}"]`);
        if(typeRadio) {
            typeRadio.checked = true;
            // Disparar evento para actualizar selects
            typeRadio.dispatchEvent(new Event('change'));
        }
        
        document.getElementById('trans-amount').value = t.amount;
        document.getElementById('trans-desc').value = t.description;
        document.getElementById('trans-date').value = t.date;
        
        // Esperar un tick para que los selects se llenen
        setTimeout(() => {
            this.populateSelects(t.categoryId, t.accountId);
        }, 0);

        this.openModal(this.elements.modalTrans);
    },

    openEditCategory(cat) {
        AppData.editingId = cat.id;
        AppData.editingType = 'category';
        
        document.querySelector('#modal-category h2').textContent = 'Editar Etiqueta';
        document.getElementById('cat-name').value = cat.name;
        document.querySelector(`input[name="cat-type"][value="${cat.type}"]`).checked = true;
        document.getElementById('cat-color').value = cat.color;
        
        this.openModal(this.elements.modalCat);
    },

    getAccountTypeName(type) {
        const types = { 'cash': 'Efectivo', 'bank': 'Banco', 'credit': 'T. Crédito', 'saving': 'Ahorros' };
        return types[type] || type;
    }
};

// --- LOGICA CON FIREBASE ---
const Logic = {
    // CUENTAS
    async saveAccount() {
        const name = document.getElementById('acc-name').value;
        const type = document.getElementById('acc-type').value;
        const color = document.getElementById('acc-color').value;
        // Solo leer balance si es nuevo
        const balanceInput = parseFloat(document.getElementById('acc-balance').value) || 0;

        if (AppData.editingId) {
            // Update
            const ref = doc(db, `users/${AppData.user.uid}/accounts`, AppData.editingId);
            await updateDoc(ref, { name, type, color });
        } else {
            // Create
            await addDoc(collection(db, `users/${AppData.user.uid}/accounts`), {
                name, type, balance: balanceInput, color, createdAt: new Date()
            });
        }
    },

    // CATEGORÍAS
    async saveCategory() {
        const name = document.getElementById('cat-name').value;
        const type = document.querySelector('input[name="cat-type"]:checked').value;
        const color = document.getElementById('cat-color').value;

        if (AppData.editingId) {
            await updateDoc(doc(db, `users/${AppData.user.uid}/categories`, AppData.editingId), {
                name, type, color
            });
        } else {
            await addDoc(collection(db, `users/${AppData.user.uid}/categories`), {
                name, type, color
            });
        }
    },

    async deleteCategory(id) {
        await deleteDoc(doc(db, `users/${AppData.user.uid}/categories`, id));
    },

    // TRANSACCIONES (Compleja lógica de balance)
    async saveTransaction() {
        const type = document.querySelector('input[name="type"]:checked').value;
        const amount = parseFloat(document.getElementById('trans-amount').value);
        const description = document.getElementById('trans-desc').value;
        const accountId = document.getElementById('trans-account').value;
        const categoryId = document.getElementById('trans-category').value;
        const date = document.getElementById('trans-date').value;

        if(!accountId) return alert('Selecciona una cuenta');

        // Referencias DB
        const newVal = type === 'income' ? amount : -amount;
        const accRef = doc(db, `users/${AppData.user.uid}/accounts`, accountId);

        try {
            if (AppData.editingId) {
                const oldTrans = AppData.transactions.find(t => t.id === AppData.editingId);
                if(!oldTrans) return;

                // 1. Revertir saldo viejo (DB)
                const oldRevertVal = oldTrans.type === 'income' ? -oldTrans.amount : oldTrans.amount;
                const oldAccRef = doc(db, `users/${AppData.user.uid}/accounts`, oldTrans.accountId);
                await updateDoc(oldAccRef, { balance: increment(oldRevertVal) });

                // 2. Aplicar nuevo saldo (DB)
                await updateDoc(doc(db, `users/${AppData.user.uid}/accounts`, accountId), { balance: increment(newVal) });

                // 3. Actualizar transacción (DB)
                await updateDoc(doc(db, `users/${AppData.user.uid}/transactions`, AppData.editingId), {
                    type, amount, description, accountId, categoryId, date
                });

                // --- ACTUALIZACIÓN OPTIMISTA LOCAL ---
                // Revertir en memoria local
                const localOldAcc = AppData.accounts.find(a => a.id === oldTrans.accountId);
                if(localOldAcc) {
                    localOldAcc.balance += oldRevertVal;
                }
                // Aplicar nuevo en memoria local
                const localNewAcc = AppData.accounts.find(a => a.id === accountId);
                if(localNewAcc) {
                    localNewAcc.balance += newVal;
                }
                // Actualizar trans local
                Object.assign(oldTrans, { type, amount, description, accountId, categoryId, date });
                
                UI.renderAll(); 

            } else {
                // MODO CREACIÓN
                
                // 1. DB Updates
                await updateDoc(accRef, { balance: increment(newVal) });
                const newDocRef = await addDoc(collection(db, `users/${AppData.user.uid}/transactions`), {
                    type, amount, description, accountId, categoryId, date, createdAt: new Date()
                });

                // 2. --- ACTUALIZACIÓN OPTIMISTA LOCAL ---
                const localAcc = AppData.accounts.find(a => a.id === accountId);
                if(localAcc) {
                    localAcc.balance += newVal;
                }
                // Agregar transacción ficticia local para que se vea ya
                AppData.transactions.unshift({
                    id: newDocRef.id, type, amount, description, accountId, categoryId, date, createdAt: new Date()
                });

                UI.renderAll();
            }
        } catch (error) {
            console.error("Error guardando:", error);
            alert("Error al guardar: " + error.message);
        }
    },

    async deleteTransaction(t) {
        const revertVal = t.type === 'income' ? -t.amount : t.amount;
        const accRef = doc(db, `users/${AppData.user.uid}/accounts`, t.accountId);

        try {
            await updateDoc(accRef, { balance: increment(revertVal) });
            await deleteDoc(doc(db, `users/${AppData.user.uid}/transactions`, t.id));

            // Optimistic Update
            const localAcc = AppData.accounts.find(a => a.id === t.accountId);
            if(localAcc) localAcc.balance += revertVal;
            AppData.transactions = AppData.transactions.filter(tr => tr.id !== t.id);
            UI.renderAll();

        } catch (e) {
            console.error("Error al borrar:", e);
        }
    }
};

// --- CHART.JS ---
const Charts = {
    instances: {},
    init() {
        if(typeof Chart === 'undefined') {
            console.warn("Chart.js no está cargado. Los gráficos no funcionarán.");
            return;
        }

        const ctxFlow = document.getElementById('cashflowChart');
        const ctxExp = document.getElementById('expensesChart');

        if(ctxFlow) {
            this.instances.cashflow = new Chart(ctxFlow.getContext('2d'), {
                type: 'line',
                data: { labels: [], datasets: [] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, labels: { color: '#94a3b8' } } },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } }
                    }
                }
            });
        }

        if(ctxExp) {
            this.instances.expenses = new Chart(ctxExp.getContext('2d'), {
                type: 'doughnut',
                data: { labels: [], datasets: [] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { position: 'right', labels: { color: '#94a3b8', boxWidth: 10 } } }
                }
            });
        }
    },

    update() {
        if(!this.instances.expenses || !this.instances.cashflow) return;

        // Grafico de Gastos
        const expenseMap = {};
        AppData.transactions.filter(t => t.type === 'expense').forEach(t => {
            const cat = Utils.getCategoryById(t.categoryId);
            const name = cat ? cat.name : 'Varios';
            if(!expenseMap[name]) expenseMap[name] = { amount:0, color: cat?.color || '#555' };
            expenseMap[name].amount += t.amount;
        });

        const labels = Object.keys(expenseMap);
        this.instances.expenses.data = {
            labels,
            datasets: [{
                data: labels.map(l => expenseMap[l].amount),
                backgroundColor: labels.map(l => expenseMap[l].color),
                borderWidth: 0
            }]
        };
        this.instances.expenses.update();
        
        // Grafico Flujo
        const sorted = [...AppData.transactions].sort((a,b) => new Date(a.date) - new Date(b.date));
        const dateMap = {};
        sorted.forEach(t => {
            if(!dateMap[t.date]) dateMap[t.date] = { inc: 0, exp: 0 };
            if(t.type === 'income') dateMap[t.date].inc += t.amount;
            else dateMap[t.date].exp += t.amount;
        });
        
        const dates = Object.keys(dateMap).sort().slice(-7);
        
        this.instances.cashflow.data = {
            labels: dates.map(d => d.substring(5)), // MM-DD
            datasets: [
                {
                    label: 'Ingresos',
                    data: dates.map(d => dateMap[d].inc),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Gastos',
                    data: dates.map(d => dateMap[d].exp),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        };
        this.instances.cashflow.update();
    }
};

// --- AUTH & SYNC ---
const loginOverlay = document.getElementById('login-overlay');
const loginBtn = document.getElementById('btn-login-google');
const loginError = document.getElementById('login-error');

// Evento Click Login Google
loginBtn.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then(() => {
             loginError.textContent = "";
        }).catch((error) => {
            console.error(error);
            loginError.textContent = "Error Google: " + error.message;
            if(error.code === 'auth/operation-not-allowed') alert("Recuerda habilitar Google Auth en Firebase Console.");
        });
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario Logueado
        loginOverlay.style.display = 'none'; // Ocultar login
        
        // Actualizar UI con datos del usuario
        AppData.user = user;
        console.log('Usuario conectado:', user.displayName || user.email);
        
        // Actualizar Sidebar
        const avatarEl = document.querySelector('.user-profile .avatar');
        const nameEl = document.querySelector('.user-profile .user-info span');
        const mailEl = document.querySelector('.user-profile .user-info small');
        
        if(avatarEl && nameEl && mailEl) {
            if(user.photoURL) {
                avatarEl.innerText = '';
                avatarEl.style.backgroundImage = `url(${user.photoURL})`;
                avatarEl.style.backgroundSize = 'cover';
            } else {
                 avatarEl.innerText = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
                 avatarEl.style.backgroundImage = 'none';
            }
            nameEl.innerText = user.displayName || 'Usuario';
            mailEl.innerText = user.email || 'Anónimo';
        }

        // Cargar Datos
        const loadCollection = (colName, targetArray) => {
            try {
                const q = collection(db, `users/${user.uid}/${colName}`);
                onSnapshot(q, (snap) => {
                    AppData[targetArray] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    if(colName === 'transactions') {
                         AppData.transactions.sort((a,b) => new Date(b.date) - new Date(a.date));
                    }
                    UI.renderAll();
                }, (error) => {
                     console.error("Error acceso datos:", error);
                     if(colName === 'accounts') alert("⚠️ Error de Permisos: No olvides pegar las reglas en Firebase Console.");
                });
            } catch (e) { console.error(e); }
        };

        loadCollection('accounts', 'accounts');
        loadCollection('transactions', 'transactions');
        loadCollection('categories', 'categories');

    } else {
        // Usuario NO Logueado
        loginOverlay.style.display = 'flex'; // Mostrar login
        // Limpiar datos en memoria por seguridad
        AppData.accounts = [];
        AppData.transactions = [];
        AppData.categories = [];
        UI.renderAll();
    }
});

// Inicializar la aplicación
UI.init();
