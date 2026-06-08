# OurTime — Plan de Monetización y Go-to-Market

> Fecha: Junio 2026 · Fase actual: MVP pulido, listo para primeros usuarios reales

---

## 1. ¿Qué es OurTime y por qué alguien pagaría?

OurTime es una app de relaciones compartidas — parejas, amigos y familias guardan sus planes, recuerdos, finanzas y chat en un solo lugar. Su ventaja real frente a apps genéricas (Notion, Google Keep, Notes) es que está diseñada con intención para el vínculo afectivo: el design system cálido, los "Momentos", el presupuesto compartido, los álbumes. La propuesta de valor es privacidad + emoción + organización conjunta.

---

## 2. Modelo de negocio recomendado: Freemium + Suscripción

### Plan Gratis (adquisición)
- 1 Historia activa
- Hasta 50 Momentos / 100 fotos
- Chat ilimitado
- Sin acceso a Google Calendar sync

### Plan Duo — $3.99 USD/mes (o $34.99/año)
- Historias ilimitadas
- Fotos y Momentos ilimitados
- Google Calendar sync
- Widgets de pantalla de inicio (cuando se haga nativo)
- Exportar recuerdos en PDF / álbum digital
- Soporte prioritario

### Plan Familia — $6.99 USD/mes
- Todo Duo, hasta 6 miembros por Historia
- Roles y permisos por miembro
- Presupuesto familiar por categorías

**Por qué este modelo funciona:**
- El Plan Gratis es suficiente para "probar" la app con tu pareja sin fricción
- El dolor que convierte (fotos/momentos al límite) ocurre naturalmente en 2-3 meses de uso activo
- Precio por debajo de Spotify: "cuesta menos que un café al mes para los dos"

---

## 3. Roadmap de funciones por fase de crecimiento

### Pre-lanzamiento (0-100 usuarios)
- [ ] Onboarding mejorado: video corto (30s) de lo que es la app
- [ ] Página de landing pública (ourtime.app o similar)
- [ ] Términos de uso y Política de Privacidad reales
- [ ] Sistema de invitación (share code actual ya funciona — potenciarlo)
- [ ] Email de bienvenida via Supabase Auth hooks

### Fase 1 (100-1,000 usuarios)
- [ ] Integrar RevenueCat o Stripe para pagos
- [ ] Agregar paywall suave (no bloquear, sino mostrar cuando alcanzan el límite)
- [ ] Dashboard de métricas internas (cuántas parejas activas, DAU, retención)
- [ ] Notificaciones de aniversario automáticas (con fecha de inicio de la Historia)

### Fase 2 (1,000+ usuarios)
- [ ] App nativa (Capacitor) + widgets iOS/Android
- [ ] Exportar álbum como PDF o fotobook (alianza con Printful/Lulu)
- [ ] "Momentos recurrentes" (cumpleaños, fechas especiales auto-recordadas)
- [ ] Referral program: invita y gana 1 mes gratis

---

## 4. Plan de marketing

### Canales principales

#### TikTok / Instagram Reels (orgánico — alta prioridad)
- Contenido: "Así usa mi pareja y yo OurTime" / "Nuestros planes de la semana"
- Cuenta de la app con videos de características nuevas
- UGC (user generated content): animar a usuarios a compartir sus recuerdos
- Hashtags objetivo: #pareja #relationshipapp #couplegoals #planesconmipareja

#### Reddit (orgánico — comunidades de nicho)
- r/relationship_advice, r/dating, r/organization, r/apps
- No spam: participar genuinamente, mencionar la app cuando sea relevante
- Post de lanzamiento en r/apps y r/startups

#### Product Hunt
- Lanzar cuando la app esté estable con ~50 usuarios reales de beta
- Campaña de 1 semana antes para conseguir upvoters
- Ofrecer 3 meses de Plan Duo gratis para early adopters de PH

#### SEO / Blog (largo plazo)
- Artículos tipo: "Las mejores apps para parejas 2026", "Cómo llevar las finanzas en pareja"
- Comparativas vs competidores (Couple App, Between, Tully)

#### App Store Optimization (ASO)
- Título: "OurTime — Nuestra Historia"
- Keywords: app para parejas, recuerdos compartidos, finanzas en pareja, diario de pareja
- Screenshots de alta calidad (usar las pantallas del design system actual)
- Rating inicial: activar el prompt de valoración a los 7 días de uso activo

### Estrategia de lanzamiento (primeros 90 días)

**Semana 1-2: Beta privada**
- Invitar ~20 parejas de contactos directos
- Recoger feedback con formulario de Google
- Objetivo: encontrar el "momento ajá" de retención

**Semana 3-6: Soft launch**
- Publicar en Product Hunt, Reddit, grupos de WhatsApp
- Crear cuenta de Instagram/TikTok con primeros 5 videos
- Objetivo: 100 usuarios registrados

**Semana 7-12: Paid experiment**
- Presupuesto inicial: $50-100 en Meta Ads con targeting "relaciones, parejas, 20-35 años, ES/MX/CO"
- Test A/B de dos creativos: emocional ("sus recuerdos, juntos") vs funcional ("plan tu próxima cita")
- Objetivo: CPA < $2, conversion rate > 15%

---

## 5. Competidores y diferenciadores

| App | Precio | Fortaleza | Debilidad vs OurTime |
|---|---|---|---|
| Between | $4.99/mes | Foto compartida | Sin planificación, sin finanzas |
| Couple | $5.99/mes | Chat privado | UI anticuada, sin momentos |
| Tully | Gratis/Freemium | Finanzas pareja | Sin galería, sin planes |
| Notion | Gratis/$8 | Flexible | Sin magia, sin contexto emocional |

**OurTime gana** cuando el usuario quiere que la app "entienda" que son dos personas con una historia compartida, no solo usuarios con acceso a los mismos documentos.

---

## 6. Métricas clave a trackear desde el día 1

- **DAU/MAU ratio** — objetivo > 25% (indica hábito)
- **Stories creadas por usuario** — si >1, señal de expansión
- **Fotos subidas en 30 días** — proxy de engagement emocional
- **Conversión Gratis → Duo** — objetivo 5-10% en mes 3
- **Churn mensual** — objetivo < 8%

---

## 7. Pasos inmediatos (esta semana)

1. Registrar dominio `ourtime.app` o similar
2. Crear página de landing simple (waitlist + "Qué es OurTime" + screenshots)
3. Redactar Términos de Uso y Política de Privacidad (usar Iubenda o similar para la primera versión)
4. Crear cuenta @ourtime.app en Instagram y TikTok
5. Integrar Stripe o RevenueCat para pagos (antes de escalar)
6. Desplegar la app en Vercel o Cloudflare Pages con dominio real

---

## 8. Proyección de ingresos (conservadora)

| Mes | Usuarios | Conversión | MRR |
|---|---|---|---|
| 1 | 100 | 5% | $20 |
| 3 | 500 | 8% | $160 |
| 6 | 2,000 | 10% | $800 |
| 12 | 8,000 | 12% | $3,800 |

Estos números asumen crecimiento orgánico. Con $100/mes en paid ads desde el mes 3, se multiplica x2-3.

---

*Este plan asume un equipo de 1-2 personas. El stack actual (React PWA + Supabase) es suficiente para las primeras 10,000 historias sin cambios de infraestructura.*
