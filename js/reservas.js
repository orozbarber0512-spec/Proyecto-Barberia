const CONFIG = {
  // ✅ MEJORA: URL ofuscada (más difícil de extraer con bots)
  webAppURL: atob('aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3VlZBWEpkM1dmVEFLVm1yT0pNOVkyMUFZbnpYU3hKSlBQdHZPZmlkaFl1dVF6ZXpTNXJybGhlcFRGS0xpbnVNSkEvZXhlYw=='),
  
  barberos: {
    barbero1: 'Felipe Orozco',
    barbero2: 'Tomas Orozco',
    barbero3: 'Sergio Jiménez'
  },
  
  // ✅ NUEVO: Límites de seguridad
  maxIntentos: 5,
  timeoutIntentos: 300000, // 5 minutos
  maxLongitudNombre: 100,
  maxLongitudEmail: 254
};

// ========================================
// UTILIDADES DE SEGURIDAD
// ========================================

// ✅ Sanitizar entrada de texto (prevenir XSS)
function sanitizarTexto(texto) {
  if (!texto || typeof texto !== 'string') return '';
  
  return texto
    .trim()
    .replace(/[<>\"']/g, '') // Eliminar caracteres peligrosos
    .substring(0, 200); // Limitar longitud
}

// ✅ Validar formato de email
function validarEmail(email) {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email) && email.length <= CONFIG.maxLongitudEmail;
}

// ✅ Validar nombre (solo letras, espacios y acentos)
function validarNombre(nombre) {
  if (!nombre || nombre.length < 3 || nombre.length > CONFIG.maxLongitudNombre) {
    return false;
  }
  
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return regex.test(nombre);
}

// ✅ Validar fecha (formato YYYY-MM-DD y fecha futura)
function validarFecha(fechaStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(fechaStr)) return false;
  
  const fecha = new Date(fechaStr + 'T00:00:00');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  // No debe ser domingo (día 0)
  if (fecha.getDay() === 0) return false;
  
  // Debe ser fecha futura
  return fecha >= hoy;
}

// ✅ Validar hora (formato HH:MM AM/PM)
function validarHora(horaStr) {
  const regex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$/;
  return regex.test(horaStr);
}

// ✅ Rate Limiting (prevenir spam)
const RateLimiter = {
  intentos: {},
  
  registrarIntento(accion) {
    const ahora = Date.now();
    
    if (!this.intentos[accion]) {
      this.intentos[accion] = [];
    }
    
    // Limpiar intentos antiguos (más de 5 minutos)
    this.intentos[accion] = this.intentos[accion].filter(
      tiempo => ahora - tiempo < CONFIG.timeoutIntentos
    );
    
    // Registrar nuevo intento
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
    
    return Math.max(0, Math.ceil(tiempoRestante / 1000 / 60)); // minutos
  }
};

// ========================================
// VARIABLES GLOBALES
// ========================================
let modal, form, mensajeExito, contenedorFormulario;
let barberoActual = '';
let servicioActual = '';
let fechaActual = '';

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  // ✅ MEJORA: Ocultar logs en producción
  const esProduccion = window.location.hostname !== 'localhost' && 
                       !window.location.hostname.includes('127.0.0.1');
  
  if (!esProduccion) {
    console.log('%c💈 Sistema de Reservas - Oroz Barber v3.0 SEGURO', 'font-size: 16px; color: #DAA520; font-weight: bold;');
  }
  
  // Inicializar referencias del DOM
  modal = document.getElementById('reservaModal');
  form = document.getElementById('reservaForm');
  mensajeExito = document.getElementById('mensajeExito');
  contenedorFormulario = document.getElementById('contenedorFormulario');
  
  const emailGuardado = localStorage.getItem('oroz_barber_email');
  const nombreGuardado = localStorage.getItem('oroz_barber_nombre');

  if (emailGuardado) {
    document.getElementById('email').value = emailGuardado;
  }
  if (nombreGuardado) {
    document.getElementById('nombre').value = nombreGuardado;
  }

  if (!modal || !form || !mensajeExito || !contenedorFormulario) {
    mostrarError('Error del sistema. Por favor recarga la página.');
    return;
  }
  
  configurarFecha();
  configurarBarberos();
  configurarModal();
  configurarFormulario();
});

// ========================================
// CONFIGURAR FECHA
// ========================================
function configurarFecha() {
  const inputFecha = document.getElementById('fecha');
  const hoy = new Date().toISOString().split('T')[0];
  inputFecha.setAttribute('min', hoy);
  
  // ✅ Límite máximo: 3 meses en el futuro
  const maxFecha = new Date();
  maxFecha.setMonth(maxFecha.getMonth() + 3);
  inputFecha.setAttribute('max', maxFecha.toISOString().split('T')[0]);
  
  inputFecha.addEventListener('click', function() {
    if (this.showPicker) this.showPicker();
  });
  
  inputFecha.addEventListener('input', (e) => {
    const fechaValor = e.target.value;
    
    // ✅ Validación de seguridad
    if (!validarFecha(fechaValor)) {
      mostrarError('Fecha no válida. Por favor selecciona otra fecha.');
      e.target.value = '';
      return;
    }
    
    const fecha = new Date(fechaValor + 'T00:00:00');
    if (fecha.getDay() === 0) {
      mostrarError('Lo sentimos, no trabajamos los domingos.');
      e.target.value = '';
      return;
    }
    
    fechaActual = fechaValor;
    cargarHorasDisponibles();
  });
  
  const selectServicio = document.getElementById('servicio');
  selectServicio.addEventListener('change', (e) => {
    servicioActual = sanitizarTexto(e.target.value);
    cargarHorasDisponibles();
  });
}

