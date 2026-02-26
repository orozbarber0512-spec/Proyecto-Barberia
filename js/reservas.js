const CONFIG = {
  webAppURL: atob('aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3VlZBWEpkM1dmVEFLVm1yT0pNOVkyMUFZbnpYU3hKSlBQdHZPZmlkaFl1dVF6ZXpTNXJybGhlcFRGS0xpbnVNSkEvZXhlYw=='),
  
  barberos: {
    barbero1: 'Felipe Orozco',
    barbero2: 'Tomas Orozco',
    barbero3: 'Sergio Jiménez'
  },
  
  maxIntentos: 5,
  timeoutIntentos: 300000,
  maxLongitudNombre: 100,
  maxLongitudEmail: 254
};

// ========================================
// SISTEMA DE RECORDAR CREDENCIALES
// ========================================

const CredencialesManager = {
    // Guardar credenciales en localStorage
    guardar(nombre, email) {
        try {
            localStorage.setItem('oroz_nombre', nombre);
            localStorage.setItem('oroz_email', email);
            localStorage.setItem('oroz_guardado_fecha', new Date().toISOString());
            console.log('✅ Credenciales guardadas');
        } catch (e) {
            console.error('Error guardando credenciales:', e);
        }
    },
    
    // Obtener credenciales guardadas
    obtener() {
        try {
            return {
                nombre: localStorage.getItem('oroz_nombre') || '',
                email: localStorage.getItem('oroz_email') || ''
            };
        } catch (e) {
            console.error('Error obteniendo credenciales:', e);
            return { nombre: '', email: '' };
        }
    },
    
    // Limpiar credenciales
    limpiar() {
        try {
            localStorage.removeItem('oroz_nombre');
            localStorage.removeItem('oroz_email');
            localStorage.removeItem('oroz_guardado_fecha');
            console.log('🗑️ Credenciales eliminadas');
        } catch (e) {
            console.error('Error limpiando credenciales:', e);
        }
    },
    
    // Verificar si hay credenciales guardadas
    tieneGuardadas() {
        return !!localStorage.getItem('oroz_nombre');
    }
};

// ========================================
// UTILIDADES DE SEGURIDAD
// ========================================

function sanitizarTexto(texto) {
  if (!texto || typeof texto !== 'string') return '';
  
  return texto
    .trim()
    .replace(/[<>\"']/g, '')
    .substring(0, 200);
}

function validarEmail(email) {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email) && email.length <= CONFIG.maxLongitudEmail;
}

function validarNombre(nombre) {
  if (!nombre || nombre.length < 3 || nombre.length > CONFIG.maxLongitudNombre) {
    return false;
  }
  
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return regex.test(nombre);
}

function validarFecha(fechaStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(fechaStr)) return false;
  
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  return fecha >= hoy;
}

const RateLimiter = {
  intentos: {},
  
  registrarIntento(accion) {
    const ahora = Date.now();
    
    if (!this.intentos[accion]) {
      this.intentos[accion] = [];
    }
    
    this.intentos[accion] = this.intentos[accion].filter(
      tiempo => ahora - tiempo < CONFIG.timeoutIntentos
    );
    
    this.intentos[accion].push(ahora);
  },
  
  permitirAccion(accion) {
    if (!this.intentos[accion]) return true;
    return this.intentos[accion].length < CONFIG.maxIntentos;
  },
  
  obtenerTiempoEspera(accion) {
    if (!this.intentos[accion] || this.intentos[accion].length === 0) {
      return 0;
    }
    
    const primerIntento = this.intentos[accion][0];
    const tiempoTranscurrido = Date.now() - primerIntento;
    const tiempoRestante = CONFIG.timeoutIntentos - tiempoTranscurrido;
    
    return Math.max(0, Math.ceil(tiempoRestante / 1000 / 60));
  }
};

// ========================================
// VARIABLES GLOBALES
// ========================================

