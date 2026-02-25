// ✅ Ocultar logs en producción
const esProduccion = window.location.hostname !== 'localhost' && 
                     !window.location.hostname.includes('127.0.0.1');

if (!esProduccion) {
  console.log('%c🔥 OROZ BARBER 🔥', 'font-size: 20px; color: #DAA520; font-weight: bold;');
  console.log('%cEstilo, Precisión y Actitud', 'font-size: 14px; color: #999; font-style: italic;');
}

// ========================================
// NAVBAR - Menu Toggle Mobile
// ========================================
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuToggle.classList.toggle('active');
  });

  // Cerrar menú al hacer click en un enlace
  const navLinks = document.querySelectorAll('.nav-menu li a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      menuToggle.classList.remove('active');
    });
  });
}

// ========================================
// NAVBAR - Cambiar fondo al hacer scroll
// ========================================
const header = document.querySelector('.header');

if (header) {
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      header.style.background = 'rgba(0, 0, 0, 0.98)';
      header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.5)';
    } else {
      header.style.background = 'rgba(0, 0, 0, 0.95)';
      header.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
  });
}

// ========================================
// SMOOTH SCROLL para enlaces internos
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    
    // ✅ Validación: verificar que el href sea seguro
    if (!href || href === '#') return;
    
    e.preventDefault();
    const target = document.querySelector(href);
    
    if (target && header) {
      const headerHeight = header.offsetHeight;
      const targetPosition = target.offsetTop - headerHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ========================================
// ANIMACIÓN - Elementos al hacer scroll
// ========================================
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observar tarjetas de servicios
document.querySelectorAll('.servicio-card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = 'all 0.6s ease';
  observer.observe(card);
});

// Observar tarjetas de info
document.querySelectorAll('.info-card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = 'all 0.6s ease';
  observer.observe(card);
});

// ========================================
// LAZY LOADING para imágenes
// ========================================
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        
        // ✅ Validar que el src sea seguro
        if (src && (src.startsWith('./') || src.startsWith('assets/') || src.startsWith('http'))) {
          img.src = src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// ========================================
// PARALLAX EFFECT para Hero (solo desktop)
// ========================================
if (window.innerWidth > 768) {
  window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    if (hero) {
      const scrolled = window.pageYOffset;
      const maxOffset = 200;
      const offset = Math.min(scrolled * 0.3, maxOffset);
      hero.style.backgroundPositionY = offset + 'px';
    }
  });
}

// ========================================
// Prevenir FOUC (Flash of Unstyled Content)
// ========================================
window.addEventListener('load', () => {
  document.body.style.opacity = '1';
});

// ========================================
// Inicializar Lucide Icons
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

// ========================================
// SIMULAR HOVER EN MÓVIL (SERVICIOS)
// ========================================
document.querySelectorAll('.servicio-card').forEach(card => {
  card.addEventListener('touchstart', () => {
    document
      .querySelectorAll('.servicio-card.active')
      .forEach(c => c.classList.remove('active'));

    card.classList.add('active');
  });
});

// ========================================
// ✅ PROTECCIÓN DE SEGURIDAD
// ========================================

// Prevenir inyección de scripts maliciosos
if (esProduccion) {
  // Deshabilitar click derecho
  document.addEventListener('contextmenu', e => e.preventDefault());
  
  // Prevenir drag & drop de archivos externos
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => e.preventDefault());
}

// ✅ Limpiar URL de parámetros sospechosos al cargar
window.addEventListener('load', () => {
  const url = new URL(window.location);
  const params = url.searchParams;
  
  // Lista de parámetros peligrosos comunes en ataques
  const parametrosPeligrosos = ['<script', 'javascript:', 'onerror', 'onload', 'eval('];
  
  let hayParametrosPeligrosos = false;
  
  params.forEach((value, key) => {
    parametrosPeligrosos.forEach(peligroso => {
      if (value.toLowerCase().includes(peligroso) || key.toLowerCase().includes(peligroso)) {
        hayParametrosPeligrosos = true;
      }
    });
  });
  
  // Si hay parámetros peligrosos, limpiar URL
  if (hayParametrosPeligrosos && esProduccion) {
    window.location.href = window.location.origin + window.location.pathname;
  }
});