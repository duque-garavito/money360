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
    editingType: null, // 'account', 'transaction', 'category'
    listeners: [] // Listeners activos de Firebase
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
        this.initTheme();
    },

    initTheme() {
        const themeSwitch = document.getElementById('theme-switch');
        if (!themeSwitch) return;

        // Cargar tema guardado o usar preferencia del sistema
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

        // Aplicar tema inicial
        if (currentTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeSwitch.checked = true;
        }

        // Event listener para cambio de tema
        themeSwitch.addEventListener('change', () => {
            if (themeSwitch.checked) {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'dark');
            }
        });
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
             // Default to income or expense
             const type = document.querySelector('input[name="type"]:checked').value;
             // Force UI update
             const event = new Event('change');
             document.getElementById('type-' + type).dispatchEvent(event);
             
             this.populateSelects();
             this.openModal(this.elements.modalTrans);
        });
        
        document.getElementById('btn-add-account').addEventListener('click', () => {
             this.resetForm('form-account');
             AppData.editingId = null;
             document.querySelector('#modal-account h2').textContent = 'Nueva Cuenta';
             document.getElementById('acc-balance').disabled = false;
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

        // Lógica Dinámica Modal Transacción
        const typeRadios = document.querySelectorAll('input[name="type"]');
        typeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const type = e.target.value;
                const groupNormalAccount = document.getElementById('group-normal-account');
                const groupTransferFlow = document.getElementById('group-transfer-flow');
                const groupCat = document.getElementById('group-category');

                if (type === 'transfer') {
                    // Modo Transferencia - Mostrar interfaz visual Origen → Destino
                    groupNormalAccount.classList.add('hidden');
                    groupTransferFlow.classList.remove('hidden');
                    groupCat.classList.add('hidden');
                } else {
                    // Income / Expense - Mostrar interfaz normal
                    groupNormalAccount.classList.remove('hidden');
                    groupTransferFlow.classList.add('hidden');
                    groupCat.classList.remove('hidden');
                }
                this.populateSelects();
            });
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
        const typeEl = document.querySelector('input[name="type"]:checked');
        if(!typeEl) return;
        const type = typeEl.value;

        // Función helper para crear opciones
        const createOption = (acc) => {
            const opt = document.createElement('option');
            opt.value = acc.id;
            opt.textContent = `${acc.name} (${Utils.formatCurrency(acc.balance)})`;
            return opt;
        };

        if(type === 'transfer') {
            // Modo Transferencia - Llenar selectores visuales Origen/Destino
            const selFrom = document.getElementById('trans-from');
            const selTo = document.getElementById('trans-to');
            
            if(selFrom && selTo) {
                selFrom.innerHTML = '';
                selTo.innerHTML = '';
                
                // Origen: Externo + Cuentas
                const extSrc = new Option('... fuera del sistema', 'external_source');
                selFrom.add(extSrc);
                AppData.accounts.forEach(acc => selFrom.add(createOption(acc)));
                
                // Destino: Externo + Cuentas
                const extDest = new Option('... fuera del sistema', 'external_dest');
                selTo.add(extDest);
                AppData.accounts.forEach(acc => selTo.add(createOption(acc)));
            }
        } else {
            // Modo Normal (Ingreso/Gasto) - Llenar selector de cuenta
            const selAccount = document.getElementById('trans-account');
            if(selAccount) {
                selAccount.innerHTML = '';
                AppData.accounts.forEach(acc => {
                    const opt = createOption(acc);
                    if (acc.id === selectedAccountId) opt.selected = true;
                    selAccount.appendChild(opt);
                });
            }
            
            // Llenar Categorías
            this.elements.transCategorySel.innerHTML = '';
            const filteredCats = AppData.categories.filter(c => c.type === type);
            
            filteredCats.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.textContent = cat.name;
                if (cat.id === selectedCategoryId) opt.selected = true;
                this.elements.transCategorySel.appendChild(opt);
            });
        }
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
            else if(t.type === 'expense') expense += t.amount;
            // Ignore transfers in global income/expense
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
            let catName, accName, iconHtml, amountClass, amountSign;

            if(t.type === 'transfer') {
                const fromAcc = Utils.getAccountById(t.accountId);
                const toAcc = Utils.getAccountById(t.categoryId); // Hack: categoryId is toAccountId
                catName = 'Transferencia';
                accName = `${fromAcc?.name || '?'} <i class='bx bx-right-arrow-alt'></i> ${toAcc?.name || '?'}`;
                iconHtml = `<div class="t-icon" style="color: #cbd5e1"><i class='bx bx-transfer'></i></div>`;
                amountClass = 'transfer';
                amountSign = ''; 
            } else {
                const cat = Utils.getCategoryById(t.categoryId);
                const account = Utils.getAccountById(t.accountId);
                catName = cat?.name || 'S/C';
                accName = account?.name || '?';
                iconHtml = `<div class="t-icon" style="color: ${cat?.color || '#ccc'}">
                            <i class='bx ${t.type === 'income' ? 'bxs-up-arrow-circle' : 'bxs-down-arrow-circle'}'></i>
                        </div>`;
                amountClass = t.type;
                amountSign = t.type === 'income' ? '+' : '-';
            }
            
            const el = document.createElement('div');
            el.className = 'transaction-item';
            if(t.type !== 'transfer') {
                 el.onclick = () => UI.openEditTransaction(t);
                 el.style.cursor = 'pointer';
            }

            el.innerHTML = `
                <div class="t-info">
                    ${iconHtml}
                    <div class="t-details">
                        <h4>${t.description}</h4>
                        <small>${Utils.formatDate(t.date)} • ${catName} • <span style="font-size:0.8em; opacity:0.8">${accName}</span></small>
                    </div>
                </div>
                <div class="t-right">
                    <div class="t-amount ${amountClass}" style="${t.type==='transfer'?'color:#94a3b8':''}">
                        ${amountSign}${Utils.formatCurrency(t.amount)}
                    </div>
                     <button class="btn-icon-min delete-btn" data-id="${t.id}"><i class='bx bx-trash'></i></button>
                </div>
            `;
            
            // Manejador para botón borrar
            const deleteBtn = el.querySelector('.delete-btn');
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                const msg = t.type === 'transfer' 
                    ? '¿Borrar transferencia? El dinero volverá a la cuenta de origen.' 
                    : '¿Borrar este movimiento? Se ajustará el saldo de la cuenta.';
                
                if(confirm(msg)) {
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
        document.getElementById('acc-balance').disabled = false; // Permitir editar balance para correcciones
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
        const balanceInput = parseFloat(document.getElementById('acc-balance').value) || 0;

        if (AppData.editingId) {
            // Update (Incluyendo balance, permitiendo correcciones manuales)
            const ref = doc(db, `users/${AppData.user.uid}/accounts`, AppData.editingId);
            await updateDoc(ref, { name, type, color, balance: balanceInput });
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

    // TRANSACCIONES UNIFICADA
    async saveTransaction() {
        const type = document.querySelector('input[name="type"]:checked').value;
        const amount = parseFloat(document.getElementById('trans-amount').value);
        const description = document.getElementById('trans-desc').value;
        const date = document.getElementById('trans-date').value;
        
        if (isNaN(amount) || amount <= 0) return alert("Monto inválido");

        // LÓGICA DE TRASPASO
        if (type === 'transfer') {
            // Leer desde los nuevos selectores visuales
            const fromId = document.getElementById('trans-from').value;
            const toId = document.getElementById('trans-to').value;
            
            // Caso 1: Externo -> Cuenta Mía (Es un INGRESO)
            if (fromId === 'external_source' && toId !== 'external_dest') {
                 return this.saveDirectTransaction('income', amount, description, toId, null, date);
            }
            
            // Caso 2: Cuenta Mía -> Externo (Es un GASTO)
            if (fromId !== 'external_source' && toId === 'external_dest') {
                return this.saveDirectTransaction('expense', amount, description, fromId, null, date); 
            }

            // Caso 3: Cuenta Mía -> Cuenta Mía (TRASPASO REAL)
            if (fromId !== 'external_source' && toId !== 'external_dest') {
                 if (fromId === toId) return alert("Origen y Destino deben ser diferentes");
                 return this.saveTransferLogic(fromId, toId, amount, description, date);
            }

            return alert("Selección de transferencia inválida.");
        }

        // LÓGICA NORMAL (INGRESO / GASTO)
        const accountId = document.getElementById('trans-account').value;
        const categoryId = document.getElementById('trans-category').value;
        
        if(!accountId) return alert('Selecciona una cuenta');
        this.saveDirectTransaction(type, amount, description, accountId, categoryId, date);
    },

    // Helper para guardar Ingreso/Gasto normal
    async saveDirectTransaction(type, amount, description, accountId, categoryId, date) {
        // Si categoryId es null (viniendo de transfer), buscar o crear "Sin Categoría" o "Transferencia Externa"?
        // Por simplicidad, dejaremos categoryId vacío si viene de transfer, o podríamos asignar una categoría default.
        if (!categoryId) {
             // Try to find a 'General' category or just save empty string/null.
             // Firestore allows inconsistent schema so null is fine, but UI might break if getCategoryById fails.
             // Let's create a dummy category ID or handle it in rendering.
             // Better: Force user to select category if converted? No, simplicity first.
             categoryId = ''; 
        }

        const newVal = type === 'income' ? amount : -amount;
        const accRef = doc(db, `users/${AppData.user.uid}/accounts`, accountId);

        try {
            if (AppData.editingId) {
                // ... (Lógica de edición existente, simplificada) ...
                // Nota: Editar una transacción que FUE transfer pero ahora es normal es complejo.
                // Asumiremos por ahora que el modal maneja creación principalmente o edición simple.
                // Si estamos editando, usar la lógica anterior de revertir + aplicar.
                
                const oldTrans = AppData.transactions.find(t => t.id === AppData.editingId);
                if(oldTrans) {
                     const oldRevertVal = oldTrans.type === 'income' ? -oldTrans.amount : oldTrans.amount;
                     await updateDoc(doc(db, `users/${AppData.user.uid}/accounts`, oldTrans.accountId), { balance: increment(oldRevertVal) });
                }
                
                // Nuevo
                await updateDoc(accRef, { balance: increment(newVal) });
                await updateDoc(doc(db, `users/${AppData.user.uid}/transactions`, AppData.editingId), {
                    type, amount, description, accountId, categoryId, date
                });

            } else {
                // Creación
                await updateDoc(accRef, { balance: increment(newVal) });
                await addDoc(collection(db, `users/${AppData.user.uid}/transactions`), {
                    type, amount, description, accountId, categoryId, date, createdAt: new Date()
                });
            }
        } catch(e) { console.error(e); alert(e.message); }
    },

    // Helper para guardar Transferencia Real
    async saveTransferLogic(fromId, toId, amount, desc, date) {
        const fromAcc = AppData.accounts.find(a => a.id === fromId);
        if(fromAcc.balance < amount) {
            if(!confirm("⚠️ Saldo insuficiente en origen. ¿Continuar?")) return;
        }

        try {
            // 1. Restar de Origen
            await updateDoc(doc(db, `users/${AppData.user.uid}/accounts`, fromId), { balance: increment(-amount) });
            // 2. Sumar a Destino
            await updateDoc(doc(db, `users/${AppData.user.uid}/accounts`, toId), { balance: increment(amount) });
            // 3. Registrar
            await addDoc(collection(db, `users/${AppData.user.uid}/transactions`), {
                type: 'transfer', amount, description: desc,
                accountId: fromId, categoryId: toId, // Hack: Destino en categoryId
                date, createdAt: new Date()
            });
            // Snapshot actualiza UI
        } catch(e) { console.error(e); alert(e.message); }
    },
    
    async deleteTransaction(t) {
        try {
            if (t.type === 'transfer') {
                // Revertir Transferencia: Devolver a Origen, Quitar de Destino
                await updateDoc(doc(db, `users/${AppData.user.uid}/accounts`, t.accountId), { balance: increment(t.amount) }); // Origen
                await updateDoc(doc(db, `users/${AppData.user.uid}/accounts`, t.categoryId), { balance: increment(-t.amount) }); // Destino (categoryId guarda el ID destino)
            } else {
                // Revertir Normal
                const revertVal = t.type === 'income' ? -t.amount : t.amount;
                await updateDoc(doc(db, `users/${AppData.user.uid}/accounts`, t.accountId), { balance: increment(revertVal) });
            }

            await deleteDoc(doc(db, `users/${AppData.user.uid}/transactions`, t.id));
            // onSnapshot actualizará la UI automáticamente
        } catch (e) {
            console.error("Error al borrar:", e);
            alert("Error al eliminar: " + e.message);
        }
    }

};

// ... existing code ...

// --- CHART.JS ---
const Charts = {
    instances: {},
    init() {
        if(typeof Chart === 'undefined') return;

        // Configuración Global de Fuentes y Colores
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Outfit', sans-serif";

        const ctxFlow = document.getElementById('cashflowChart');
        const ctxExp = document.getElementById('expensesChart');
        const ctxBal = document.getElementById('balanceChart');

        // 1. Combo Chart: Flujo de Fondos (Barras + Linea)
        if(ctxFlow) {
            this.instances.cashflow = new Chart(ctxFlow.getContext('2d'), {
                type: 'bar',
                data: { labels: [], datasets: [] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { 
                            display: true,
                            labels: {
                                padding: 10,
                                boxWidth: 12
                            }
                        } 
                    },
                    scales: {
                        x: { 
                            grid: { display: false },
                            ticks: { padding: 5 }
                        },
                        y: { 
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            beginAtZero: true,
                            ticks: { 
                                padding: 5,
                                maxTicksLimit: 6
                            }
                        }
                    },
                    layout: {
                        padding: {
                            top: 10,
                            bottom: 5,
                            left: 5,
                            right: 5
                        }
                    }
                }
            });
        }

        // 2. Doughnut: Gastos
        if(ctxExp) {
            this.instances.expenses = new Chart(ctxExp.getContext('2d'), {
                type: 'doughnut',
                data: { labels: [], datasets: [] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } },
                    borderWidth: 0
                }
            });
        }

        // 3. Line: Tendencia de Saldo
        if(ctxBal) {
            this.instances.balance = new Chart(ctxBal.getContext('2d'), {
                type: 'line',
                data: { labels: [], datasets: [] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return 'Saldo: ' + Utils.formatCurrency(context.parsed.y);
                                }
                            }
                        }
                    },
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' } }
                    },
                    elements: {
                        line: { tension: 0.4 },
                        point: { radius: 0, hitRadius: 10, hoverRadius: 4 } // Minimalist points
                    }
                }
            });
        }
    },

    update() {
        if(!this.instances.cashflow || !AppData.transactions) return;

        // --- PREPARAR DATOS COMUNES ---
        // Ordenar transacciones por fecha ascendente
        const sortedTrans = [...AppData.transactions].sort((a,b) => new Date(a.date) - new Date(b.date));
        
        // --- 1. DATOS PARA GASTOS (Doughnut) ---
        const expenseMap = {};
        AppData.transactions.filter(t => t.type === 'expense').forEach(t => {
            const cat = Utils.getCategoryById(t.categoryId);
            const name = cat ? cat.name : 'Varios';
            if(!expenseMap[name]) expenseMap[name] = { amount:0, color: cat?.color || '#555' };
            expenseMap[name].amount += t.amount;
        });

        const labelsExp = Object.keys(expenseMap);
        this.instances.expenses.data = {
            labels: labelsExp,
            datasets: [{
                data: labelsExp.map(l => expenseMap[l].amount),
                backgroundColor: labelsExp.map(l => expenseMap[l].color),
                borderWidth: 0
            }]
        };
        this.instances.expenses.update();

        // --- 2. DATOS PARA FLUJO DE FONDOS (Cashflow Chart) ---
        // Necesitamos agrupar por día
        const dailyData = {};
        
        // Rellenar días (últimos 30 días por defecto o basado en datos)
        // Por simplicidad, usamos el rango de fechas de las transacciones existentes
        if(sortedTrans.length > 0) {
            sortedTrans.forEach(t => {
                const d = t.date; // YYYY-MM-DD
                if(!dailyData[d]) dailyData[d] = { income: 0, expense: 0, net: 0 };
                
                if(t.type === 'income') dailyData[d].income += t.amount;
                else if(t.type === 'expense') dailyData[d].expense += t.amount;
                // Transfers don't affect net wealth, so ignore
            });
        }

        const dates = Object.keys(dailyData).sort();
        
        // Actualizar Gráfico de Flujo de Fondos (Barras de Ingresos y Gastos)
        this.instances.cashflow.data = {
            labels: dates.map(d => {
                const [y,m,day] = d.split('-');
                return `${day}/${m}`;
            }),
            datasets: [
                {
                    label: 'Ingresos',
                    data: dates.map(d => dailyData[d].income),
                    backgroundColor: '#10b981',
                    borderRadius: 4
                },
                {
                    label: 'Gastos',
                    data: dates.map(d => dailyData[d].expense),
                    backgroundColor: '#ef4444',
                    borderRadius: 4
                }
            ]
        };
        this.instances.cashflow.update();
        
        // --- 3. DATOS PARA VARIACIÓN DE SALDO ---
        // Mostrar si el saldo SUBE o BAJA cada día (Delta)
        const deltas = dates.map(d => dailyData[d].income - dailyData[d].expense);
        
        this.instances.balance.data = {
            labels: dates.map(d => {
                const [y,m,day] = d.split('-');
                return `${day}/${m}`;
            }),
            datasets: [{
                label: 'Variación de Saldo',
                data: deltas,
                backgroundColor: deltas.map(val => val >= 0 ? '#10b981' : '#ef4444'),
                borderRadius: 4,
                barThickness: 20
            }]
        };
        this.instances.balance.update();
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
        const loginOverlay = document.getElementById('login-overlay');
        if(loginOverlay) loginOverlay.style.display = 'none'; // Ocultar login
        
        // Actualizar UI con datos del usuario
        AppData.user = user;
        console.log('Usuario conectado:', user.displayName || user.email);
        
        // Actualizar Sidebar
        const avatarEl = document.querySelector('.user-profile .avatar');
        const nameEl = document.querySelector('.user-profile .user-info span');
        const mailEl = document.querySelector('.user-profile .user-info small');
        
        console.log('Elementos encontrados:', { avatarEl, nameEl, mailEl });
        console.log('Datos del usuario:', { 
            displayName: user.displayName, 
            email: user.email, 
            photoURL: user.photoURL 
        });
        
        if(avatarEl && nameEl && mailEl) {
            if(user.photoURL) {
                avatarEl.innerText = '';
                avatarEl.style.backgroundImage = `url(${user.photoURL})`;
                avatarEl.style.backgroundSize = 'cover';
            } else {
                 avatarEl.innerText = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
                 avatarEl.style.backgroundImage = 'none';
            }
            nameEl.innerText = user.displayName || user.email || 'Usuario';
            mailEl.innerText = user.email || 'Anónimo';
            console.log('Perfil actualizado correctamente');
        } else {
            console.warn('No se encontraron todos los elementos del perfil');
        }

        // Cargar Datos
        const loadCollection = (colName, targetArray) => {
            try {
                const q = collection(db, `users/${user.uid}/${colName}`);
                const unsub = onSnapshot(q, (snap) => {
                    AppData[targetArray] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    if(colName === 'transactions') {
                         // Ordenar por fecha de creación (más reciente primero)
                         AppData.transactions.sort((a,b) => {
                             const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                             const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                             return dateB - dateA;
                         });
                    }
                    UI.renderAll();
                }, (error) => {
                     console.error("Error acceso datos:", error);
                     if(colName === 'accounts') alert("⚠️ Error de Permisos: No olvides pegar las reglas en Firebase Console.");
                });
                if(AppData.listeners) AppData.listeners.push(unsub);
            } catch (e) { console.error(e); }
        };

        loadCollection('accounts', 'accounts');
        loadCollection('transactions', 'transactions');
        loadCollection('categories', 'categories');

    } else {
        // Usuario NO Logueado
        const loginOverlay = document.getElementById('login-overlay');
        if(loginOverlay) loginOverlay.style.display = 'flex'; // Mostrar login
        
        // Desuscribir listeners anteriores para evitar mezclas o fugas de memoria
        if(AppData.listeners) {
            AppData.listeners.forEach(unsub => unsub());
            AppData.listeners = [];
        }

        // Limpiar datos en memoria por seguridad
        AppData.accounts = [];
        AppData.transactions = [];
        AppData.categories = [];
        UI.renderAll();
    }
});

// Inicializar la aplicación
UI.init();