let barberoActual = null;

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const esProduccion = window.location.hostname !== 'localhost';
  
  if (!esProduccion) {
    console.log('%c✂️ Sistema de Reservas - Oroz Barber v2.0 SEGURO', 
                'color: #DAA520; font-weight: bold; font-size: 14px;');
  }
  
  configurarEventos();
  configurarFechaMinima();
});

// ========================================
// CONFIGURACIÓN DE EVENTOS
// ========================================

function configurarEventos() {
  // Evento: Click en tarjetas de barbero
  document.querySelectorAll('.barbero-card').forEach(card => {
    card.addEventListener('click', () => {
      const barberoId = card.dataset.barbero;
      const nombreBarbero = CONFIG.barberos[barberoId];
      
      if (nombreBarbero) {
        abrirModal(barberoId, nombreBarbero);
      }
    });
    
    // Soporte para teclado (accesibilidad)
    card.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        card.click();
      }
    });
  });
  
  // Evento: Cerrar modal
  const btnCerrar = document.querySelector('.modal-close');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', cerrarModal);
  }
  
  const modal = document.getElementById('reservaModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cerrarModal();
      }
    });
  }
  
  // Evento: Cambio de servicio o fecha
  const selectServicio = document.getElementById('servicio');
  const inputFecha = document.getElementById('fecha');
  
  if (selectServicio && inputFecha) {
    selectServicio.addEventListener('change', cargarHorasDisponibles);
    inputFecha.addEventListener('change', cargarHorasDisponibles);
  }
  
  // Evento: Submit del formulario
  const form = document.getElementById('reservaForm');
  if (form) {
    form.addEventListener('submit', procesarReserva);
  }
}

// ========================================
// GESTIÓN DEL MODAL
// ========================================

function abrirModal(barberoId, nombreBarbero) {
    barberoActual = barberoId;
    
    const modal = document.getElementById('reservaModal');
    const nombreSpan = document.getElementById('barberoNombre');
    const inputBarbero = document.getElementById('barberoSeleccionado');
    
    if (nombreSpan) nombreSpan.textContent = nombreBarbero;
    if (inputBarbero) inputBarbero.value = nombreBarbero;
    
    // Limpiar formulario
    document.getElementById('reservaForm').reset();
    document.getElementById('hora').value = '';
    
    // ✅ AUTOCOMPLETAR CREDENCIALES GUARDADAS
    const credenciales = CredencialesManager.obtener();
    if (credenciales.nombre) {
        document.getElementById('nombre').value = credenciales.nombre;
    }
    if (credenciales.email) {
        document.getElementById('email').value = credenciales.email;
    }
    
    // Mostrar notificación si hay credenciales guardadas
    if (CredencialesManager.tieneGuardadas()) {
        mostrarNotificacionCredenciales();
    }
    
    // Configurar fecha mínima
    const inputFecha = document.getElementById('fecha');
    if (inputFecha) {
        const hoy = new Date();
        hoy.setDate(hoy.getDate() + 1);
        inputFecha.min = hoy.toISOString().split('T')[0];
    }
    
    // Limpiar horas disponibles
    const contenedorHoras = document.getElementById('horasDisponibles');
    if (contenedorHoras) {
        contenedorHoras.innerHTML = '<div class="loading-horas"><p>Selecciona un servicio y una fecha para ver las horas disponibles</p></div>';
    }
    
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    }
}

function cerrarModal() {
  const modal = document.getElementById('reservaModal');
  const mensajeExito = document.getElementById('mensajeExito');
  const formulario = document.getElementById('contenedorFormulario');
  
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
      
      if (mensajeExito) mensajeExito.style.display = 'none';
      if (formulario) formulario.style.display = 'block';
      
      document.getElementById('reservaForm').reset();
      document.getElementById('hora').value = '';
    }, 300);
  }
}

// ========================================
// NOTIFICACIÓN DE CREDENCIALES GUARDADAS
// ========================================

