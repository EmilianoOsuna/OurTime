# OurTime — Plan de Publicacion en Google Play Store

> Fecha: Julio 2026 · App: Android via Capacitor 8.x · Developer: Persona fisica

---

## FASE 1: SEGURIDAD Y LIMPIEZA DEL PROYECTO

### Secrets y credenciales
- [ ] Verificar que `.env` NO esta tracked por git (`git ls-files .env`)
- [ ] Si esta tracked: `git rm --cached .env` y hacer commit
- [ ] Rotar todas las keys expuestas: `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VITE_GOOGLE_CLIENT_ID`
- [ ] Verificar que `android/app/google-services.json` no esta tracked
- [ ] Verificar que `VAPID_KEYS.txt` no esta tracked
- [ ] Agregar `android/app/build/` y `android/build/` a `.gitignore` si no estan

### Build de release con minificacion
- [ ] Habilitar `minifyEnabled true` en `android/app/build.gradle` (linea 21)
- [ ] Habilitar `shrinkResources true` en `android/app/build.gradle`
- [ ] Verificar que `proguard-rules.pro` existe y tiene reglas para Capacitor/WebView
- [ ] Probar build de release localmente antes de subir
- [ ] Cambiar `android:usesCleartextTraffic="true"` a `false` en AndroidManifest.xml

### Seguridad de la app
- [ ] Auditar que todas las tablas de Supabase tienen RLS habilitado
- [ ] Auditar que no hay Edge Functions con SQL injection
- [ ] Verificar que la `supabase anon key` no expone operaciones privilegiadas
- [ ] Validar parametros de deep links (`ourtime://open?...`) contra inyeccion
- [ ] Agregar Content-Security-Policy en `index.html`

---

## FASE 2: DOCUMENTACION LEGAL

### Cuenta de desarrollador
- [ ] Registrar en Google Play Console: https://play.google.com/console
- [ ] Pago de $25 USD (tarjeta personal)
- [ ] Completar verificacion de identidad con INE/pasaporte
- [ ] Completar verificacion de direccion con factura de servicios reciente
- [ ] Configurar cuenta bancaria para recibir pagos de Stripe
- [ ] Llenar formulario W-8BEN (impuestos, para personas fuera de US)

### Documentos legales (hostear en URL publica, ej. ourtime.app/privacy)
- [ ] Crear Politica de Privacidad que cubra:
  - [ ] Datos recopilados: email, nombre, fotos, ubicacion, calendario
  - [ ] Como se usan los datos (Supabase, Stripe, Google, FCM)
  - [ ] Derechos del usuario (acceso, eliminacion, portabilidad)
  - [ ] Contacto del responsable (tu nombre/email)
  - [ ] Cumplimiento GDPR/CCPA basico
- [ ] Crear Terminos de Servicio que cubran:
  - [ ] Uso aceptable de la app
  - [ ] Propiedad del contenido del usuario
  - [ ] Limitacion de responsabilidad
  - [ ] Politica de cancelacion y reembolsos
  - [ ] Jurisdiccion aplicable
- [ ] Crear Declaracion de Permisos para Play Console:
  - [ ] Justificar permiso de CAMARA (fotos de recuerdos)
  - [ ] Justificar permiso de UBICACION (planes con lugar)
  - [ ] Justificar permiso de ALMACENAMIENTO (galeria compartida)
  - [ ] Justificar permiso de NOTIFICACIONES (recordatorios de planes)
- [ ] Hostear documentos en URL publica (ourtime.app/privacy, ourtime.app/terms)

### Consentimiento en la app
- [ ] Agregar checkbox de aceptacion de Terminos y Privacidad en pantalla de registro
- [ ] Agregar enlace a Politica de Privacidad en registro y login
- [ ] Agregar enlace a Terminos de Servicio en registro y login
- [ ] Implementar flujo de eliminacion de cuenta y datos permanentes
- [ ] Almacenar consentimiento con timestamp en la BD (tabla `user_consents`)

---

## FASE 3: BUILD Y TESTING ANDROID