// ========================================
// CONFIGURAR BARBEROS
// ========================================
function configurarBarberos() {
  document.querySelectorAll('.barbero-card').forEach(card => {
    card.addEventListener('click', () => {
      const barberoId = card.getAttribute('data-barbero');
      
      // ✅ Validación: verificar que el barbero existe
      if (!CONFIG.barberos[barberoId]) {
        mostrarError('Barbero no válido.');
        return;
      }
      
      barberoActual = barberoId;
      abrirModal(barberoId);
    });
  });
}

// ========================================
// CONFIGURAR MODAL
// ========================================
function configurarModal() {
  const btnCerrar = document.querySelector('.modal-close');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', cerrarModal);
  }
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      cerrarModal();
    }
  });
}

// ========================================
// ABRIR/CERRAR MODAL
// ========================================
function abrirModal(barbero) {
  const nombreBarbero = CONFIG.barberos[barbero];
  document.getElementById('barberoNombre').textContent = nombreBarbero;
  document.getElementById('barberoSeleccionado').value = nombreBarbero;
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  contenedorFormulario.style.display = 'block';
  mensajeExito.style.display = 'none';
  
  form.reset();
  servicioActual = '';
  fechaActual = '';
  
  mostrarMensajeHoras('Selecciona un servicio y una fecha para ver las horas disponibles');
}

function cerrarModal() {
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  contenedorFormulario.style.display = 'block';
  mensajeExito.style.display = 'none';
  form.reset();
}

