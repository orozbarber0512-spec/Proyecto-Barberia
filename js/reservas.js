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
// ⚡ SISTEMA DE CACHÉ (OPTIMIZACIÓN)
// ========================================

const CacheManager = {
  cache: {},
  TIEMPO_VIDA: 300000, // 5 minutos
  
  generarClave(barbero, fecha, servicio) {
    return `${barbero}_${fecha}_${servicio}`;
  },
  
  obtener(barbero, fecha, servicio) {
    const clave = this.generarClave(barbero, fecha, servicio);
    const item = this.cache[clave];
    
    if (!item) return null;
    
    const ahora = Date.now();
    if (ahora - item.timestamp > this.TIEMPO_VIDA) {
      delete this.cache[clave];
      return null;
    }
    
    return item.datos;
  },
  
  guardar(barbero, fecha, servicio, datos) {
    const clave = this.generarClave(barbero, fecha, servicio);
    this.cache[clave] = {
      datos: datos,
      timestamp: Date.now()
    };
  },
  
  limpiar() {
    this.cache = {};
  }
};

// ========================================
// SISTEMA DE RECORDAR CREDENCIALES
// ========================================

const CredencialesManager = {
    guardar(nombre, email) {
        try {
            localStorage.setItem('oroz_nombre', nombre);
            localStorage.setItem('oroz_email', email);
            localStorage.setItem('oroz_guardado_fecha', new Date().toISOString());
        } catch (e) {
            console.error('Error guardando credenciales:', e);
        }
    },
    
    obtener() {
        try {
            return {
                nombre: localStorage.getItem('oroz_nombre') || '',
                email: localStorage.getItem('oroz_email') || ''
            };
        } catch (e) {
            return { nombre: '', email: '' };
        }
    },
    
    limpiar() {
        try {
            localStorage.removeItem('oroz_nombre');
            localStorage.removeItem('oroz_email');
            localStorage.removeItem('oroz_guardado_fecha');
        } catch (e) {}
    },
    
    tieneGuardadas() {
        return !!localStorage.getItem('oroz_nombre');
    }
};

// ========================================
// UTILIDADES DE SEGURIDAD
// ========================================

function sanitizarTexto(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto.trim().replace(/[<>\"']/g, '').substring(0, 200);
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
    if (!this.intentos[accion]) this.intentos[accion] = [];
    this.intentos[accion] = this.intentos[accion].filter(t => ahora - t < CONFIG.timeoutIntentos);
    this.intentos[accion].push(ahora);
  },
  permitirAccion(accion) {
    if (!this.intentos[accion]) return true;
    return this.intentos[accion].length < CONFIG.maxIntentos;
  },
  obtenerTiempoEspera(accion) {
    if (!this.intentos[accion] || this.intentos[accion].length === 0) return 0;
    const primerIntento = this.intentos[accion][0];
    const tiempoRestante = CONFIG.timeoutIntentos - (Date.now() - primerIntento);
    return Math.max(0, Math.ceil(tiempoRestante / 1000 / 60));
  }
};

// ========================================
// VARIABLES GLOBALES
// ========================================

let barberoActual = null;

// ⚡ OPTIMIZACIÓN: Debouncing para evitar múltiples llamadas
let timeoutCarga = null;

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const esProduccion = window.location.hostname !== 'localhost';
  if (!esProduccion) {
    console.log('%c⚡ Sistema Optimizado v3.0', 'color: #4CAF50; font-weight: bold;');
  }
  configurarEventos();
  configurarFechaMinima();
});

function configurarEventos() {
  document.querySelectorAll('.barbero-card').forEach(card => {
    card.addEventListener('click', () => {
      const barberoId = card.dataset.barbero;
      const nombreBarbero = CONFIG.barberos[barberoId];
      if (nombreBarbero) abrirModal(barberoId, nombreBarbero);
    });
    
    card.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') card.click();
    });
  });
  
  const btnCerrar = document.querySelector('.modal-close');
  if (btnCerrar) btnCerrar.addEventListener('click', cerrarModal);
  
  const modal = document.getElementById('reservaModal');
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModal(); });
  
  const selectServicio = document.getElementById('servicio');
  const inputFecha = document.getElementById('fecha');
  
  if (selectServicio && inputFecha) {
    // ⚡ OPTIMIZACIÓN: Debouncing
    selectServicio.addEventListener('change', () => {
      clearTimeout(timeoutCarga);
      timeoutCarga = setTimeout(cargarHorasDisponibles, 300);
    });
    inputFecha.addEventListener('change', () => {
      clearTimeout(timeoutCarga);
      timeoutCarga = setTimeout(cargarHorasDisponibles, 300);
    });
  }
  
  const form = document.getElementById('reservaForm');
  if (form) form.addEventListener('submit', procesarReserva);
}

