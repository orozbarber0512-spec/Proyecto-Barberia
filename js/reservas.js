// ========================================
// OROZ BARBER - SISTEMA DE RESERVAS v2.1
// CORREGIDO: Ahora oculta el contenedor completo del formulario
// ========================================

const CONFIG = {
  webAppURL: 'https://script.google.com/macros/s/AKfycbwVVAXJd3WfTAKVmrOJM9Y21AYnzXSxJJPPtvOfidhYuuQzezS5rrlhepTFKLinuMJA/exec',
  
  barberos: {
    barbero1: 'Felipe Orozco',
    barbero2: 'Tomas Orozco',
    barbero3: 'Sergio Jiménez'
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
  console.log('%c💈 Sistema de Reservas - Oroz Barber v2.1', 'font-size: 16px; color: #DAA520; font-weight: bold;');
  
  // Inicializar referencias del DOM
  modal = document.getElementById('reservaModal');
  form = document.getElementById('reservaForm');
  mensajeExito = document.getElementById('mensajeExito');
  contenedorFormulario = document.getElementById('contenedorFormulario');
  
  // Verificar que los elementos existen
  console.log('🔍 Verificando elementos del DOM:');
  console.log('Modal:', modal ? '✅' : '❌');
  console.log('Formulario:', form ? '✅' : '❌');
  console.log('Mensaje de éxito:', mensajeExito ? '✅' : '❌');
  console.log('Contenedor formulario:', contenedorFormulario ? '✅' : '❌');
  
  if (!modal || !form || !mensajeExito || !contenedorFormulario) {
    console.error('❌ ERROR: Faltan elementos del DOM. Revisa el HTML.');
    return;
  }
  
  // Configurar fecha mínima
  configurarFecha();
  
  // Configurar eventos de barberos
  configurarBarberos();
  
  // Configurar modal
  configurarModal();
  
  // Configurar formulario
  configurarFormulario();
  
  console.log('✅ Sistema inicializado correctamente');
});

// ========================================
// CONFIGURAR FECHA MÍNIMA
// ========================================
function configurarFecha() {
  const inputFecha = document.getElementById('fecha');
  const hoy = new Date().toISOString().split('T')[0];
  inputFecha.setAttribute('min', hoy);
  
   // Abrir calendario al hacer click en cualquier parte =====
  inputFecha.addEventListener('click', function() {
    if (this.showPicker) {
      this.showPicker();
    }
  });
  
  // Desactivar domingos
  
  inputFecha.addEventListener('input', (e) => {
    const fecha = new Date(e.target.value + 'T00:00:00');
    if (fecha.getDay() === 0) {
      alert('Lo sentimos, no trabajamos los domingos. Por favor selecciona otro día.');
      e.target.value = '';
    } else {
      fechaActual = e.target.value;
      console.log('📅 Fecha seleccionada:', fechaActual);
      cargarHorasDisponibles();
    }
  });
  
  // Actualizar horas cuando cambia el servicio
  const selectServicio = document.getElementById('servicio');
  selectServicio.addEventListener('change', (e) => {
    servicioActual = e.target.value;
    console.log('✂️ Servicio seleccionado:', servicioActual);
    cargarHorasDisponibles();
  });
}

// ========================================
// CONFIGURAR BARBEROS
// ========================================
function configurarBarberos() {
  document.querySelectorAll('.barbero-card').forEach(card => {
    card.addEventListener('click', () => {
      barberoActual = card.getAttribute('data-barbero');
      console.log('👤 Barbero seleccionado:', CONFIG.barberos[barberoActual]);
      abrirModal(barberoActual);
    });
  });
}

// ========================================
// CONFIGURAR MODAL
// ========================================
function configurarModal() {
  // Cerrar al hacer click en X
  const btnCerrar = document.querySelector('.modal-close');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', cerrarModal);
  }
   
  // Cerrar con tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      cerrarModal();
    }
  });
}

