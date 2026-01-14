# 🔧 Money360 - Documentación Técnica

## Índice
1. [Arquitectura General](#arquitectura-general)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Configuración de Firebase](#configuración-de-firebase)
5. [Estructura de Datos](#estructura-de-datos)
6. [Módulos y Componentes](#módulos-y-componentes)
7. [Flujo de Autenticación](#flujo-de-autenticación)
8. [Flujo de Datos](#flujo-de-datos)
9. [Lógica de Negocio](#lógica-de-negocio)
10. [Renderizado de UI](#renderizado-de-ui)
11. [Funciones Clave](#funciones-clave)
12. [Reglas de Seguridad Firebase](#reglas-de-seguridad-firebase)
13. [Optimizaciones y Buenas Prácticas](#optimizaciones-y-buenas-prácticas)

---

## Arquitectura General

Money360 es una **Single Page Application (SPA)** desarrollada con vanilla JavaScript y Firebase como backend.

### Patrón de Diseño

La aplicación sigue una arquitectura **MVC simplificada**:

- **Model**: Firebase Firestore (base de datos en tiempo real)
- **View**: HTML + CSS con manipulación dinámica del DOM
- **Controller**: JavaScript con módulos separados por responsabilidad

### Flujo de Datos Unidireccional

```
Firebase (Source of Truth)
    ↓
onSnapshot listeners
    ↓
AppData (Local State)
    ↓
UI Render Functions
    ↓
DOM (User Interface)
```

---

## Estructura de Archivos

```
money360/
│
├── index.html              # Estructura HTML principal
├── css/
│   └── style.css          # Estilos globales
├── js/
│   ├── firebase.js        # Configuración y exportaciones Firebase
│   └── app.js             # Lógica principal de la aplicación
│
├── MANUAL_USUARIO.md      # Este manual
└── DOCUMENTACION_TECNICA.md # Documentación del código
```

---

## Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica
- **CSS3**: 
  - Variables CSS (`:root`)
  - Flexbox y Grid
  - Glassmorphism (efectos de vidrio)
  - Animaciones y transiciones
- **JavaScript ES6+**:
  - Módulos ES6 (`import/export`)
  - Async/Await para operaciones asíncronas
  - Arrow functions
  - Template literals
  - Destructuring

### Backend & Database
- **Firebase Authentication**: Gestión de usuarios
- **Firebase Firestore**: Base de datos NoSQL en tiempo real
- **Firebase Hosting** (opcional): Para deployment

### Librerías Externas
- **Chart.js**: Gráficos interactivos
- **Boxicons**: Biblioteca de íconos
- **Google Fonts**: Tipografía (Outfit)

---

## Configuración de Firebase

### Archivo: `js/firebase.js`

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, ... } from 'firebase/auth';
import { getFirestore, ... } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    // ... resto de configuración
};

// Inicialización
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Servicios Utilizados

1. **Authentication**:
   - Google OAuth
   - Email/Password
   - Persistencia de sesión automática

2. **Firestore**:
   - Colecciones anidadas por usuario
   - Listeners en tiempo real (`onSnapshot`)
   - Operaciones atómicas (`increment`)

---

## Estructura de Datos

### Modelo de Base de Datos

```
users/
  └── {userId}/
      ├── accounts/          # Colección de cuentas
      │   └── {accountId}
      │       ├── name: string
      │       ├── type: "cash" | "bank" | "credit" | "saving"
      │       ├── balance: number
      │       ├── color: string (hex)
      │       └── createdAt: timestamp
      │
      ├── transactions/      # Colección de movimientos
      │   └── {transactionId}
      │       ├── type: "income" | "expense" | "transfer"
      │       ├── amount: number
      │       ├── description: string
      │       ├── accountId: string (ref a account)
      │       ├── categoryId: string (ref a category o destino en transfers)
      │       ├── date: string (YYYY-MM-DD)
      │       └── createdAt: timestamp
      │
      └── categories/        # Colección de categorías
          └── {categoryId}
              ├── name: string
              ├── type: "income" | "expense"
              └── color: string (hex)
```

### Objeto AppData (Estado Local)

```javascript
const AppData = {
    user: null,           // Usuario actual de Firebase Auth
    accounts: [],         // Array de cuentas
    transactions: [],     // Array de transacciones
    categories: [],       // Array de categorías
    editingId: null,      // ID del elemento en edición
    editingType: null,    // 'account' | 'transaction' | 'category'
    listeners: []         // Array de funciones unsubscribe de Firebase
};
```

---

## Módulos y Componentes

### 1. Utils (Utilidades)

Funciones auxiliares para formateo y búsqueda:

```javascript
const Utils = {
    formatCurrency(amount) {
        // Formatea números a moneda local (PEN)
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount);
    },
    
    formatDate(dateStr) {
        // Convierte YYYY-MM-DD a formato legible
    },
    
    getAccountById(id) {
        // Busca cuenta por ID en AppData.accounts
    },
    
    getCategoryById(id) {
        // Busca categoría por ID en AppData.categories
    }
};
```

### 2. UI (Interfaz de Usuario)

Maneja toda la interacción con el DOM:

```javascript
const UI = {
    elements: {
        // Referencias a elementos del DOM
        views: document.querySelectorAll('.view'),
        navLinks: document.querySelectorAll('.nav-links li'),
        // ... más elementos
    },
    
    init() {
        // Inicializa event listeners y Chart.js
    },
    
    bindEvents() {
        // Vincula eventos del usuario
    },
    
    switchView(viewName) {
        // Cambia entre vistas (dashboard, accounts, etc.)
    },
    
    populateSelects() {
        // Llena los <select> con datos dinámicos
    },
    
    renderAll() {
        // Renderiza todos los elementos
    },
    
    renderAccounts() {
        // Renderiza las tarjetas de cuentas
    },
    
    renderTransactions() {
        // Renderiza la lista de transacciones
    },
    
    // ... más métodos de renderizado
};
```

### 3. Logic (Lógica de Negocio)

Maneja las operaciones CRUD con Firebase:

```javascript
const Logic = {
    async saveAccount() {
        // Crea o actualiza una cuenta
    },
    
    async saveCategory() {
        // Crea o actualiza una categoría
    },
    
    async deleteCategory(id) {
        // Elimina una categoría
    },
    
    async saveTransaction() {
        // Crea una transacción
        // Maneja 3 casos: income, expense, transfer
    },
    
    async saveDirectTransaction(type, amount, ...) {
        // Helper para guardar income/expense
    },
    
    async saveTransferLogic(fromId, toId, amount, ...) {
        // Helper para transferencias reales
    },
    
    async deleteTransaction(t) {
        // Elimina transacción y revierte saldos
    }
};
```

### 4. Charts (Gráficos)

Maneja la visualización con Chart.js:

```javascript
const Charts = {
    instances: {},  // Almacena instancias de Chart.js
    
    init() {
        // Inicializa gráficos vacíos
    },
    
    update() {
        // Actualiza datos de gráficos
    }
};
```

---

## Flujo de Autenticación

### 1. Inicio de Sesión

```javascript
// En UI.initAuthUI()
btnLoginGoogle.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // onAuthStateChanged se dispara automáticamente
});
```

### 2. Estado de Autenticación

```javascript
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario autenticado
        // 1. Ocultar login overlay
        // 2. Actualizar perfil en sidebar
        // 3. Suscribirse a colecciones de Firestore
        // 4. Renderizar UI
    } else {
        // Usuario NO autenticado
        // 1. Mostrar login overlay
        // 2. Desuscribir listeners
        // 3. Limpiar AppData
    }
});
```

### 3. Persistencia de Sesión

Firebase maneja automáticamente la persistencia usando `localStorage`. El usuario permanece autenticado hasta que llame a `signOut()`.

---

## Flujo de Datos

### Carga Inicial (onAuthStateChanged)

```
1. Usuario inicia sesión
   ↓
2. onAuthStateChanged detecta usuario
   ↓
3. loadCollection() para cada colección
   ↓
4. onSnapshot() escucha cambios en tiempo real
   ↓
5. Actualiza AppData.{accounts|transactions|categories}
   ↓
6. UI.renderAll() actualiza la interfaz
```

### Creación de Datos

```
1. Usuario llena formulario
   ↓
2. Event submit capturado
   ↓
3. Logic.save{Account|Transaction|Category}()
   ↓
4. addDoc() o updateDoc() a Firestore
   ↓
5. onSnapshot detecta cambio automáticamente
   ↓
6. AppData se actualiza
   ↓
7. UI se re-renderiza
```

### Listeners en Tiempo Real

```javascript
const loadCollection = (colName, targetArray) => {
    const q = collection(db, `users/${user.uid}/${colName}`);
    const unsub = onSnapshot(q, (snap) => {
        AppData[targetArray] = [];
        snap.forEach(doc => {
            AppData[targetArray].push({ id: doc.id, ...doc.data() });
        });
        UI.renderAll();
    });
    AppData.listeners.push(unsub);
};
```

**Ventajas:**
- ✅ Sincronización automática multi-dispositivo
- ✅ No necesita refresh manual
- ✅ UI siempre actualizada

---

## Lógica de Negocio

### Transacciones: 3 Tipos

#### 1. Income/Expense (Normal)

```javascript
async saveDirectTransaction(type, amount, description, accountId, categoryId, date) {
    if (AppData.editingId) {
        // EDICIÓN: Revertir balance antiguo, aplicar nuevo
        const old = AppData.transactions.find(t => t.id === AppData.editingId);
        const revertVal = old.type === 'income' ? -old.amount : old.amount;
        await updateDoc(accountRef, { balance: increment(revertVal) });
        
        const newVal = type === 'income' ? amount : -amount;
        await updateDoc(accountRef, { balance: increment(newVal) });
        await updateDoc(transactionRef, { ... });
    } else {
        // CREACIÓN
        const val = type === 'income' ? amount : -amount;
        await updateDoc(accountRef, { balance: increment(val) });
        await addDoc(transactionsCol, { ... });
    }
}
```

#### 2. Transfer (Cuenta → Cuenta)

```javascript
async saveTransferLogic(fromId, toId, amount, desc, date) {
    // 1. Verificar saldo suficiente
    if(fromAcc.balance < amount) {
        if(!confirm("Saldo insuficiente. ¿Continuar?")) return;
    }
    
    // 2. Restar del origen
    await updateDoc(fromRef, { balance: increment(-amount) });
    
    // 3. Sumar al destino
    await updateDoc(toRef, { balance: increment(amount) });
    
    // 4. Registrar transacción
    await addDoc(transactionsCol, {
        type: 'transfer',
        accountId: fromId,
        categoryId: toId,  // HACK: Guardamos destino en categoryId
        // ...
    });
}
```

#### 3. Transfer Externo

**Caso A: Externo → Cuenta Mía**
```javascript
if (fromId === 'external_source' && toId !== 'external_dest') {
    // Se trata como INGRESO
    return this.saveDirectTransaction('income', amount, description, toId, null, date);
}
```

**Caso B: Cuenta Mía → Externo**
```javascript
if (fromId !== 'external_source' && toId === 'external_dest') {
    // Se trata como GASTO
    return this.saveDirectTransaction('expense', amount, description, fromId, null, date);
}
```

### Eliminación de Transacciones

```javascript
async deleteTransaction(t) {
    if (t.type === 'transfer') {
        // Revertir: devolver a origen, quitar de destino
        await updateDoc(originRef, { balance: increment(t.amount) });
        await updateDoc(destRef, { balance: increment(-t.amount) });
    } else {
        // Revertir income/expense
        const revertVal = t.type === 'income' ? -t.amount : t.amount;
        await updateDoc(accountRef, { balance: increment(revertVal) });
    }
    
    await deleteDoc(transactionRef);
}
```

---

## Renderizado de UI

### Renderizado Reactivo

Cada cambio en Firestore dispara `UI.renderAll()`:

```javascript
renderAll() {
    this.renderAccounts();
    this.renderTransactions();
    this.renderCategories();
    this.renderDashboard();
}
```

### Ejemplo: renderAccounts()

```javascript
renderAccounts() {
    const container = this.elements.accountsList;
    container.innerHTML = '';  // Limpiar contenedor

    AppData.accounts.forEach(acc => {
        const el = document.createElement('div');
        el.className = 'account-card';
        el.onclick = () => UI.openEditAccount(acc);
        
        el.innerHTML = `
            <style>.account-card[data-id="${acc.id}"]::before { 
                background-color: ${acc.color}; 
            }</style>
            <div class="acc-type">${this.getAccountTypeName(acc.type)}</div>
            <div class="acc-name">${acc.name}</div>
            <div class="acc-balance">${Utils.formatCurrency(acc.balance)}</div>
        `;
        
        container.appendChild(el);
    });
}
```

### Ventaja del Enfoque

- ✅ Simple y predecible
- ✅ No requiere framework
- ✅ Fácil de debuggear
- ❌ Puede ser ineficiente con grandes cantidades de datos (futura optimización: renderizado virtual)

---

## Funciones Clave

### populateSelects()

**Propósito:** Llenar dropdowns dinámicamente según el contexto

```javascript
populateSelects(selectedCategoryId = null, selectedAccountId = null) {
    const type = document.querySelector('input[name="type"]:checked').value;
    
    if(type === 'transfer') {
        // Modo Transferencia: llenar trans-from y trans-to
        const selFrom = document.getElementById('trans-from');
        const selTo = document.getElementById('trans-to');
        
        // Agregar opción "Externo"
        selFrom.add(new Option('... fuera del sistema', 'external_source'));
        AppData.accounts.forEach(acc => selFrom.add(createOption(acc)));
        
        selTo.add(new Option('... fuera del sistema', 'external_dest'));
        AppData.accounts.forEach(acc => selTo.add(createOption(acc)));
    } else {
        // Modo Normal: llenar trans-account y trans-category
        // ...
    }
}
```

### switchView()

**Propósito:** Navegación entre vistas (SPA)

```javascript
switchView(viewName) {
    // Ocultar todas las vistas
    this.elements.views.forEach(view => {
        view.classList.add('hidden');
        view.classList.remove('active');
    });
    
    // Mostrar vista objetivo
    const target = document.getElementById(`view-${viewName}`);
    if(target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
}
```

### Gestión de Modales

```javascript
openModal(modal) {
    modal.classList.add('active');
}

closeModal(modal) {
    modal.classList.remove('active');
    this.resetForm(modal.querySelector('form').id);
}

resetForm(formId) {
    document.getElementById(formId).reset();
    AppData.editingId = null;
    AppData.editingType = null;
}
```

---

## Reglas de Seguridad Firebase

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios solo pueden leer/escribir sus propios datos
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Explicación:**
- `request.auth != null`: Usuario está autenticado
- `request.auth.uid == userId`: El UID coincide con la ruta

### Storage Rules (si se usa)

```javascript
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Optimizaciones y Buenas Prácticas

### 1. Listeners y Memory Leaks

**Problema:** Los listeners de Firebase pueden causar fugas de memoria si no se limpian.

**Solución:**
```javascript
// Guardar referencias a listeners
AppData.listeners = [];

// Al suscribirse
const unsub = onSnapshot(q, (snap) => { ... });
AppData.listeners.push(unsub);

// Al cerrar sesión
AppData.listeners.forEach(unsub => unsub());
AppData.listeners = [];
```

### 2. Operaciones Atómicas

En lugar de:
```javascript
// ❌ MALO: Race condition
const acc = await getDoc(accountRef);
const newBalance = acc.data().balance + amount;
await updateDoc(accountRef, { balance: newBalance });
```

Usar:
```javascript
// ✅ BUENO: Operación atómica
await updateDoc(accountRef, { balance: increment(amount) });
```

### 3. Debounce en Búsquedas

Para futuras funciones de búsqueda:
```javascript
const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};
```

### 4. Lazy Loading de Vistas

Las vistas se cargan todas de una vez en `index.html`. Para optimizar:
- Considerar cargar vistas bajo demanda
- Usar `IntersectionObserver` para carga diferida

### 5. Caché Local

Firebase ya maneja caché automáticamente, pero para mayor control:
```javascript
const db = getFirestore(app);
enableMultiTabIndexedDbPersistence(db);
```

### 6.Validación de Formularios

```javascript
// Validar antes de enviar
if (isNaN(amount) || amount <= 0) {
    return alert("Monto inválido");
}

if (!accountId) {
    return alert('Selecciona una cuenta');
}
```

### 7. Manejo de Errores

```javascript
try {
    await addDoc(collection(db, ...), {...});
} catch(e) {
    console.error("Error al guardar:", e);
    alert("Error: " + e.message);
}
```

### 8. Logging para Debug

```javascript
console.log('Usuario conectado:', user.displayName || user.email);
console.log('Elementos encontrados:', { avatarEl, nameEl, mailEl });
console.log('Perfil actualizado correctamente');
```

---

## Estructura de Eventos

### Event Flow

```
User Action (click, submit)
    ↓
Event Listener
    ↓
Validation
    ↓
Logic.save*() / Logic.delete*()
    ↓
Firebase Operation (addDoc, updateDoc, deleteDoc)
    ↓
onSnapshot Triggered
    ↓
AppData Updated
    ↓
UI.render*()
    ↓
DOM Updated
```

### Ejemplo Completo: Crear Cuenta

```javascript
// 1. Usuario llena formulario y presiona "Guardar"
formAccount.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // 2. Ejecutar lógica
    Logic.saveAccount();
    
    // 3. Cerrar modal
    UI.closeModal(modalAccount);
});

// 4. En Logic.saveAccount()
async saveAccount() {
    const name = document.getElementById('acc-name').value;
    const type = document.getElementById('acc-type').value;
    // ...
    
    if (AppData.editingId) {
        // Actualizar existente
        await updateDoc(docRef, { name, type, ... });
    } else {
        // Crear nuevo
        await addDoc(collection(db, ...), { name, type, ... });
    }
}

// 5. onSnapshot detecta cambio
onSnapshot(accountsQuery, (snap) => {
    AppData.accounts = [];
    snap.forEach(doc => {
        AppData.accounts.push({ id: doc.id, ...doc.data() });
    });
    UI.renderAll();  // 6. Re-renderiza UI
});
```

---

## Consideraciones de Escalabilidad

### Límites Actuales
- Firebase Firestore Free Tier:
  - 50,000 lecturas/día
  - 20,000 escrituras/día
  - 20,000 deletes/día
  - 1 GB almacenamiento

### Optimizaciones Futuras
1. **Paginación**: Para historial largo de transacciones
2. **Índices Compuestos**: Para queries complejas
3. **Cloud Functions**: Para lógica del lado del servidor
4. **Caché Agresivo**: Reducir lecturas de Firestore
5. **Batch Writes**: Agrupar operaciones múltiples

---

## Testing (Futuro)

### Sugerencias para Implementar Tests

```javascript
// Unit Tests (Jest)
describe('Utils.formatCurrency', () => {
    test('formatea correctamente números positivos', () => {
        expect(Utils.formatCurrency(100)).toBe('S/ 100.00');
    });
});

// Integration Tests
describe('Logic.saveTransaction', () => {
    test('crea ingreso y actualiza balance', async () => {
        // ...
    });
});
```

---

## Deployment

### Opción 1: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Opción 2: Netlify

1. Conectar repositorio GitHub
2. Build command: (ninguno, es vanilla)
3. Publish directory: `/`

### Opción 3: Vercel

Similar a Netlify, deploy directo desde GitHub.

---

## Changelog y Versionado

### v1.0.0 - Enero 2026
- ✅ Autenticación Google y Email
- ✅ CRUD Cuentas
- ✅ CRUD Categorías
- ✅ CRUD Transacciones
- ✅ Transferencias entre cuentas
- ✅ Transferencias externas
- ✅ Dashboard con gráficos
- ✅ Responsive design

### Próximas Funcionalidades (Roadmap)
- 📊 Gráficos avanzados (gastos por categoría, línea de tiempo)
- 📤 Exportación de datos (CSV, Excel, PDF)
- 🔍 Búsqueda y filtros avanzados
- 🌐 Internacionalización (i18n)
- 📱 PWA (Progressive Web App)
- 🔔 Recordatorios y presupuestos
- 🤖 IA para recomendaciones financieras

---

## Soporte y Contribuciones

### Reportar Bugs
1. Crear issue en GitHub
2. Incluir:
   - Pasos para reproducir
   - Navegador y versión
   - Screenshots si aplica
   - Mensajes de error de consola

### Contribuir
1. Fork del repositorio
2. Crear branch de feature
3. Commit con mensajes descriptivos
4. Pull request con descripción detallada

---

**Documentación Técnica v1.0**  
**Última actualización:** Enero 2026  
**Autor:** [Tu Nombre]  
**Licencia:** MIT (o la que prefieras)
