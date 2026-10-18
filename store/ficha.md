# Textos para la ficha de Chrome Web Store

Copia y pega cada bloque en su campo. Idioma de la ficha: Español.

---

## Pestaña "Ficha de Play Store" (Store listing)

### Título
stopScrolling — Anti scroll infinito

### Resumen (máx. 132 caracteres)
Hace grises, lentos y aburridos los feeds con scroll infinito. Instagram, TikTok, X, Reddit, YouTube… pierden la gracia.

### Descripción
stopScrolling detecta las páginas con scroll infinito y las vuelve aburridas: justo lo contrario de lo que esas páginas intentan hacer con tu cerebro.

Qué hace cuando entras en un feed infinito:

• Escala de grises: la página pierde el color y el contraste poco a poco.
• Scroll a trompicones: la rueda, el trackpad y el teclado van lentos e irregulares.
• Carga desganada: el contenido nuevo aparece con un fundido lento.
• Contador de tiempo: una píldora discreta te recuerda cuánto llevas hoy en ese sitio.
• Pausa forzada: cada pocos minutos una pantalla te obliga a parar 10 segundos y te pregunta si de verdad quieres seguir.

Los efectos suben gradualmente durante los primeros 90 segundos. Una consulta rápida no molesta; quedarse enganchado, sí.

Dónde actúa: Instagram, TikTok, Facebook, X, Reddit, Pinterest, Twitch, 9GAG, Tumblr, Threads, Bluesky, el feed de LinkedIn y YouTube (portada, Shorts y búsqueda; ver un vídeo concreto no activa la fricción). Opcionalmente puede detectar scroll infinito en cualquier otra web.

Dónde no actúa: mensajes directos, bandejas de mensajes, ajustes y un hilo concreto de Reddit. Tampoco frena el zoom ni el scroll dentro de un campo de texto.

Controles desde el icono:
• Pausar 15 minutos, con reactivación automática.
• Intensidad suave, media o dura.
• Lista blanca para sitios de trabajo y "siempre con fricción" para cualquier web.
• Tiempo de hoy en el sitio actual y total en sitios con fricción.

Privacidad: nada sale de tu ordenador. Las estadísticas se guardan solo en tu navegador y se borran a los 14 días. Sin cuentas, sin analítica, sin peticiones de red.

Código abierto (MIT): https://github.com/ccallelobo/stopScrolling

### Categoría
Productividad (o "Bienestar" si aparece como opción)

### Idioma
Español

### Icono de la tienda
store/icon128.png (el mismo icons/icon128.png del repo)

### Capturas de pantalla (1280×800)
store/screenshot-1.png

### Mosaico promocional pequeño (440×280, opcional pero recomendado)
store/promo-440x280.png

### Sitio web oficial
https://www.ccallelobo.es

### URL de asistencia
https://github.com/ccallelobo/stopScrolling/issues

---

## Pestaña "Prácticas de privacidad" (Privacy practices)

### Finalidad única (Single purpose)
Añadir fricción visual (escala de grises, scroll lento, contador de tiempo y pausas) a las páginas con scroll infinito para reducir el uso compulsivo de redes sociales.

### Justificación de permisos

**storage**
Guardar en el navegador los ajustes del usuario (intensidad, pausa temporal, listas de sitios) y el contador de tiempo diario por dominio. No se sincroniza ni se envía a ningún servidor.

**activeTab**
Conocer el dominio de la pestaña activa cuando el usuario abre el popup, para mostrar el tiempo de hoy en ese sitio y permitirle ponerlo en lista blanca o forzar la fricción.

**scripting**
Registrar el content script en los sitios adicionales que el usuario autoriza explícitamente mediante los permisos de host opcionales, e inyectarlo en la pestaña actual sin obligar a recargar.

**Permisos de host (sitios de la lista: instagram.com, tiktok.com, facebook.com, twitter.com, x.com, reddit.com, pinterest.com, twitch.tv, 9gag.com, tumblr.com, threads.net, threads.com, bsky.app, youtube.com, linkedin.com)**
Son los sitios con scroll infinito conocidos. El content script necesita ejecutarse en ellos para aplicar el filtro gris, frenar el scroll, mostrar el contador y la pausa. No lee ni modifica el contenido de la página más allá de superponer esos elementos.

**Permisos de host opcionales (http://*/*, https://*/*)**
Solo se solicitan si el usuario activa "Detectar feeds en cualquier web" o elige "Siempre con fricción" en un sitio que no está en la lista. Permiten detectar scroll infinito mediante una heurística local (la página crece repetidamente al llegar al final). Revocables desde chrome://extensions.

### ¿Usa código remoto?
No, no uso código remoto.

### Uso de datos
Marcar: **no recoge ni usa ningún dato de usuario** (no marcar ninguna categoría).

Certificaciones (marcar las tres):
☑ No vendo ni transfiero datos de usuario a terceros fuera de los casos de uso aprobados.
☑ No uso ni transfiero datos de usuario con fines no relacionados con la finalidad única del producto.
☑ No uso ni transfiero datos de usuario para determinar la solvencia crediticia ni para conceder préstamos.

### URL de la política de privacidad
https://github.com/ccallelobo/stopScrolling/blob/main/PRIVACY.md

---

## Pestaña "Distribución"

- Visibilidad: **No incluida en la lista** (Unlisted) si quieres que solo llegue por enlace; **Pública** si quieres que aparezca en búsquedas.
- Pago: Gratis.
- Regiones: todas.

---

## Pestaña "Cuenta" (bloqueo frecuente)

Antes de poder enviar, la Web Store exige:
- Nombre del editor.
- **Correo de contacto verificado** (llega un email de confirmación; hasta que no lo confirmas, el botón de enviar sigue bloqueado).
- Verificación en dos pasos activa en la cuenta de Google.

Si el botón "Enviar para revisión" sigue gris, pulsa el enlace **"¿Por qué no puedo enviar?"** arriba a la derecha de la ficha: lista exactamente los campos que faltan.