function mostrarNotificacionCredenciales() {
    // Verificar si ya existe la notificación
    if (document.querySelector('.notificacion-credenciales')) return;
    
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-credenciales';
    notificacion.innerHTML = `
        <div class="notif-contenido">
            <i class="fas fa-check-circle"></i>
            <span>Datos autocompletados de tu última reserva</span>
            <button onclick="limpiarCredencialesGuardadas()" class="btn-limpiar-credenciales" type="button">
                <i class="fas fa-times"></i> Limpiar
            </button>
        </div>
    `;
    
    const formulario = document.getElementById('contenedorFormulario');
    if (formulario) {
        formulario.insertBefore(notificacion, formulario.firstChild);
        
        // Ocultar después de 6 segundos
        setTimeout(() => {
            notificacion.style.opacity = '0';
            setTimeout(() => notificacion.remove(), 300);
        }, 6000);
    }
}

// Función global para limpiar credenciales
function limpiarCredencialesGuardadas() {
    if (confirm('¿Deseas borrar tus datos guardados?')) {
        CredencialesManager.limpiar();
        document.getElementById('nombre').value = '';
        document.getElementById('email').value = '';
        
        const notificacion = document.querySelector('.notificacion-credenciales');
        if (notificacion) notificacion.remove();
        
        alert('✅ Datos eliminados correctamente');
    }
}

// ========================================
// CONFIGURACIÓN DE FECHA
// ========================================

function configurarFechaMinima() {
  const inputFecha = document.getElementById('fecha');
  if (!inputFecha) return;
  
  const hoy = new Date();
  hoy.setDate(hoy.getDate() + 1);
  inputFecha.min = hoy.toISOString().split('T')[0];
}

// ========================================
// CARGAR HORAS DISPONIBLES
// ========================================

