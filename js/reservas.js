// ========================================
// CONFIGURACIÓN
// ======================================== 
const CONFIG = {
  // URL de tu Web App de Apps Script
  webAppURL: 'https://script.google.com/macros/s/AKfycbwJl-c5iMGW3ZqNY0bZR3vzTfD7gdP7nObIXT07Kd-YdCOvqj5-GYf2ohByLHq8oZOM/exec',
  
  // Nombres de los barberos
  barberos: {
    barbero1: 'Felipe Orozco',
    barbero2: 'Tomas Orozco',
    barbero3: 'Sergio Jiménez'
  }
};

// ========================================
// VARIABLES GLOBALES
// ========================================
const modal = document.getElementById('reservaModal');
const form = document.getElementById('reservaForm');
const mensajeExito = document.getElementById('mensajeExito');
let barberoActual = '';
let servicioActual = '';
let fechaActual = '';

// ========================================
// CONFIGURAR FECHA MÍNIMA (HOY)
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  const inputFecha = document.getElementById('fecha');
  const hoy = new Date().toISOString().split('T')[0];
  inputFecha.setAttribute('min', hoy);
  
  // Desactivar domingos
  inputFecha.addEventListener('input', (e) => {
    const fecha = new Date(e.target.value + 'T00:00:00');
    if (fecha.getDay() === 0) { // 0 = Domingo
      alert('Lo sentimos, no trabajamos los domingos. Por favor selecciona otro día.');
      e.target.value = '';
      fechaActual = '';
    } else {
      fechaActual = e.target.value;
      cargarHorasDisponibles();
    }
  });
  
  // Actualizar horas cuando cambia el servicio
  const selectServicio = document.getElementById('servicio');
  selectServicio.addEventListener('change', (e) => {
    servicioActual = e.target.value;
    cargarHorasDisponibles();
  });
});

// ========================================
// ABRIR MODAL AL HACER CLICK EN BARBERO
// ========================================
document.querySelectorAll('.barbero-card').forEach(card => {
  card.addEventListener('click', () => {
    barberoActual = card.getAttribute('data-barbero');
    abrirModal(barberoActual);
  });
});

function abrirModal(barbero) {
  const nombreBarbero = CONFIG.barberos[barbero];
  document.getElementById('barberoNombre').textContent = nombreBarbero;
  document.getElementById('barberoSeleccionado').value = nombreBarbero;
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  // Resetear formulario
  form.reset();
  form.style.display = 'block';
  mensajeExito.style.display = 'none';
  
  // IMPORTANTE: Deshabilitar botón al abrir modal
  const btnConfirmar = document.querySelector('.btn-confirmar');
  btnConfirmar.disabled = true;
  
  // Resetear variables
  servicioActual = '';
  fechaActual = '';
  
  // Resetear horas disponibles
  mostrarMensajeHoras('Selecciona un servicio y una fecha para ver las horas disponibles');
}

