/**
 * OROZ BARBER - Sistema de Cancelación
 * Lógica para procesamiento de bajas de citas
 */

document.addEventListener('DOMContentLoaded', () => {
    // Configuración de la API
    const CONFIG = {
        webAppURL: 'https://script.google.com/macros/s/AKfycbwJl-c5iMGW3ZqNY0bZR3vzTfD7gdP7nObIXT07Kd-YdCOvqj5-GYf2ohByLHq8oZOM/exec'
    };

    // Referencias al DOM
    const form = document.getElementById('formCancelar');
    const formularioContenedor = document.getElementById('formularioCancelacion');
    const mensajeExito = document.getElementById('mensajeExito');
    const mensajeError = document.getElementById('mensajeError');
    const textoError = document.getElementById('textoError');
    const inputIdCita = document.getElementById('idCita');

    // 1. AUTO-COMPLETAR ID DESDE URL
    // Útil si el cliente llega desde un link de correo: cancelacion.html?id=XXX
    const urlParams = new URLSearchParams(window.location.search);
    const idCitaURL = urlParams.get('id');
    if (idCitaURL && inputIdCita) {
        inputIdCita.value = decodeURIComponent(idCitaURL);
    }

    // 2. MANEJO DEL ENVÍO DEL FORMULARIO
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const idCita = inputIdCita.value.trim();

            if (!idCita) {
                alert('Por favor ingresa el ID de tu cita');
                return;
            }

            // Estado de carga en el botón
            const btnCancelar = form.querySelector('.btn-cancelar-cita');
            const textoOriginal = btnCancelar.innerHTML;
            
            btnCancelar.disabled = true;
            btnCancelar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESANDO...';

            try {
                const response = await fetch(CONFIG.webAppURL, {
                    redirect: 'follow',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                    body: JSON.stringify({
                        action: 'cancelar',
                        idCita: idCita
                    })
                });

                const resultado = await response.json();

                // Ocultar formulario principal
                formularioContenedor.style.display = 'none';

                if (resultado.exito) {
                    mostrarResultado(mensajeExito);
                } else {
                    textoError.textContent = resultado.mensaje || 'No se pudo cancelar la cita';
                    mostrarResultado(mensajeError);
                }

            } catch (error) {
                console.error('Error de red:', error);
                formularioContenedor.style.display = 'none';
                textoError.textContent = 'Error de conexión con el servidor. Intenta más tarde.';
                mostrarResultado(mensajeError);
            } finally {
                btnCancelar.disabled = false;
                btnCancelar.innerHTML = textoOriginal;
            }
        });
    }

    // 3. FUNCIONES DE APOYO
    function mostrarResultado(elemento) {
        // Primero ocultamos todo por seguridad
        mensajeExito.style.display = 'none';
        mensajeError.style.display = 'none';
        
        // Mostramos el objetivo
        elemento.style.display = 'block';
        elemento.classList.add('visible'); // Clase para CSS si se requiere
    }
});

// Función global para el botón "Intentar de nuevo"
function volverFormulario() {
    const formulario = document.getElementById('formularioCancelacion');
    const mensajeExito = document.getElementById('mensajeExito');
    const mensajeError = document.getElementById('mensajeError');

    if (formulario) {
        // 1. Ocultar los mensajes de resultado primero
        mensajeExito.style.display = 'none';
        mensajeError.style.display = 'none';
        
        // 2. Quitar las clases de visibilidad
        mensajeExito.classList.remove('visible');
        mensajeError.classList.remove('visible');

        // 3. Mostrar el formulario
        formulario.style.display = 'block';
        
        // 4. Limpiar el input para que el usuario pueda escribir uno nuevo
        const inputId = document.getElementById('idCita');
        if(inputId) {
            inputId.value = '';
            inputId.focus(); // Pone el cursor listo para escribir
        }
    }
}

console.log('%c✂️ Oroz Barber - Script cargado correctamente', 'color: #DAA520; font-weight: bold;');