// ========================================
// ABRIR MODAL
// ========================================
function abrirModal(barbero) {
  console.log('🔓 Abriendo modal para:', CONFIG.barberos[barbero]);
  
  const nombreBarbero = CONFIG.barberos[barbero];
  document.getElementById('barberoNombre').textContent = nombreBarbero;
  document.getElementById('barberoSeleccionado').value = nombreBarbero;
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  // Mostrar formulario y ocultar mensaje
  contenedorFormulario.style.display = 'block';
  mensajeExito.style.display = 'none';
  
  // Resetear formulario
  form.reset();
  
  // Resetear variables
  servicioActual = '';
  fechaActual = '';
  
  // Resetear horas disponibles
  mostrarMensajeHoras('Selecciona un servicio y una fecha para ver las horas disponibles');
  
  console.log('✅ Modal abierto correctamente');
}

// ========================================
// CERRAR MODAL
// ========================================
function cerrarModal() {
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  contenedorFormulario.style.display = 'block';
  mensajeExito.style.display = 'none';
  
  form.reset();
  
}

// Cerrar al hacer click en X
document.querySelector('.modal-close').addEventListener('click', cerrarModal);

// Cerrar al hacer click fuera del modal
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    cerrarModal();
  }
});

// Cerrar con tecla ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.style.display === 'block') {
    cerrarModal();
  }
});