async function cargarHorasDisponibles() {
  const servicio = document.getElementById('servicio').value;
  const fecha = document.getElementById('fecha').value;
  const contenedorHoras = document.getElementById('horasDisponibles');
  const inputHora = document.getElementById('hora');
  
  if (!contenedorHoras) return;
  
  if (!servicio || !fecha) {
    contenedorHoras.innerHTML = '<div class="loading-horas"><p>Selecciona un servicio y una fecha para ver las horas disponibles</p></div>';
    return;
  }
  
  contenedorHoras.innerHTML = '<div class="loading-horas"><i class="fas fa-spinner fa-spin"></i><p>Cargando horarios...</p></div>';
  inputHora.value = '';
  
  try {
    const barbero = CONFIG.barberos[barberoActual];
    const url = `${CONFIG.webAppURL}?action=obtenerHoras&barbero=${encodeURIComponent(barbero)}&fecha=${fecha}&servicio=${encodeURIComponent(servicio)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    
    const resultado = await response.json();
    
    if (!resultado || typeof resultado.exito !== 'boolean') {
      throw new Error('Respuesta inválida del servidor');
    }
    
    if (resultado.bloqueado) {
      contenedorHoras.innerHTML = `
        <div class="error-horas">
          <i class="fas fa-calendar-times"></i>
          <p>${sanitizarTexto(resultado.mensaje)}</p>
        </div>
      `;
      return;
    }
    
    if (resultado.exito && resultado.horas && resultado.horas.length > 0) {
      mostrarHorasDisponibles(resultado.horas);
    } else {
      contenedorHoras.innerHTML = `
        <div class="error-horas">
          <i class="fas fa-calendar-times"></i>
          <p>No hay horarios disponibles para esta fecha. Intenta con otro día.</p>
        </div>
      `;
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    let mensajeError = 'Error al cargar horarios. Por favor intenta nuevamente.';
    if (error.name === 'AbortError') {
      mensajeError = 'La petición tardó demasiado. Verifica tu conexión.';
    }
    
    contenedorHoras.innerHTML = `
      <div class="error-horas">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${mensajeError}</p>
        <button onclick="cargarHorasDisponibles()" class="btn-reintentar">
          <i class="fas fa-redo"></i> Reintentar
        </button>
      </div>
    `;
  }
}

function mostrarHorasDisponibles(horas) {
  const contenedorHoras = document.getElementById('horasDisponibles');
  const inputHora = document.getElementById('hora');
  
  if (!contenedorHoras) return;
  
  contenedorHoras.innerHTML = '';
  
  horas.forEach(hora => {
    const botonHora = document.createElement('button');
    botonHora.type = 'button';
    botonHora.className = 'hora-disponible';
    botonHora.textContent = hora;
    
    botonHora.addEventListener('click', () => {
      document.querySelectorAll('.hora-disponible').forEach(btn => {
        btn.classList.remove('seleccionada');
      });
      
      botonHora.classList.add('seleccionada');
      inputHora.value = hora;
    });
    
    contenedorHoras.appendChild(botonHora);
  });
}

// ========================================
// PROCESAR RESERVA
// ========================================

async function procesarReserva(e) {
  e.preventDefault();
  
  const datos = {
    nombre: sanitizarTexto(document.getElementById('nombre').value),
    email: sanitizarTexto(document.getElementById('email').value),
    servicio: document.getElementById('servicio').value,
    fecha: document.getElementById('fecha').value,
    hora: document.getElementById('hora').value,
    barbero: CONFIG.barberos[barberoActual]
  };
  
  // Validaciones
  if (!validarNombre(datos.nombre)) {
    alert('⚠️ Por favor ingresa un nombre válido (solo letras, 3-100 caracteres)');
    return;
  }
  
  if (!validarEmail(datos.email)) {
    alert('⚠️ Por favor ingresa un email válido');
    return;
  }
  
  if (!validarFecha(datos.fecha)) {
    alert('⚠️ Por favor selecciona una fecha válida');
    return;
  }
  
  if (!datos.hora) {
    alert('⚠️ Por favor selecciona un horario');
    return;
  }
  
  // Rate Limiting
  if (!RateLimiter.permitirAccion('reservar')) {
    const minutos = RateLimiter.obtenerTiempoEspera('reservar');
    alert(`⚠️ Demasiados intentos. Espera ${minutos} minutos antes de intentar nuevamente.`);
    return;
  }
  
  RateLimiter.registrarIntento('reservar');
  
  const btnSubmit = document.querySelector('.btn-confirmar');
  const textoOriginal = btnSubmit.innerHTML;
  
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESANDO...';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    const response = await fetch(CONFIG.webAppURL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      },
      body: JSON.stringify(datos)
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    
    const resultado = await response.json();
    
    if (!resultado || typeof resultado.exito !== 'boolean') {
      throw new Error('Respuesta inválida del servidor');
    }
    
    if (resultado.exito) {
      // ✅ GUARDAR CREDENCIALES PARA PRÓXIMA VEZ
      CredencialesManager.guardar(datos.nombre, datos.email);
      
      mostrarMensajeExito();
    } else {
      const mensajeSeguro = sanitizarTexto(resultado.mensaje || 'No se pudo completar la reserva');
      alert('❌ ' + mensajeSeguro);
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    let mensajeError = 'Error al procesar la reserva. Por favor intenta nuevamente.';
    if (error.name === 'AbortError') {
      mensajeError = 'La petición tardó demasiado. Por favor intenta nuevamente.';
    }
    
    alert('❌ ' + mensajeError);
    
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = textoOriginal;
  }
}

function mostrarMensajeExito() {
  const formulario = document.getElementById('contenedorFormulario');
  const mensajeExito = document.getElementById('mensajeExito');
  
  if (formulario) formulario.style.display = 'none';
  if (mensajeExito) {
    mensajeExito.style.display = 'block';
  }
}

// ========================================
// PROTECCIÓN DE SEGURIDAD
// ========================================

if (window.location.hostname !== 'localhost') {
  document.addEventListener('contextmenu', e => e.preventDefault());
}

console.log('%c🔒 Sistema Seguro v2.0', 'color: #4CAF50; font-weight: bold;');