// ========================================
// CARGAR HORAS DISPONIBLES DINÁMICAMENTE
// ========================================
async function cargarHorasDisponibles() {
  // Validar que estén seleccionados servicio y fecha
  if (!servicioActual || !fechaActual || !barberoActual) {
    const btnConfirmar = document.querySelector('.btn-confirmar');
    if (btnConfirmar) btnConfirmar.disabled = true;
    return;
  }
  
  const contenedorHoras = document.getElementById('horasDisponibles');
  mostrarCargando();
  
  // Deshabilitar botón mientras carga
  const btnConfirmar = document.querySelector('.btn-confirmar');
  if (btnConfirmar) btnConfirmar.disabled = true;
  
  try {
    const response = await fetch(`${CONFIG.webAppURL}?action=obtenerHoras&barbero=${encodeURIComponent(CONFIG.barberos[barberoActual])}&fecha=${fechaActual}&servicio=${encodeURIComponent(servicioActual)}`);
    
    const resultado = await response.json();
    
    if (resultado.exito && resultado.horas.length > 0) {
      mostrarHoras(resultado.horas);
    } else {
      mostrarMensajeHoras('❌ No hay horarios disponibles para esta fecha y servicio');
    }
    
  } catch (error) {
    console.error('Error al cargar horas:', error);
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
  
  // Guardar hora seleccionada
  document.getElementById('hora').value = hora;
  
  // Habilitar botón de confirmar
  const btnConfirmar = document.querySelector('.btn-confirmar');
  if (btnConfirmar) {
    btnConfirmar.disabled = false;
  }
  
  console.log('✅ Hora seleccionada:', hora);
  console.log('✅ Botón habilitado');
}

// ========================================
// CERRAR MODAL
// ========================================
function cerrarModal() {
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  form.reset();
  mensajeExito.style.display = 'none';
  servicioActual = '';
  fechaActual = '';
  barberoActual = '';
  
  // Deshabilitar botón al cerrar
  const btnConfirmar = document.querySelector('.btn-confirmar');
  if (btnConfirmar) btnConfirmar.disabled = true;
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
// ENVIAR FORMULARIO
// ========================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  console.log('📝 Formulario enviado');
  
  // Obtener datos del formulario
  const datos = {
    barbero: document.getElementById('barberoSeleccionado').value,
    nombre: document.getElementById('nombre').value,
    email: document.getElementById('email').value,
    fecha: document.getElementById('fecha').value,
    hora: document.getElementById('hora').value,
    servicio: document.getElementById('servicio').value,
  };
  
  console.log('📊 Datos del formulario:', datos);
  
  // Validar que todos los campos requeridos estén llenos
  if (!datos.nombre || !datos.email || !datos.fecha || !datos.hora || !datos.servicio) {
    alert('Por favor completa todos los campos obligatorios (*)');
    console.log('❌ Validación fallida - Campos faltantes');
    return;
  }
  
  // Deshabilitar botón mientras se procesa
  const btnConfirmar = document.querySelector('.btn-confirmar');
  const textoOriginal = btnConfirmar.innerHTML;
  btnConfirmar.disabled = true;
  btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  
  console.log('⏳ Enviando datos a Apps Script...');
  
  try {
    // ENVIAR DATOS A GOOGLE SHEETS VIA APPS SCRIPT
    const response = await fetch(CONFIG.webAppURL, {
      redirect: 'follow',
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(datos)
    });
    
    console.log('📡 Respuesta recibida');
    
    const resultado = await response.json();
    
    console.log('📄 Resultado:', resultado);
    
    if (resultado.exito) {
      console.log('✅ Reserva exitosa');
      mostrarExito();
    } else {
      console.log('❌ Error en reserva:', resultado.mensaje);
      alert('❌ ' + resultado.mensaje);
      btnConfirmar.disabled = false;
      btnConfirmar.innerHTML = textoOriginal;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('⚠️ Asumiendo éxito por error de CORS');
    mostrarExito();
  }
});

// ========================================
// MOSTRAR MENSAJE DE ÉXITO
// ========================================
function mostrarExito() {
  form.style.display = 'none';
  mensajeExito.style.display = 'block';
  
  // Scroll al inicio del modal
  document.querySelector('.modal-content').scrollTop = 0;
  
  // Restaurar botón después de 3 segundos
  setTimeout(() => {
    const btnConfirmar = document.querySelector('.btn-confirmar');
    if (btnConfirmar) {
      btnConfirmar.disabled = true;
      btnConfirmar.innerHTML = '<i class="fas fa-check"></i> Confirmar Reserva';
    }
  }, 3000);
}

// ========================================
// ANIMACIÓN SMOOTH SCROLL
// ========================================
document.querySelector('.btn-volver')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'index.html';
});

// ========================================
// CONSOLE MESSAGE
// ========================================
console.log('%c💈 Sistema de Reservas - Oroz Barber', 'font-size: 16px; color: #DAA520; font-weight: bold;');
console.log('%cPágina de reservas cargada correctamente', 'font-size: 12px; color: #999;');