// ========================================
// CARGAR HORAS DISPONIBLES
// ========================================
async function cargarHorasDisponibles() {
  if (!servicioActual || !fechaActual || !barberoActual) {
    console.log('⏸️ Esperando servicio, fecha y barbero...');
    return;
  }
  
  console.log('⏰ Cargando horas disponibles...');
  console.log('  Barbero:', CONFIG.barberos[barberoActual]);
  console.log('  Servicio:', servicioActual);
  console.log('  Fecha:', fechaActual);
  
  mostrarCargando();
  
  try {
    const url = `${CONFIG.webAppURL}?action=obtenerHoras&barbero=${encodeURIComponent(CONFIG.barberos[barberoActual])}&fecha=${fechaActual}&servicio=${encodeURIComponent(servicioActual)}`;
    
    const response = await fetch(url);
    const resultado = await response.json();
    
    console.log('📥 Respuesta de horas:', resultado);
    
    if (resultado.exito && resultado.horas.length > 0) {
      console.log(`✅ ${resultado.horas.length} horas disponibles encontradas`);
      mostrarHoras(resultado.horas);
    } else {
      console.log('⚠️ No hay horas disponibles');
      mostrarMensajeHoras('❌ No hay horarios disponibles para esta fecha y servicio');
    }
    
  } catch (error) {
    console.error('❌ Error al cargar horas:', error);
    mostrarMensajeHoras('⚠️ Error al cargar horarios. Por favor intenta nuevamente.');
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
  contenedorHoras.innerHTML = `
    <div class="loading-horas">
      <p>${mensaje}</p>
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
    btn.textContent = hora;
    btn.onclick = () => seleccionarHora(hora, btn);
    grid.appendChild(btn);
  });
  
  contenedorHoras.appendChild(grid);
}

function seleccionarHora(hora, btn) {
  // Remover selección anterior
  document.querySelectorAll('.hora-btn').forEach(b => b.classList.remove('selected'));
  
  // Marcar como seleccionado
  btn.classList.add('selected');
  
  // Guardar hora seleccionada (Guardará "02:00 PM")
  document.getElementById('hora').value = hora;
  
  console.log('🕐 Hora seleccionada:', hora);
}

// ========================================
// CONFIGURAR FORMULARIO
// ========================================
function configurarFormulario() {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('📝 Formulario enviado');
    
    await enviarReserva();
  });
}

// ========================================
// ENVIAR RESERVA
// ========================================
async function enviarReserva() {
  const datos = {
    barbero: document.getElementById('barberoSeleccionado').value,
    nombre: document.getElementById('nombre').value,
    email: document.getElementById('email').value,
    fecha: document.getElementById('fecha').value,
    hora: document.getElementById('hora').value,
    servicio: document.getElementById('servicio').value,
  };
  
  if (!datos.nombre || !datos.email || !datos.fecha || !datos.hora || !datos.servicio) {
    alert('Por favor completa todos los campos obligatorios (*)');
    return;
  }
  
  const btnConfirmar = document.querySelector('.btn-confirmar');
  const textoOriginal = btnConfirmar.innerHTML;
  btnConfirmar.disabled = true;
  btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  
  try {
    const response = await fetch(CONFIG.webAppURL, {
      redirect: 'follow',
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(datos)
    });

    // LEER LA RESPUESTA UNA SOLA VEZ
    const textoRespuesta = await response.text();
    let resultado;

    try {
      resultado = JSON.parse(textoRespuesta);
    } catch (e) {
      // Si no es JSON pero el status es 200, usualmente es éxito en Google Apps Script
      if (response.ok) {
        mostrarExito();
        return;
      }
      throw new Error("Respuesta del servidor no válida");
    }
    
    if (resultado.exito) {
      mostrarExito();
    } else {
      alert('❌ ' + (resultado.mensaje || 'Error al agendar'));
      btnConfirmar.disabled = false;
      btnConfirmar.innerHTML = textoOriginal;
    }
    
  } catch (error) {
    // Si llegamos aquí y el error es el de 'style', es que mostrarExito() 
    // todavía tiene alguna referencia a un ID nulo.
    console.error('Detalle del error:', error);
    
    // Si la cita igual se agendó (porque response.ok fue true), no mostramos el alert de error
    if (!error.message.includes('reading \'style\'')) {
      alert('⚠️ Error de conexión. Intenta nuevamente.');
    }
    
    btnConfirmar.disabled = false;
    btnConfirmar.innerHTML = textoOriginal;
  }
}

// ========================================
// MOSTRAR MENSAJE DE ÉXITO
// ========================================
function mostrarExito() {
  console.log('🎉 Mostrando mensaje de éxito...');
  
  // Verificar que los elementos existen
  if (!contenedorFormulario || !mensajeExito) {
    console.error('❌ ERROR: Elementos no encontrados');
    console.log('contenedorFormulario:', contenedorFormulario);
    console.log('mensajeExito:', mensajeExito);
    return;
  }
  
  console.log('  Estado actual:');
  console.log('    contenedorFormulario.display:', window.getComputedStyle(contenedorFormulario).display);
  console.log('    mensajeExito.display:', window.getComputedStyle(mensajeExito).display);
  
  // OCULTAR TODO EL CONTENEDOR DEL FORMULARIO (incluye header)
  contenedorFormulario.style.display = 'none';
  console.log('  ✓ Contenedor del formulario ocultado');
  
  // Forzar reflow del navegador
  void mensajeExito.offsetHeight;
  

  // MOSTRAR MENSAJE DE ÉXITO
  mensajeExito.style.display = 'block';
  console.log('  ✓ Mensaje de éxito mostrado');
  
  // Verificar cambios
  console.log('  Nuevo estado:');
  console.log('    contenedorFormulario.display:', window.getComputedStyle(contenedorFormulario).display);
  console.log('    mensajeExito.display:', window.getComputedStyle(mensajeExito).display);
  
  //Asegurar que el modal siga visible
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';

  // Scroll al inicio del modal
  const modalContent = document.querySelector('.modal-content');
  if (modalContent) {
    modalContent.scrollTop = 0;
    console.log('  ✓ Scroll al inicio del modal');
  }
  
  console.log('✅ Mensaje de éxito mostrado correctamente');
  
  // Restaurar botón después de 3 segundos
  setTimeout(() => {
    const btnConfirmar = document.querySelector('.btn-confirmar');
    if (btnConfirmar) {
      btnConfirmar.disabled = false;
      btnConfirmar.innerHTML = '<i class="fas fa-check"></i> Confirmar Reserva';
    }
  }, 3000);
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

// ========================================
// EXPONER FUNCIONES PARA DEBUGGING
// ========================================
window.debugReservas = {
  mostrarExito,
  abrirModal,
  cerrarModal,
  cargarHorasDisponibles,
  CONFIG
};

console.log('%c✅ Sistema cargado. Usa window.debugReservas para debugging', 'color: #4CAF50; font-weight: bold;');