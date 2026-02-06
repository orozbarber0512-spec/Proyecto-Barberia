// ========================================
// CONFIGURACIÓN
// ======================================== 
const CONFIG = {
  // URL de tu Web App de Apps Script
  webAppURL: 'https://script.google.com/macros/s/AKfycby2vu-pCmAskLsGqrr1RId3Gdmy7rtU5HRD3GzSAwTzV4OQsTsq_Vx3Npus8SR5frS6jw/exec',
  
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
    } else {
      fechaActual = e.target.value;
      cargarHorasDisponibles(); // Actualizar horas cuando cambia la fecha
    }
  });
  
  // Actualizar horas cuando cambia el servicio
  const selectServicio = document.getElementById('servicio');
  selectServicio.addEventListener('change', (e) => {
    servicioActual = e.target.value;
    cargarHorasDisponibles(); // Actualizar horas según duración del servicio
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
  
  // Resetear horas disponibles
  mostrarMensajeHoras('Selecciona un servicio y una fecha para ver las horas disponibles');
}

// ========================================
// CARGAR HORAS DISPONIBLES DINÁMICAMENTE
// ========================================
async function cargarHorasDisponibles() {
  // Validar que estén seleccionados servicio y fecha
  if (!servicioActual || !fechaActual || !barberoActual) {
    return;
  }
  
  const contenedorHoras = document.getElementById('horasDisponibles');
  mostrarCargando();
  
  try {
    // Llamar a Apps Script para obtener horas disponibles
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
  document.querySelector('.btn-confirmar').disabled = false;
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
  
  // Obtener datos del formulario
  const datos = {
    barbero: document.getElementById('barberoSeleccionado').value,
    nombre: document.getElementById('nombre').value,
    email: document.getElementById('email').value,
    fecha: document.getElementById('fecha').value,
    hora: document.getElementById('hora').value,
    servicio: document.getElementById('servicio').value,
  };
  
  // Validar que todos los campos requeridos estén llenos
  if (!datos.nombre || !datos.email || !datos.fecha || !datos.hora || !datos.servicio) {
    alert('Por favor completa todos los campos obligatorios (*)');
    return;
  }
  
  // Deshabilitar botón mientras se procesa
  const btnConfirmar = document.querySelector('.btn-confirmar');
  const textoOriginal = btnConfirmar.innerHTML;
  btnConfirmar.disabled = true;
  btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  
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
    
    // VERIFICAR SI LA RESPUESTA ES VÁLIDA
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const textoRespuesta = await response.text();
    console.log('Respuesta del servidor:', textoRespuesta);
    
    // Intentar parsear como JSON
    let resultado;
    try {
      resultado = JSON.parse(textoRespuesta);
    } catch (parseError) {
      console.error('Error al parsear respuesta:', parseError);
      console.log('Respuesta original:', textoRespuesta);
      
      // Si no se puede parsear pero la petición llegó, asumir éxito
      if (textoRespuesta.includes('exito') || response.status === 200) {
        mostrarExito();
        return;
      } else {
        throw new Error('Respuesta del servidor no válida');
      }
    }
    
    // Procesar resultado parseado
    if (resultado.exito) {
      mostrarExito();
    } else {
      alert('❌ ' + (resultado.mensaje || 'Error desconocido'));
      btnConfirmar.disabled = false;
      btnConfirmar.innerHTML = textoOriginal;
    }
    
  } catch (error) {
    console.error('Error completo:', error);
    
    // Intentar mostrar un mensaje más específico
    let mensajeError = 'Error de conexión. ';
    
    if (error.message.includes('HTTP')) {
      mensajeError += 'Problema con el servidor.';
    } else if (error.message.includes('Failed to fetch')) {
      mensajeError += 'Verifica tu conexión a internet.';
    } else {
      mensajeError += error.message;
    }
    
    // Mostrar error al usuario
    alert('⚠️ ' + mensajeError + '\n\nIntenta nuevamente o contacta con la barbería.');
    
    btnConfirmar.disabled = false;
    btnConfirmar.innerHTML = textoOriginal;
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
  
  console.log('✅ Mensaje de éxito mostrado correctamente');
  
  // Restaurar botón después de 3 segundos
  setTimeout(() => {
    const btnConfirmar = document.querySelector('.btn-confirmar');
    btnConfirmar.disabled = false;
    btnConfirmar.innerHTML = '<i class="fas fa-check"></i> Confirmar Reserva';
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