# 📚 Money360 - Manual de Usuario

## Índice
1. [Introducción](#introducción)
2. [Inicio de Sesión](#inicio-de-sesión)
3. [Panel Principal (Dashboard)](#panel-principal-dashboard)
4. [Gestión de Cuentas](#gestión-de-cuentas)
5. [Registro de Movimientos](#registro-de-movimientos)
6. [Transferencias](#transferencias)
7. [Etiquetas/Categorías](#etiquetascategorías)
8. [Historial de Movimientos](#historial-de-movimientos)
9. [Cerrar Sesión](#cerrar-sesión)
10. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

**Money360** es una aplicación web de gestión financiera personal que te permite:
- 💰 Administrar múltiples cuentas (efectivo, banco, tarjetas)
- 📊 Registrar ingresos y gastos
- 🔄 Realizar transferencias entre cuentas
- 🏷️ Organizar movimientos por categorías
- 📈 Visualizar tu situación financiera en tiempo real

---

## Inicio de Sesión

### Primera vez

1. Abre la aplicación en tu navegador
2. Verás la pantalla de bienvenida con dos opciones:
   
   **Opción 1: Google** (Recomendado)
   - Haz clic en el botón "Continuar con Google"
   - Selecciona tu cuenta de Google
   - Autoriza el acceso

   **Opción 2: Correo y Contraseña**
   - Haz clic en la pestaña "Crear Cuenta"
   - Ingresa tu correo electrónico
   - Crea una contraseña segura (mínimo 6 caracteres)
   - Confirma la contraseña
   - Haz clic en "Crear Cuenta"

### Usuarios existentes

1. Selecciona la pestaña "Ingresar"
2. Ingresa tu correo y contraseña
3. Haz clic en "Ingresar"

> **💡 Tip:** Tu sesión se mantiene activa automáticamente. No necesitas iniciar sesión cada vez que abres la aplicación.

---

## Panel Principal (Dashboard)

Al iniciar sesión, verás el **Dashboard** con:

### Tarjetas de Resumen
- **Total Ingresos**: Suma de todos tus ingresos registrados
- **Total Gastos**: Suma de todos tus gastos
- **Balance Total**: Suma del saldo de todas tus cuentas

### Gráfico de Balances
Visualización gráfica de la distribución de tus cuentas

### Navegación
En el menú lateral izquierdo encontrarás:
- 🏠 **Inicio**: Panel principal
- 💼 **Cuentas**: Gestión de cuentas
- 💸 **Movimientos**: Historial de transacciones
- 🏷️ **Etiquetas**: Gestión de categorías

---

## Gestión de Cuentas

### Crear una Nueva Cuenta

1. Haz clic en "Cuentas" en el menú lateral
2. Presiona el botón "**+ Crear Cuenta**"
3. Completa el formulario:
   - **Nombre**: Ejemplo: "Efectivo", "Banco BCP", "Tarjeta Visa"
   - **Tipo**: Selecciona entre:
     - Efectivo
     - Banco / Tarjeta Débito
     - Tarjeta de Crédito
     - Ahorros
   - **Saldo Inicial**: El dinero que actualmente tienes en esa cuenta
   - **Color**: Elige un color para identificar visualmente la cuenta
4. Presiona "**Crear Cuenta**"

### Editar una Cuenta

1. Haz clic sobre la tarjeta de la cuenta que deseas editar
2. Modifica los campos necesarios
3. Presiona "**Guardar**"

> **⚠️ Importante:** Puedes editar el saldo manualmente para ajustes o correcciones.

---

## Registro de Movimientos

### Tipos de Movimientos

Money360 maneja 3 tipos de movimientos:

1. **Ingreso** 💚: Dinero que entra (salario, ventas, etc.)
2. **Gasto** 🔴: Dinero que sale (compras, servicios, etc.)
3. **Traspaso** 🔄: Movimiento de dinero entre cuentas

### Registrar un Ingreso o Gasto

1. Haz clic en el botón "**+ Nuevo Movimiento**"
2. Selecciona el tipo: **Ingreso** o **Gasto**
3. Completa el formulario:
   - **Monto**: Cantidad de dinero
   - **Descripción**: ¿De qué es este movimiento? (Ejemplo: "Salario de enero")
   - **Cuenta**: Selecciona la cuenta afectada
   - **Etiqueta/Categoría**: Clasifica el movimiento (Ejemplo: "Comida", "Transporte")
   - **Fecha**: Fecha del movimiento (por defecto: hoy)
4. Presiona "**Guardar**"

**Efectos:**
- ✅ **Ingreso**: Suma el monto al saldo de la cuenta
- ✅ **Gasto**: Resta el monto del saldo de la cuenta

---

## Transferencias

Las transferencias permiten mover dinero entre tus cuentas o registrar movimientos externos.

### Tipos de Transferencias

1. **Ingreso desde fuera del sistema**
   - Origen: "... fuera del sistema"
   - Destino: Una de tus cuentas
   - Ejemplo: Te prestan dinero en efectivo

2. **Gasto hacia fuera del sistema**
   - Origen: Una de tus cuentas
   - Destino: "... fuera del sistema"
   - Ejemplo: Prestas dinero a un amigo

3. **Transferencia entre tus cuentas**
   - Origen: Cuenta A
   - Destino: Cuenta B
   - Ejemplo: Retiras dinero del banco a efectivo

### Cómo Hacer una Transferencia

1. Haz clic en "**+ Nuevo Movimiento**"
2. Selecciona el tipo "**Traspaso**"
3. Verás una interfaz especial con **Origen → Destino**
4. Completa:
   - **Monto**: Cantidad a transferir
   - **Descripción**: Motivo del traspaso
   - **Origen**: Selecciona de dónde sale el dinero
   - **Destino**: Selecciona a dónde va el dinero
   - **Fecha**: Fecha de la operación
5. Lee el mensaje informativo azul para entender qué tipo de operación harás
6. Presiona "**Guardar**"

**Efectos:**
- ✅ La cuenta de origen **disminuye** el monto
- ✅ La cuenta de destino **aumenta** el monto
- ✅ El balance total se mantiene igual (excepto en transferencias externas)

> **⚠️ Nota:** Si eliges la misma cuenta como origen y destino, el sistema te avisará del error.

---

## Etiquetas/Categorías

Las categorías te permiten clasificar tus movimientos para un mejor análisis.

### Crear una Categoría

1. Haz clic en "**Etiquetas**" en el menú lateral
2. Presiona "**+ Nueva Etiqueta**"
3. Completa:
   - **Nombre**: Ejemplo: "Comida", "Transporte", "Salario"
   - **Tipo**: Ingreso o Gasto
   - **Color**: Para identificación visual
4. Presiona "**Guardar Etiqueta**"

### Categorías Sugeridas

**Ingresos:**
- Salario
- Freelance
- Ventas
- Inversiones

**Gastos:**
- Comida
- Transporte
- Servicios (luz, agua, internet)
- Entretenimiento
- Salud
- Educación

### Editar o Eliminar Categorías

1. Haz clic sobre la categoría que deseas modificar
2. Para editar: Modifica y presiona "**Guardar**"
3. Para eliminar: Haz clic en el ícono de basura 🗑️

---

## Historial de Movimientos

### Ver Todos los Movimientos

1. Haz clic en "**Movimientos**" en el menú lateral
2. Verás una lista cronológica de todas tus transacciones

### Información Mostrada

Cada movimiento muestra:
- ✅ Ícono y color según el tipo
- ✅ Descripción
- ✅ Fecha
- ✅ Categoría
- ✅ Cuenta asociada
- ✅ Monto (con + para ingresos, - para gastos)

### Editar un Movimiento

1. Haz clic sobre el movimiento que deseas editar
2. Modifica los campos necesarios
3. Presiona "**Guardar**"

> **⚠️ Nota:** Las transferencias NO se pueden editar directamente. Debes eliminarlas y crearlas nuevamente.

### Eliminar un Movimiento

1. Haz clic en el botón de basura 🗑️ del movimiento
2. Confirma la eliminación

**Efectos:**
- ✅ El saldo de la cuenta se ajusta automáticamente
- ✅ En transferencias, ambas cuentas se revierten a su estado anterior

---

## Cerrar Sesión

1. Haz clic en el botón rojo de **cerrar sesión** 🚪 en la parte inferior del menú lateral
2. Confirma que deseas cerrar sesión
3. Serás redirigido a la pantalla de login

> **💡 Tip:** Tu sesión permanece activa automáticamente. Solo necesitas cerrar sesión si usas un equipo compartido.

---

## Preguntas Frecuentes

### ¿Mis datos están seguros?

Sí, toda la información se almacena en **Firebase** (Google Cloud), una plataforma segura y confiable. Solo tú puedes acceder a tus datos mediante tu cuenta.

### ¿Puedo usar Money360 sin conexión a internet?

No, Money360 requiere conexión a internet para sincronizar tus datos con la nube.

### ¿Qué pasa si borro una cuenta por error?

Actualmente no hay función de "deshacer". Los movimientos asociados a esa cuenta quedan huérfanos. **Precaución:** Asegúrate antes de eliminar.

### ¿Puedo exportar mis datos?

Actualmente Money360 no tiene función de exportación integrada. Esta característica está en desarrollo.

### ¿Cómo corrijo un saldo incorrecto?

1. Ve a "Cuentas"
2. Haz clic en la cuenta con saldo incorrecto
3. Edita manualmente el campo "Saldo Inicial"
4. Guarda los cambios

### ¿Puedo tener múltiples usuarios?

Sí, cada usuario tiene su propia sesión y datos separados mediante su cuenta de Google o email.

### ¿Funciona en móvil?

Sí, Money360 es responsive y se adapta a pantallas móviles, tablets y computadoras.

### ¿Hay límite de cuentas o movimientos?

No hay límite establecido. Puedes crear tantas cuentas, categorías y movimientos como necesites.

---

## Soporte y Contacto

Para reportar errores, sugerencias o preguntas adicionales:
- 📧 Email: [tu-email@ejemplo.com]
- 💬 GitHub Issues: [enlace-repo]

---

**Versión del Manual:** 1.0  
**Última actualización:** Enero 2026  
**Aplicación:** Money360 Financial Manager