// ========================================
// CARGAR HORAS DISPONIBLES 
// ========================================
async function cargarHorasDisponibles() {
  if (!servicioActual || !fechaActual || !barberoActual) return;
  
  if (!RateLimiter.permitirAccion('cargarHoras')) {
    const minutos = RateLimiter.obtenerTiempoEspera('cargarHoras');
    mostrarError(`Demasiados intentos. Espera ${minutos} minutos.`);
    return;
  }
  
  RateLimiter.registrarIntento('cargarHoras');
  mostrarCargando();
  
  try {
    const barberoNombre = CONFIG.barberos[barberoActual];
    
    const params = new URLSearchParams({
      action: 'obtenerHoras',
      barbero: barberoNombre,
      fecha: fechaActual,
      servicio: servicioActual
    });
    
    const url = `${CONFIG.webAppURL}?${params.toString()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    const resultado = await response.json();
    
    // --- NUEVA LÓGICA DE BLOQUEO ---
    if (resultado.exito === false && resultado.bloqueado === true) {
      // Muestra el mensaje personalizado que viene del Google Script
      mostrarMensajeHoras(resultado.mensaje);
      return; 
    }
    // -------------------------------

    if (resultado.exito && Array.isArray(resultado.horas) && resultado.horas.length > 0) {
      const horasValidas = resultado.horas.filter(hora => validarHora(hora));
      
      if (horasValidas.length > 0) {
        mostrarHoras(horasValidas);
      } else {
        mostrarMensajeHoras('❌ No hay horarios disponibles para este servicio');
      }
    } else {
      mostrarMensajeHoras('❌ No hay horarios disponibles para esta fecha');
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      mostrarError('La petición tardó demasiado. Intenta nuevamente.');
    } else {
      mostrarError('Error al cargar horarios. Por favor intenta nuevamente.');
    }
  }
}

function mostrarCargando() {
  const contenedorHoras = document.getElementById('horasDisponibles');
  contenedorHoras.innerHTML = `
    <div class="loading-horas">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando horarios disponibles...</p>
    </div>
  `;
}

function mostrarMensajeHoras(mensaje) {
  const contenedorHoras = document.getElementById('horasDisponibles');
  // ✅ Sanitizar mensaje antes de mostrar
  const mensajeSanitizado = sanitizarTexto(mensaje);
  contenedorHoras.innerHTML = `
    <div class="loading-horas">
      <p>${mensajeSanitizado}</p>
    </div>
  `;
}

function mostrarHoras(horas) {
  const contenedorHoras = document.getElementById('horasDisponibles');
  contenedorHoras.innerHTML = '';
  
  const grid = document.createElement('div');
  grid.className = 'horas-grid';
  
  horas.forEach(hora => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hora-btn';
    // ✅ Usar textContent en lugar de innerHTML (previene XSS)
    btn.textContent = hora;
    btn.onclick = () => seleccionarHora(hora, btn);
    grid.appendChild(btn);
  });
  
  contenedorHoras.appendChild(grid);
}

function seleccionarHora(hora, btn) {
  // ✅ Validar hora antes de guardar
  if (!validarHora(hora)) {
    mostrarError('Hora no válida.');
    return;
  }
  
  document.querySelectorAll('.hora-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('hora').value = hora;
}

// ========================================
// CONFIGURAR FORMULARIO
// ========================================
function configurarFormulario() {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await enviarReserva();
  });
}

// ========================================
// ENVIAR RESERVA
// ========================================
async function enviarReserva() {
  // ✅ Rate Limiting para envío de reservas
  if (!RateLimiter.permitirAccion('enviarReserva')) {
    const minutos = RateLimiter.obtenerTiempoEspera('enviarReserva');
    mostrarError(`Demasiados intentos. Espera ${minutos} minutos.`);
    return;
  }
  
  // ✅ Recopilar y sanitizar datos
  const nombre = sanitizarTexto(document.getElementById('nombre').value);
  const email = document.getElementById('email').value.trim().toLowerCase();
  localStorage.setItem('oroz_barber_email', email);
  const fecha = document.getElementById('fecha').value;
  const hora = document.getElementById('hora').value;
  const servicio = document.getElementById('servicio').value;
  const barbero = CONFIG.barberos[barberoActual];
  
  // ✅ VALIDACIONES EXHAUSTIVAS
  if (!validarNombre(nombre)) {
    mostrarError('Por favor ingresa un nombre válido (solo letras).');
    return;
  }
  
  if (!validarEmail(email)) {
    mostrarError('Por favor ingresa un email válido.');
    return;
  }
  
  if (!validarFecha(fecha)) {
    mostrarError('Por favor selecciona una fecha válida.');
    return;
  }
  
  if (!validarHora(hora)) {
    mostrarError('Por favor selecciona una hora válida.');
    return;
  }
  
  if (!servicio || servicio === '') {
    mostrarError('Por favor selecciona un servicio.');
    return;
  }
  
  if (!barbero) {
    mostrarError('Por favor selecciona un barbero.');
    return;
  }
  
  const datos = { barbero, nombre, email, fecha, hora, servicio };
  
  const btnConfirmar = document.querySelector('.btn-confirmar');
  const textoOriginal = btnConfirmar.innerHTML;
  btnConfirmar.disabled = true;
  btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  
  try {
    RateLimiter.registrarIntento('enviarReserva');
    
    // ✅ Timeout de 15 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(CONFIG.webAppURL, {
      redirect: 'follow',
      method: 'POST',
      signal: controller.signal,
      headers: { 
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      },
      body: JSON.stringify(datos)
    });
    
    clearTimeout(timeoutId);
    
    const textoRespuesta = await response.text();
    let resultado;

    try {
      resultado = JSON.parse(textoRespuesta);
    } catch (e) {
      if (response.ok) {
        mostrarExito();
        return;
      }
      throw new Error("Respuesta del servidor no válida");
    }
    
    // ✅ Validar respuesta
    if (resultado && resultado.exito === true) {
      mostrarExito();
    } else {
      mostrarError(resultado.mensaje || 'Error al agendar la cita.');
      btnConfirmar.disabled = false;
      btnConfirmar.innerHTML = textoOriginal;
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      mostrarError('La petición tardó demasiado. Por favor intenta nuevamente.');
    } else {
      mostrarError('Error de conexión. Por favor intenta nuevamente.');
    }
    
    btnConfirmar.disabled = false;
    btnConfirmar.innerHTML = textoOriginal;
  }
}

// ========================================
// MOSTRAR MENSAJE DE ÉXITO
// ========================================
function mostrarExito() {
  if (!contenedorFormulario || !mensajeExito) return;
  
  contenedorFormulario.style.display = 'none';
  void mensajeExito.offsetHeight;
  mensajeExito.style.display = 'block';
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';

  const modalContent = document.querySelector('.modal-content');
  if (modalContent) {
    modalContent.scrollTop = 0;
  }
  
  setTimeout(() => {
    const btnConfirmar = document.querySelector('.btn-confirmar');
    if (btnConfirmar) {
      btnConfirmar.disabled = false;
      btnConfirmar.innerHTML = '<i class="fas fa-check"></i> Confirmar Reserva';
    }
  }, 3000);
}

// ========================================
// MOSTRAR ERROR
// ========================================
function mostrarError(mensaje) {
  // ✅ Sanitizar mensaje de error
  const mensajeSanitizado = sanitizarTexto(mensaje);
  alert('⚠️ ' + mensajeSanitizado);
}

// ========================================
// BOTÓN VOLVER
// ========================================
const btnVolver = document.querySelector('.btn-volver');
if (btnVolver) {
  btnVolver.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'index.html';
  });
}

// ✅ PROTECCIÓN: Deshabilitar inspección excesiva en producción
if (window.location.hostname !== 'localhost') {
  // Deshabilitar click derecho
  document.addEventListener('contextmenu', e => e.preventDefault());
  
  // Detectar DevTools abierto (dificulta robo de API)
  setInterval(() => {
    const threshold = 160;
    if (window.outerWidth - window.innerWidth > threshold || 
        window.outerHeight - window.innerHeight > threshold) {
      // DevTools abierto - puedes tomar acciones aquí
    }
  }, 1000);
}