function abrirModal(barberoId, nombreBarbero) {
    barberoActual = barberoId;
    
    const modal = document.getElementById('reservaModal');
    const nombreSpan = document.getElementById('barberoNombre');
    const inputBarbero = document.getElementById('barberoSeleccionado');
    
    if (nombreSpan) nombreSpan.textContent = nombreBarbero;
    if (inputBarbero) inputBarbero.value = nombreBarbero;
    
    document.getElementById('reservaForm').reset();
    document.getElementById('hora').value = '';
    
    // Autocompletar credenciales
    const credenciales = CredencialesManager.obtener();
    if (credenciales.nombre) document.getElementById('nombre').value = credenciales.nombre;
    if (credenciales.email) document.getElementById('email').value = credenciales.email;
    
    if (CredencialesManager.tieneGuardadas()) mostrarNotificacionCredenciales();
    
    const inputFecha = document.getElementById('fecha');
    if (inputFecha) {
        const hoy = new Date();
        hoy.setDate(hoy.getDate() + 1);
        inputFecha.min = hoy.toISOString().split('T')[0];
    }
    
    const contenedorHoras = document.getElementById('horasDisponibles');
    if (contenedorHoras) {
        contenedorHoras.innerHTML = '<div class="loading-horas"><p>Selecciona un servicio y una fecha</p></div>';
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

function mostrarNotificacionCredenciales() {
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
        setTimeout(() => {
            notificacion.style.opacity = '0';
            setTimeout(() => notificacion.remove(), 300);
        }, 6000);
    }
}

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

function configurarFechaMinima() {
  const inputFecha = document.getElementById('fecha');
  if (!inputFecha) return;
  const hoy = new Date();
  hoy.setDate(hoy.getDate() + 1);
  inputFecha.min = hoy.toISOString().split('T')[0];
}

// ========================================
// ⚡ CARGAR HORAS OPTIMIZADO CON CACHÉ
// ========================================

async function cargarHorasDisponibles() {
  const servicio = document.getElementById('servicio').value;
  const fecha = document.getElementById('fecha').value;
  const contenedorHoras = document.getElementById('horasDisponibles');
  const inputHora = document.getElementById('hora');
  
  if (!contenedorHoras) return;
  
  if (!servicio || !fecha) {
    contenedorHoras.innerHTML = '<div class="loading-horas"><p>Selecciona un servicio y una fecha</p></div>';
    return;
  }
  
  const barbero = CONFIG.barberos[barberoActual];
  
  // ⚡ OPTIMIZACIÓN: Verificar caché primero
  const horasCacheadas = CacheManager.obtener(barbero, fecha, servicio);
  if (horasCacheadas) {
    console.log('⚡ Usando horas desde caché');
    mostrarHorasDisponibles(horasCacheadas);
    return;
  }
  
  // ⚡ OPTIMIZACIÓN: Loading optimista
  contenedorHoras.innerHTML = '<div class="loading-horas"><i class="fas fa-spinner fa-spin"></i><p>Cargando...</p></div>';
  inputHora.value = '';
  
  try {
    const url = `${CONFIG.webAppURL}?action=obtenerHoras&barbero=${encodeURIComponent(barbero)}&fecha=${fecha}&servicio=${encodeURIComponent(servicio)}`;
    
    // ⚡ OPTIMIZACIÓN: Timeout reducido
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seg en vez de 15
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    
    const resultado = await response.json();
    
    if (!resultado || typeof resultado.exito !== 'boolean') {
      throw new Error('Respuesta inválida');
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
      // ⚡ GUARDAR EN CACHÉ
      CacheManager.guardar(barbero, fecha, servicio, resultado.horas);
      mostrarHorasDisponibles(resultado.horas);
    } else {
      contenedorHoras.innerHTML = `
        <div class="error-horas">
          <i class="fas fa-calendar-times"></i>
          <p>No hay horarios disponibles. Intenta otro día.</p>
        </div>
      `;
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    let mensajeError = 'Error al cargar horarios.';
    if (error.name === 'AbortError') {
      mensajeError = 'La petición tardó demasiado.';
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
      document.querySelectorAll('.hora-disponible').forEach(btn => btn.classList.remove('seleccionada'));
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
  
  if (!validarNombre(datos.nombre)) {
    alert('⚠️ Nombre inválido (3-100 caracteres, solo letras)');
    return;
  }
  
  if (!validarEmail(datos.email)) {
    alert('⚠️ Email inválido');
    return;
  }
  
  if (!validarFecha(datos.fecha)) {
    alert('⚠️ Fecha inválida');
    return;
  }
  
  if (!datos.hora) {
    alert('⚠️ Selecciona un horario');
    return;
  }
  
  if (!RateLimiter.permitirAccion('reservar')) {
    const minutos = RateLimiter.obtenerTiempoEspera('reservar');
    alert(`⚠️ Demasiados intentos. Espera ${minutos} minutos.`);
    return;
  }
  
  RateLimiter.registrarIntento('reservar');
  
  const btnSubmit = document.querySelector('.btn-confirmar');
  const textoOriginal = btnSubmit.innerHTML;
  
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESANDO...';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seg en vez de 20
    
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
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    
    const resultado = await response.json();
    
    if (!resultado || typeof resultado.exito !== 'boolean') {
      throw new Error('Respuesta inválida');
    }
    
    if (resultado.exito) {
      // ⚡ Guardar credenciales y limpiar caché
      CredencialesManager.guardar(datos.nombre, datos.email);
      CacheManager.limpiar(); // Limpiar caché después de reservar
      
      mostrarMensajeExito();
    } else {
      const mensajeSeguro = sanitizarTexto(resultado.mensaje || 'No se pudo completar la reserva');
      alert('❌ ' + mensajeSeguro);
    }
    
  } catch (error) {
    console.error('Error:', error);
    let mensajeError = 'Error al procesar la reserva.';
    if (error.name === 'AbortError') mensajeError = 'La petición tardó demasiado.';
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
  if (mensajeExito) mensajeExito.style.display = 'block';
}

// ========================================
// PROTECCIÓN
// ========================================

if (window.location.hostname !== 'localhost') {
  document.addEventListener('contextmenu', e => e.preventDefault());
}

console.log('%c⚡ Sistema Optimizado Cargado', 'color: #4CAF50; font-weight: bold;');