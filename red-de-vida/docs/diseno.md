# Decisiones de diseño

Referencias revisadas en octubre de 2026 y qué se tomó de cada una. La lógica de negocio no cambia: esto solo afecta a la presentación.

| Idea | Visto en | Aplicación |
| --- | --- | --- |
| Botón de agendar siempre visible | [NYBC](https://www.nybc.org/), [Cleveland Clinic](https://my.clevelandclinic.org/), [Vitalant](https://www.vitalant.org/) | "Agendar cita" en el encabezado, sin repetirlo en la misma vista (ver "Acciones repetidas") |
| Encabezado de dos niveles | NYBC, Cleveland Clinic | Barra superior con accesos rápidos |
| Comprobar requisitos antes de agendar | [OneBlood](https://www.oneblood.org/), Vitalant | "¿Puedo donar?" interactivo en la landing |
| Búsqueda de sedes | Vitalant | Página `/instituciones` con buscador, filtro y horarios |
| Carné digital e historial | [Cruz Roja](https://www.redcrossblood.org/) | Carné de donante en el panel y el perfil |
| Saltar al contenido | [Mayo Clinic](https://www.mayoclinic.org/) | Enlace de accesibilidad al inicio |
| Confirmación y recordatorio de la cita | Guías de diseño para salud | Resumen de la reserva y archivo `.ics` |

Se descartó lo que resta seriedad o exigiría datos que no existen:

- Banners de urgencia por tipo de sangre: no hay datos de stock.
- Sorteos y promociones.
- Estadísticas, testimonios y acreditaciones: la web solo muestra lo que el proyecto puede sostener.
- Fotografías de personas: necesitan material propio o con licencia. La imagen principal combina la ilustración de la marca con una vista de la app; sus datos son de ejemplo.

Base visual: serif Fraunces en titulares, DM Sans en el texto, rojo de marca como acento y vino oscuro para las superficies grandes. Las animaciones respetan `prefers-reduced-motion`.

## Acciones repetidas

Cada pantalla muestra una sola vez la acción que la lleva adelante. Repetirla no convierte más: satura.

- El botón "Agendar cita" del encabezado se oculta en `/agendar`, `/login`, `/registro` y `/premios`, que ya tienen su acción propia.
- En la landing aparece recién cuando el botón del hero sale de la vista.
- "Iniciar sesión" no se muestra en las páginas de acceso.
- Se quitaron la banda final y la barra fija en móvil de la landing.
- El resultado de "¿Puedo donar?" lleva un enlace, no un botón.
- `Button` y `buttonClass` tienen tres tamaños: `sm` en tarjetas y filas, `md` por defecto y `lg` solo en el hero.

## Movimiento

Es una app de salud: el movimiento acompaña y no celebra de más. Por eso no hay confeti, y el efecto propio de la marca sale del tema, no de la moda. No se usan dependencias de animación.

| Efecto | Dónde | Cómo se degrada |
| --- | --- | --- |
| Línea de pulso (`PulseLine`) | Hero, pasos, acceso | Sin scroll ligado a la animación, o con movimiento reducido, se ve completa |
| Entrada al hacer scroll (`.reveal`) | Landing e instituciones | Los keyframes solo definen `from`: sin soporte, el contenido se ve directamente |
| Gota de nivel (`DropGauge`) | Panel | Llena hasta su valor y sin ola |
| Revelado de medalla (`MedalReveal`) | Panel, al volver tras una confirmación | Sin `localStorage` no hay aviso; la medalla sigue en el recorrido |
| Conteo de números (`CountUp`) | Panel y administración | El HTML trae el valor final |
| Transiciones (`ViewTransition`) | Entre páginas, del esqueleto al contenido y entre pasos de la reserva | Sin soporte, el cambio es inmediato |

Decisiones que no conviene deshacer sin revisarlas:

- **El fundido de página va en cada `page.tsx`**, con `PageTransition`, no en el layout: los layouts persisten y `enter`/`exit` nunca se disparan.
- **El encabezado es opaco.** Su `view-transition-name` anula el `backdrop-blur` de los hijos, y con la barra translúcida se leía el texto de abajo.
- **`.reveal` no va en un elemento con `hover:-translate-*`**: la animación fija `transform` y anula el hover. Se pone en un envoltorio.
- **El carné no se transforma entre `/premios` y `/perfil`.** Se probó con un `ViewTransition` con nombre, pero el destino pasa por `Suspense` y el par nunca se forma.
- **Los pseudoelementos `::details-content` y `::view-transition-*` van en reglas propias**: un selector desconocido invalida toda la regla que lo comparte.
