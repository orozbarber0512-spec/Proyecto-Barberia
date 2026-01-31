// ========================================
// CONFIGURACIÓN
// ======================================== 
const CONFIG = {
  // URL de tu Web App de Apps Script
  webAppURL: 'PEGA_AQUI_TU_URL_DE_WEBAPP', // 👈 CAMBIA ESTO
  
  // Número de WhatsApp de la barbería (formato internacional sin +)
  whatsappNumero: '573026761974', // Cambia esto por tu número real
  
  // Nombres de los barberos
  barberos: {
    barbero1: 'Carlos Rodríguez',
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
    telefono: document.getElementById('telefono').value,
    email: document.getElementById('email').value,
    fecha: document.getElementById('fecha').value, // YYYY-MM-DD
    hora: document.getElementById('hora').value,
    servicio: document.getElementById('servicio').value,
    comentarios: document.getElementById('comentarios').value
  };
  
  // Validar que todos los campos requeridos estén llenos
  if (!datos.nombre || !datos.telefono || !datos.fecha || !datos.hora || !datos.servicio) {
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
      method: 'POST',
      mode: 'no-cors', // Importante para evitar CORS
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos)
    });
    
    // Como usamos no-cors, asumimos que funcionó si no hay error
    // Formatear fecha para WhatsApp
    const fechaObj = new Date(datos.fecha + 'T00:00:00');
    const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Crear mensaje para WhatsApp
    const mensaje = `
🔥 *NUEVA RESERVA - OROZ BARBER* 🔥

👤 *Cliente:* ${datos.nombre}
📱 *Teléfono:* ${datos.telefono}
${datos.email ? `📧 *Email:* ${datos.email}` : ''}

💈 *Barbero:* ${datos.barbero}
📅 *Fecha:* ${fechaFormateada}
🕐 *Hora:* ${datos.hora}
✂️ *Servicio:* ${datos.servicio}

${datos.comentarios ? `💬 *Comentarios:* ${datos.comentarios}` : ''}

_Reserva realizada desde la web_
    `.trim();
    
    // Enviar por WhatsApp
    enviarWhatsApp(mensaje);
    
    // Mostrar mensaje de éxito
    mostrarExito();
    
  } catch (error) {
    console.error('Error:', error);
    alert('Hubo un error al procesar tu reserva. Por favor intenta nuevamente o contáctanos por WhatsApp.');
    btnConfirmar.disabled = false;
    btnConfirmar.innerHTML = textoOriginal;
  }
});

// ========================================
// ENVIAR MENSAJE POR WHATSAPP
// ========================================
function enviarWhatsApp(mensaje) {
  const mensajeCodificado = encodeURIComponent(mensaje);
  const url = `https://wa.me/${CONFIG.whatsappNumero}?text=${mensajeCodificado}`;
  
  // Abrir WhatsApp en nueva pestaña
  window.open(url, '_blank');
}

// ========================================
// MOSTRAR MENSAJE DE ÉXITO
// ========================================
function mostrarExito() {
  form.style.display = 'none';
  mensajeExito.style.display = 'block';
  
  // Scroll al inicio del modal
  document.querySelector('.modal-content').scrollTop = 0;
}