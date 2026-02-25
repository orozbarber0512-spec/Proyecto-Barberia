// ✅ Configuración segura
const CONFIG = {
    // URL ofuscada
    webAppURL: atob('aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3VlZBWEpkM1dmVEFLVm1yT0pNOVkyMUFZbnpYU3hKSlBQdHZPZmlkaFl1dVF6ZXpTNXJybGhlcFRGS0xpbnVNSkEvZXhlYw=='),
    maxIntentos: 3,
    timeoutIntentos: 600000 // 10 minutos
};

// ========================================
// UTILIDADES DE SEGURIDAD
// ========================================

function sanitizarTexto(texto) {
    if (!texto || typeof texto !== 'string') return '';
    return texto.trim().replace(/[<>\"']/g, '').substring(0, 500);
}

function validarIdCita(idCita) {
    if (!idCita || typeof idCita !== 'string') return false;
    
    // Regex actualizada para permitir puntos, guiones y caracteres comunes de IDs de Google
    const regex = /^[a-z0-9_@\.\-\=]+$/i; 
    return regex.test(idCita) && idCita.length > 5;
}

// ✅ Rate Limiting
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
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // ✅ Ocultar logs en producción
    const esProduccion = window.location.hostname !== 'localhost';
    
    if (!esProduccion) {
        console.log('%c✂️ Sistema de Cancelación - Oroz Barber v2.0 SEGURO', 
                    'color: #DAA520; font-weight: bold;');
    }
    
    const form = document.getElementById('formCancelar');
    const formularioContenedor = document.getElementById('formularioCancelacion');
    const mensajeExito = document.getElementById('mensajeExito');
    const mensajeError = document.getElementById('mensajeError');
    const textoError = document.getElementById('textoError');
    const inputIdCita = document.getElementById('idCita');
    const btnReintentar = document.getElementById('btnReintentar');
    
    if (btnReintentar) {
            btnReintentar.addEventListener('click', volverFormulario);
    } 
    // ✅ Validar elementos del DOM
    if (!form || !formularioContenedor || !mensajeExito || !mensajeError || !inputIdCita) {
        mostrarError('Error del sistema. Por favor recarga la página.');
        return;
    }

    // 1. AUTO-COMPLETAR ID DESDE URL (con validación)
    const urlParams = new URLSearchParams(window.location.search);
    const idCitaURL = urlParams.get('id');
    
    if (idCitaURL) {
        const idSanitizado = sanitizarTexto(decodeURIComponent(idCitaURL));
        
        if (validarIdCita(idSanitizado)) {
            inputIdCita.value = idSanitizado;
        }
    }

    // 2. MANEJO DEL ENVÍO DEL FORMULARIO
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const idCita = sanitizarTexto(inputIdCita.value);

            // ✅ Validación exhaustiva
            if (!idCita) {
                mostrarError('Por favor ingresa el ID de tu cita');
                return;
            }
            
            if (!validarIdCita(idCita)) {
                mostrarError('El ID de la cita no tiene un formato válido');
                return;
            }
            
            // ✅ Rate Limiting
            if (!RateLimiter.permitirAccion('cancelarCita')) {
                const minutos = RateLimiter.obtenerTiempoEspera('cancelarCita');
                mostrarError(`Demasiados intentos. Espera ${minutos} minutos antes de intentar nuevamente.`);
                return;
            }
            
            RateLimiter.registrarIntento('cancelarCita');

            // Estado de carga en el botón
            const btnCancelar = form.querySelector('.btn-cancelar-cita');
            const textoOriginal = btnCancelar.innerHTML;
            
            btnCancelar.disabled = true;
            btnCancelar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESANDO...';

            try {
                // ✅ Timeout de 20 segundos
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000);
                
                const response = await fetch(CONFIG.webAppURL, {
                    redirect: 'follow',
                    method: 'POST',
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'text/plain',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'cancelar',
                        idCita: idCita
                    })
                });
                
                clearTimeout(timeoutId);

                // ✅ Validar respuesta del servidor
                if (!response.ok) {
                    throw new Error(`Error del servidor: ${response.status}`);
                }

                const resultado = await response.json();
                
                // ✅ Validar estructura de respuesta
                if (!resultado || typeof resultado.exito !== 'boolean') {
                    throw new Error('Respuesta inválida del servidor');
                }

                // Ocultar formulario principal
                formularioContenedor.style.display = 'none';

                if (resultado.exito) {
                    mostrarResultado(mensajeExito);
                } else {
                    const mensajeSeguro = sanitizarTexto(resultado.mensaje || 'No se pudo cancelar la cita');
                    textoError.textContent = mensajeSeguro;
                    mostrarResultado(mensajeError);
                }

            } catch (error) {
                formularioContenedor.style.display = 'none';
                
                if (error.name === 'AbortError') {
                    textoError.textContent = 'La petición tardó demasiado. Por favor intenta nuevamente.';
                } else {
                    textoError.textContent = 'Error de conexión con el servidor. Intenta más tarde.';
                }
                
                mostrarResultado(mensajeError);
            } finally {
                btnCancelar.disabled = false;
                btnCancelar.innerHTML = textoOriginal;
            }
        });
    }

    // 3. FUNCIONES DE APOYO
    function mostrarResultado(elemento) {
        mensajeExito.style.display = 'none';
        mensajeError.style.display = 'none';
        elemento.style.display = 'block';
        elemento.classList.add('visible');
    }
    
    function mostrarError(mensaje) {
        const mensajeSanitizado = sanitizarTexto(mensaje);
        alert('⚠️ ' + mensajeSanitizado);
    }
});

// ========================================
// FUNCIÓN GLOBAL
// ========================================

function volverFormulario() {
    // Forzamos la búsqueda de elementos
    const formulario = document.getElementById('formularioCancelacion');
    const mensajeExito = document.getElementById('mensajeExito');
    const mensajeError = document.getElementById('mensajeError');
    const inputId = document.getElementById('idCita');

    // Limpiamos estados de error/éxito
    if (mensajeExito) mensajeExito.style.display = 'none';
    if (mensajeError) mensajeError.style.display = 'none';
    
    // Mostramos el contenedor principal
    if (formulario) {
        formulario.style.display = 'block';
        formulario.classList.remove('hidden'); // Por si usas clases CSS de visibilidad
    }

    // Limpiamos el input para un nuevo intento
    if (inputId) {
        inputId.value = '';
        setTimeout(() => inputId.focus(), 100);
    }
}

// ✅ PROTECCIÓN: Deshabilitar DevTools en producción
if (window.location.hostname !== 'localhost') {
    document.addEventListener('contextmenu', e => e.preventDefault());
}