### Keystore y signing
- [ ] Generar keystore de release: `keytool -genkey -v -keystore ourtime-release.keystore -alias ourtime -keyalg RSA -keysize 2048 -validity 10000`
- [ ] Mover keystore a lugar seguro (fuera del repo)
- [ ] Configurar `signingConfigs` en `android/app/build.gradle`
- [ ] Configurar `buildTypes.release.signingConfig` para usar el keystore
- [ ] Guardar contraseña del keystore en lugar seguro
- [ ] Opcion: Habilitar Play App Signing (Google gestiona la key de signing)

### Build del AAB
- [ ] Ejecutar `npm run cap:build` (web build + copy a android)
- [ ] Abrir Android Studio con `npm run cap:open`
- [ ] Build > Generate Signed Bundle / APK > Android App Bundle
- [ ] Verificar que el AAB genera correctamente
- [ ] Verificar tamanho del AAB (ideal < 50MB)
- [ ] Probar la APK generada en al menos 3 dispositivos reales

### Testing en dispositivos reales
- [ ] Probar en dispositivo Android con API 24 (minimo soportado)
- [ ] Probar en dispositivo Android con API 34+ (target actual)
- [ ] Probar login con email/password
- [ ] Probar login con Google Sign-In
- [ ] Probar creacion de Story
- [ ] Probar invitacion de miembro via codigo
- [ ] Probar subida de fotos
- [ ] Probar chat en tiempo real
- [ ] Probar notificaciones push
- [ ] Probar deep links (`ourtime://open?shortcut=newplan`)
- [ ] Probar offline behavior (sin conexion)
- [ ] Probar orientacion portrait/landscape
- [ ] Verificar que el splash screen se muestra correctamente
- [ ] Verificar que el widget funciona
- [ ] Medir tiempo de cold start (< 3s objetivo)

### Monitoreo de crashes
- [ ] Integrar Firebase Crashlytics en el proyecto
- [ ] Verificar que Crashlytics reporta en tiempo real
- [ ] Configurar alertas de crash rate > 1%

---

## FASE 4: GOOGLE PLAY CONSOLE CONFIGURATION

### Crear la app
- [ ] Crear nueva app en Play Console (package: `com.ourtime.app`)
- [ ] Seleccionar "Aplicacion" > "App para telefono"
- [ ] Configurar titulo: "Our Time - Parejas" (max 30 chars)
- [ ] Configurar nombre corto: "OurTime" (max 50 chars)

### Listing de la tienda
- [ ] Subir icono de la app (512x512 PNG, ya existe en `public/pwa-512x512.png`)
- [ ] Crear feature graphic (1024x500 JPG/PNG)
- [ ] Tomar/minimamente 4 screenshots (formato 9:16, resolucion 1080x1920 o superior):
  - [ ] Dashboard / Historia principal
  - [ ] Calendario compartido
  - [ ] Galeria de recuerdos
  - [ ] Chat en tiempo real
  - [ ] (Opcional) Flujo de onboarding
  - [ ] (Opcional) Presupuesto compartido
- [ ] Escribir descripcion corta (max 80 chars):
  Ej: "Planes, recuerdos y finanzas para parejas, amigos y familias"
- [ ] Escribir descripcion completa (max 4000 chars):
  - [ ] Que es OurTime
  - [ ] Funciones principales (calendario, galeria, chat, finanzas)
  - [ ] Tipos de historias (pareja, amigos, familia)
  - [ ] Planes y precios (Gratis, Duo $3.99/mes, Familia $6.99/mes)
  - [ ] Seguridad y privacidad
  - [ ] Contacto de soporte
- [ ] Seleccionar categoria: "Relaciones" o "Estilo de vida"
- [ ] Agregar subcategorias si aplica
- [ ] Configurar etiquetas de contenido (IARC questionnaire):
  - [ ] Completar clasificacion de edad
  - [ ] Declarar si contiene compras in-app
  - [ ] Declarar si recopila datos personales
  - [ ] Declarar si contiene contenido para adultos

### Configuracion tecnica
- [ ] Configurar track interno (testing)
- [ ] Configurar track cerrado (beta testers, max 100)
- [ ] Configurar track abierto (publico, despues de testing)
- [ ] Agregar permisos sensibles en Play Console:
  - [ ] Declarar uso de CAMARA
  - [ ] Declarar uso de UBICACION
  - [ ] Declarar uso de ALMACENAMIENTO
