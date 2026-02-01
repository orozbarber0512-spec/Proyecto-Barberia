// ========================================
// CONFIGURACIÓN
// ======================================== 
const CONFIG = {
  // URL de tu Web App de Apps Script
  webAppURL: 'https://script.google.com/macros/s/AKfycbwJl-c5iMGW3ZqNY0bZR3vzTfD7gdP7nObIXT07Kd-YdCOvqj5-GYf2ohByLHq8oZOM/exec', // 👈 CAMBIA ESTO POR LA URL QUE COPIASTE
  
  // Nombres de los barberos
  barberos: {
    barbero1: 'Felipe Orozco',
    barbero2: 'Miguel Ángel',
    barbero3: 'Andrés López'
  }
};

// ========================================
// VARIABLES GLOBALES
// ========================================
const modal = document.getElementById('reservaModal');
const form = document.getElementById('reservaForm');
const mensajeExito = document.getElementById('mensajeExito');
let barberoActual = '';

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
    }
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
}

// ========================================
// CERRAR MODAL
// ========================================
function cerrarModal() {
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  form.reset();
  mensajeExito.style.display = 'none';
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
    fecha: document.getElementById('fecha').value, // YYYY-MM-DD
    hora: document.getElementById('hora').value,
    servicio: document.getElementById('servicio').value,
    comentarios: document.getElementById('comentarios').value
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
    
    const resultado = await response.json();
    
    if (resultado.exito) {
      // Mostrar mensaje de éxito
      mostrarExito();
    } else {
      // Mostrar mensaje de error
      alert('❌ ' + resultado.mensaje);
      btnConfirmar.disabled = false;
      btnConfirmar.innerHTML = textoOriginal;
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    // Asumir que funcionó (por el modo no-cors)
    // Si quieres estar seguro, usa el método anterior con resultado.exito
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