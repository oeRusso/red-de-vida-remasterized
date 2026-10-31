# Decisiones de diseño

Referencias revisadas en octubre de 2026 y qué se tomó de cada una. La lógica de negocio no cambia: esto solo afecta a la presentación.

| Idea | Visto en | Aplicación |
| --- | --- | --- |
| Botón de agendar siempre visible | [NYBC](https://www.nybc.org/), [Cleveland Clinic](https://my.clevelandclinic.org/), [Vitalant](https://www.vitalant.org/) | "Agendar cita" en el encabezado y barra fija en móvil |
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