- [ ] Configurar politica de privacidad (URL)
- [ ] Configurar contacto de soporte (email)
- [ ] Crear cuenta de tester para Google (email propio o de prueba)

### Seguridad y aprobacion
- [ ] Completar seccion "Seguridad y aprobacion" en Play Console
- [ ] Declarar tipo de encriptacion de datos
- [ ] Declarar si la app usa VPN o proxy
- [ ] Declarar si la app accede a datos de terceros
- [ ] Declarar si la app monitorea dispositivos
- [ ] Enviar app para revision (puede tardar hasta 7 dias)

---

## FASE 5: LANZAMIENTO Y POST-LANZAMIENTO

### Lanzamiento gradual
- [ ] Subir AAB a track interno
- [ ] Verificar que la revision de Play Console se aprueba
- [ ] Probar la app instalada desde Play Store en track interno
- [ ] Mover a track cerrado (invitar 10-20 testers de confianza)
- [ ] Recoger feedback durante 1-2 semanas
- [ ] Mover a track abierto (publico)
- [ ] Monitorear metricas durante 7 dias minimos

### Metricas de post-lanzamiento
- [ ] Monitorear crash rate en Play Console (objetivo: < 1.09%)
- [ ] Monitorear ANR rate (objetivo: < 0.47%)
- [ ] Monitorear rating de la app (objetivo: >= 4.0 estrellas)
- [ ] Responder a reviews negativas dentro de 48 horas
- [ ] Monitorear DAU/MAU en Supabase
- [ ] Monitorear tasa de conversion Gratis -> Duo

### Optimizacion continua (ASO)
- [ ] Analizar keywords en Play Console
- [ ] Actualizar screenshots si la UI cambia
- [ ] Actualizar descripcion con nuevas features
- [ ] Experimentar con diferentes titulos
- [ ] Activar prompt de valoracion a los 7 dias de uso activo

---

## FASE 6: CI/CD Y AUTOMATIZACION (post-lanzamiento)

### Build automatizado
- [ ] Configurar GitHub Actions para build automatico
- [ ] Configurar Fastlane para sign + upload a Play Console
- [ ] Automatizar incremento de versionCode
- [ ] Configurar Firebase App Distribution para testing interno

### Monitoreo automatizado
- [ ] Configurar alertas de crash rate en Firebase
- [ ] Configurar alertas de ANR en Firebase
- [ ] Configurar dashboard de metricas en Supabase
- [ ] Configurar alertas de uso de storage (Supabase)

---

## CHECKLIST FINAL PRE-SUBIDA

- [ ] AAB generado con R8 habilitado
- [ ] Keystore de release configurado
- [ ] `usesCleartextTraffic="false"` en manifest
- [ ] Todos los secrets fuera del repo
- [ ] Politica de Privacidad publicada en URL publica
- [ ] Terminos de Servicio publicados en URL publica
- [ ] Consentimiento de usuario implementado en la app
- [ ] Flujo de eliminacion de cuenta implementado
- [ ] Screenshots de alta calidad listos (min 4)
- [ ] Feature graphic listo (1024x500)
- [ ] Descripcion completa escrita (max 4000 chars)
- [ ] Permisos justificados en Play Console
- [ ] Cuenta de tester configurada
- [ ] Testing en 3+ dispositivos reales completado
- [ ] Crashlytics integrado y funcionando
- [ ] Deep links verificados
- [ ] Push notifications funcionando en device real
- [ ] App probada en API 24 y API 34+
- [ ] Cold start < 3 segundos

---

## TIMELINE ESTIMADO

| Fase | Duracion | Dependencias |
|------|----------|--------------|
| Fase 1: Seguridad | 2-3 dias | Ninguna |
| Fase 2: Legal | 5-7 dias | Fase 1 (URL para documentos) |
| Fase 3: Build y Testing | 3-5 dias | Fase 1 |
| Fase 4: Play Console | 2-3 dias | Fase 2 + Fase 3 |
| Fase 5: Lanzamiento | 1-2 semanas | Fase 4 aprobada |
| Fase 6: CI/CD | Post-lanzamiento | Fase 5 |
| **TOTAL** | **~3-4 semanas** | |

---

*Plan creado segun el estado actual del proyecto: Capacitor 8.x, React 19, Supabase, Stripe, targetSdk=36, versionCode 3, versionName 1.2.*
