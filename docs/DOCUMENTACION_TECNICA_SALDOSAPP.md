# Documentacion Tecnica del Sistema - SaldosApp

Fecha de analisis: 2026-03-04  
Repositorio analizado: `c:\Fanasa\saldosapp`

## Alcance
Este documento se construye a partir del codigo fuente disponible en este repositorio (frontend Angular).  
No incluye backend ni esquema SQL real, por lo que:

- Los endpoints se documentan desde los servicios frontend.
- El modelo de base de datos se documenta como modelo inferido por contratos (`*.model.ts`) y payloads.

---

## 1. Arquitectura del sistema

### 1.1 Tipo de arquitectura
- Cliente web `SPA` en Angular 12.
- Arquitectura modular por dominio funcional:
  - `auth`
  - `admin`
  - `agente`
  - `core`
  - `shared`
- Integracion con APIs REST externas:
  - `SaldosApi`
  - `SaldosAuthenticator`
  - `ServiceLogAD` (autenticacion AD)
- PWA habilitada (Service Worker + manifiesto).

### 1.2 Capas logicas
- Capa de presentacion:
  - Componentes y plantillas de `src/app/**/pages`.
- Capa de aplicacion/flujo:
  - Guards (`AuthGuard`, `RoleGuard`), routing y `UiService`.
- Capa de integracion:
  - `SaldosService`, `AuthService`.
- Capa de modelo:
  - Interfaces en `src/app/core/shared`.

### 1.3 Diagrama simplificado
```text
Usuario
  |
  v
Angular App (Auth/Admin/Agente)
  |            |              |
  |            |              +--> Geolocation API (browser)
  |            +--> DataTables/XLSX/Leaflet (UI y carga de datos)
  |
  +--> AuthService --> ServiceLogAD/Auth/Ingresar
  |
  +--> SaldosService --> SaldosAuthenticator/LoginUser
  |                  --> SaldosApi/*
  |
  +--> LocalStorage (sesion, rol, ubicaciones, grupo)
```

### 1.4 Navegacion y control de acceso
- Rutas raiz:
  - `/auth/*`
  - `/admin/*` (guard: `AuthGuard + RoleGuard`, roles `ADMIN|AGENTE`)
  - `/agente/*` (guard: `AuthGuard + RoleGuard`, rol `GERENTE`)
- Resolucion de rol:
  - Login AD -> consulta de rol en `SaldosAuthenticator/LoginUser`.
  - Mapeo de `id_rol` a rol de app (`ADMIN|GERENTE|AGENTE`).

---

## 2. Modulos principales

## 2.1 Auth
- Pantalla de login corporativo.
- Obtiene usuario por AD y despues perfil funcional.
- Guarda sesion y metadatos en `localStorage`:
  - `app_user`, `id_rol`, `id_grupo`, `ubicacion`, `useridbd`, `nombre_rol`.

## 2.2 Core
- `AuthService`: login/logout/estado de sesion.
- `SaldosService`: cliente REST principal del dominio.
- Guards:
  - `AuthGuard`: exige sesion.
  - `RoleGuard`: valida acceso por rol esperado.
- Servicios de soporte:
  - `UpdateService` (actualizacion PWA)
  - `PwaInstallService`

## 2.3 Admin
Submodulos funcionales:
- Dashboard de carga de cartera:
  - Carga Excel/CSV, mapeo y envio por lotes.
- Cuentas sin incidencias.
- Cuentas con incidencias.
- Detalle/seguimiento de incidencia (`fomrAdmin/:id/:flag`):
  - Evidencia, firma, estatus, comentarios, geolocalizacion en mapa.
- Configuracion:
  - Usuarios, roles, ubicaciones.
- Clientes:
  - Carga de archivo de clientes.
  - KPIs por gerente/periodo.
- Carga de estados de cuenta (`/admin/cargac`).

## 2.4 Agente
Submodulos funcionales:
- Dashboard de cuentas asignadas por gerente.
- Captura de confirmacion (`fomrAgente/:id`):
  - OTP por correo.
  - Cuestionario (P1..P5 + razones).
  - Firma digital en canvas.
  - Geolocalizacion (lat/long).
  - Folio de soporte segun tipo de incidencia.
- Consulta de estado de cuenta paginado (`edocuenta/:idcuenta`).

## 2.5 Shared
- `Navbar`, `Header`, `SpinOverlay`, `SignaturePad`, `AppUpdateAvailable`.
- `UiService` centraliza estado visual de menus/encabezado/sidebar.

---

## 3. Flujo de datos

## 3.1 Flujo de autenticacion y contexto
1. Usuario envia credenciales en login.
2. `AuthService.login()` consume `ServiceLogAD/Auth/Ingresar`.
3. Con nombre de usuario resuelto, frontend consume `SaldosAuthenticator/LoginUser`.
4. Se guardan rol/grupo/ubicaciones en `localStorage`.
5. `RoleGuard` autoriza modulo destino (`/admin` o `/agente`).

## 3.2 Flujo de carga de cartera (Admin)
1. Usuario selecciona archivo Excel/CSV.
2. Frontend parsea con `xlsx` y mapea columnas a `CuentasSaldosCreateRequest`.
3. Divide en lotes de 200 registros.
4. Envia lotes a `POST /Insert`.
5. Refresca vistas operativas (cuentas con/sin incidencia).

## 3.3 Flujo de captura operativa (Agente)
1. Dashboard consulta cuentas por gerente (`/GetByGerenteZona`).
2. Agente abre una cuenta (`/GetById` + `/GetByIdPreguntas` + firma previa).
3. Solicita OTP por correo (`/SendMailKit`) y confirma.
4. Captura cuestionario + firma + ubicacion.
5. Si hay desviaciones, genera folio (`/GetLastFolioNumber`) y clasifica incidencia.
6. Guarda respuestas (`/InsertPreguntar`) y marca proceso (`/UpdateCuentas`).

## 3.4 Flujo de seguimiento de incidencia (Admin/Backoffice)
1. Lista cuentas por estado (`sumFlag`) y por perfil (admin/cobranza/credito/gerente).
2. Abre detalle de cuenta/incidencia.
3. Consulta evidencia (`/GetEvidencias`) y firma (`/GetFirma`).
4. Actualiza estatus/comentarios/evidencia (`/UpdateCuenta`).

## 3.5 Flujo de estado de cuenta
1. Carga de archivo por admin (`/InsertEdoCuenta`).
2. Consulta paginada por cuenta Oracle desde agente (`/GetByCuentaOraclePaged/{cuenta}/{page}/{size}`).

---

## 4. Endpoints API

Base URL productiva configurada:
- `https://aplicacion.fanasa.com/SaldosService/SaldosApi`
- `https://aplicacion.fanasa.com/SaldosService/SaldosAuthenticator`
- `https://aplicacion.fanasa.com/ServiceLogAD/Auth/Ingresar`

## 4.1 Autenticacion y autorizacion
- `POST /ServiceLogAD/Auth/Ingresar`
  - Login AD (usuario/clave).
- `POST /SaldosAuthenticator/LoginUser`
  - Consulta rol, grupo, ubicaciones e identificadores de usuario.

## 4.2 Cuentas y cartera
- `GET /SaldosApi/GetRegistros`
- `GET /SaldosApi/GetById/{idCuenta}`
- `POST /SaldosApi/GetByGerenteZona`
- `POST /SaldosApi/Insert`
- `POST /SaldosApi/UpdateCuentas`
- `POST /SaldosApi/actualizar-procesado`

## 4.3 Cuestionario e incidencias
- `GET /SaldosApi/GetByIdPreguntas/{idCuenta}`
- `GET /SaldosApi/GetLastFolioNumber/{idCuenta}`
- `POST /SaldosApi/InsertPreguntar`
- `POST /SaldosApi/UpdateCuenta`
- `GET /SaldosApi/GetCuentaConPreguntasBySumFlag/{idCuenta}/{flag}`
- `GET /SaldosApi/GetCuentaConPreguntasBySumFlagAll/{flag}/{ubicacion}`
- `GET /SaldosApi/GetByGerenteZonaSumFlag/{gerente}/{flag}`
- `GET /SaldosApi/GetByGerenteZonaSumFlag/{gerente}/{flag}/{ubicacion}`
- `GET /SaldosApi/GetCuentasCredito/{ubicacion}/{idincidencia}`
- `GET /SaldosApi/GetCuentasCobranza/{ubicacion}/{idincidencia}`

## 4.4 Evidencias, firma y notificaciones
- `GET /SaldosApi/GetFirma/{cuentaId}` (blob)
- `GET /SaldosApi/GetEvidencias/{cuentaId}` (blob/response)
- `POST /SaldosApi/SendMailKit`

## 4.5 Clientes y estado de cuenta
- `POST /SaldosApi/ClientRegister`
- `POST /SaldosApi/ClientRegisterFile` (multipart)
- `GET /SaldosApi/GetCuentasResponse/{ubicacion}`
- `POST /SaldosApi/InsertEdoCuenta`
- `GET /SaldosApi/GetByCuentaOraclePaged/{cuenta}/{page}/{pageSize}`

## 4.6 Catalogos y seguridad administrativa
- `GET /SaldosApi/GetUsuarios`
- `POST /SaldosApi/CreateUsuario`
- `POST /SaldosApi/UpdateUsuario/{id}`
- `DELETE /SaldosApi/{id}` (usuario)
- `GET /SaldosApi/GetRoles`
- `GET /SaldosApi/GetUbicaciones`
- `GET /SaldosApi/{id}` (catalogo: endpoint generico)
- `POST /SaldosApi` (crear ubicacion)
- `POST /SaldosApi/{id}` (actualizar ubicacion)
- `POST /SaldosApi/{id}/desactivar`

Nota: Existen endpoints genericos (`/{id}`) usados para distintos recursos, lo cual requiere validacion de contrato backend.

---

## 5. Modelo de base de datos (inferido)

## 5.1 Entidades principales

### A) `cuentas_saldos`
Campos inferidos (resumen):
- PK: `uiRow`
- Identidad de cuenta: `sCuentaOracle`, `sCliente`, `sNombreCorto`
- Cartera: `dTotalCartera`, `dPorVencer`, `dVencido`, `dVencido7Dias`, `dVencido8a14Dias`, `dVencido15a21Dias`, `dVencido22a28Dias`
- Credito/pago: `dLimiteCredito`, `dRetencionCredito`, `dTotalCredito`, `dPagosNoAplicados`
- Organizacion: `sSucursal`, `sZona`, `sGerenteZona`, `sTerritorioVentas`, etc.
- Contacto: `sCorreo`, `sTelefono`
- Control: `bProcesado`, `periodo_inicio`, `periodo_fin`, `dtCreate`, `dtModificacion`, `susuario_registra`

### B) `cuentas_preguntas` / `incidencias`
Campos inferidos:
- PK tecnica: `pp_uiRow` (en respuestas)
- FK cuenta: `id` / `uiRowCuenta` / `pp_uiRowCuenta`
- Respuestas: `p1..p5`, `p1_razon..p5_razon`
- Soporte: `comentarios`, `evidencia`, `firma`
- Trazabilidad: `usuario_registra`, `usuario_actualiza`, `fecha_creacion_incidencia`, `fecha_solucion`
- Control de atencion: `estatus`, `id_estatus_cuenta`, `tipo_incidencia`
- Seguridad/validacion: `otp`, `folio_registro`, `folio_soporte`
- Geolocalizacion: `lat`, `longi`

### C) `usuarios`
Campos inferidos:
- PK: `uiRow`
- Identidad: `uiIdUsuario`, `nombreUsario`, `nombre_usuario_ad`, `id_usuario_excel`
- Seguridad: `password` (registro), `correo`
- Autorizacion: `id_rol`, `id_grupo`
- Cobertura: `ubicacion` (string con IDs separados por coma)
- Auditoria: `dtCreate`, `dtModificacion`

### D) `roles`
- `idRol`, `nombre`

### E) `ubicaciones`
- `idUbicacion`, `nombreUbicacion`, `activo`, `fechaCreacion`

### F) `registro_estado_cuenta`
- PK: `id_registro`
- Claves de negocio: `cuenta_oracle`, `cliente`, `documento`
- Fechas y vencimiento: `fecha`, `fecha_vto`, `dias_vto`
- Importes: `importe_original`, `iva`, `saldo_debido`
- Metadatos: `sucursal`, `cobrador`, `perfil`, `origen`, `status`

### G) `resumen_clientes_gerente` (vista o agregado)
- `gerente`, `periodo`, `mes`, `clientes_asignados`, `clientes_auditados`, `clientes_restantes`, `porcentaje`, `cuota_mensual`

## 5.2 Relaciones inferidas
- `cuentas_saldos (1) -> (N) cuentas_preguntas`
- `usuarios (N) -> (1) roles`
- `usuarios (N) <-> (N) ubicaciones` (en frontend esta desnormalizado en CSV)
- `cuentas_saldos (1) -> (N) registro_estado_cuenta` por `cuenta_oracle`

---

## 6. Roles de usuario

Roles de aplicacion (router/guards):
- `ADMIN` (id_rol=1)
- `GERENTE` (id_rol=2)
- `AGENTE` (id_rol=3 o 4)

Roles operativos mostrados en UI:
- `Administrador` (id_rol=1)
- `Gerente de Zona` (id_rol=2)
- `Comercial` (id_rol=3)
- `Cartera` (id_rol=4)

Agrupacion adicional:
- `id_grupo=1` (flujo de credito)
- `id_grupo=2` (flujo de cobranza)

Matriz resumida de acceso:
- `ADMIN`
  - Acceso completo a `/admin`.
  - Carga cartera, carga estados de cuenta, clientes, incidencias, configuracion.
- `AGENTE` (comercial/cartera)
  - Acceso a `/admin` con menu restringido segun UI y filtros por grupo.
  - Operacion en cuentas con/sin incidencia.
- `GERENTE`
  - Acceso a `/agente`.
  - Captura confirmaciones, OTP, firma, consulta estado de cuenta.

---

## 7. Casos de uso

## 7.1 CU-01 Iniciar sesion y enrutar por rol
- Actor: cualquier usuario.
- Resultado: acceso al modulo correspondiente.
- APIs: `Auth/Ingresar`, `LoginUser`.

## 7.2 CU-02 Cargar cartera mensual
- Actor: admin/backoffice.
- Resultado: alta masiva de cuentas y periodos.
- APIs: `POST /Insert`.

## 7.3 CU-03 Cargar estado de cuenta
- Actor: admin.
- Resultado: carga de movimientos para consulta paginada.
- APIs: `POST /InsertEdoCuenta`.

## 7.4 CU-04 Capturar confirmacion de cliente
- Actor: gerente.
- Resultado: respuestas P1..P5, OTP validado, firma, geolocalizacion.
- APIs: `GetById`, `GetByIdPreguntas`, `SendMailKit`, `InsertPreguntar`, `UpdateCuentas`.

## 7.5 CU-05 Generar folio de incidencia
- Actor: gerente.
- Resultado: folio por tipo de incidencia (credito/comercial).
- APIs: `GetLastFolioNumber`, `InsertPreguntar`.

## 7.6 CU-06 Consultar cuentas con/sin incidencia
- Actor: admin, cartera, comercial, gerente.
- Resultado: tablero filtrado por rol/grupo/ubicacion.
- APIs: `GetCuentaConPreguntasBySumFlag*`, `GetCuentasCredito`, `GetCuentasCobranza`, `GetByGerenteZonaSumFlag`.

## 7.7 CU-07 Dar seguimiento y cerrar incidencia
- Actor: admin/backoffice.
- Resultado: actualizacion de estatus/comentarios/evidencia.
- APIs: `GetEvidencias`, `GetFirma`, `UpdateCuenta`.

## 7.8 CU-08 Administrar usuarios y permisos
- Actor: admin.
- Resultado: alta/edicion de usuarios, roles, ubicaciones.
- APIs: `GetUsuarios`, `CreateUsuario`, `UpdateUsuario`, `GetRoles`, `GetUbicaciones`.

## 7.9 CU-09 Monitorear clientes por gerente
- Actor: admin.
- Resultado: KPIs por gerente y carga de clientes.
- APIs: `GetCuentasResponse/{ubicacion}`, `ClientRegisterFile`.

## 7.10 CU-10 Consultar estado de cuenta por cuenta Oracle
- Actor: gerente.
- Resultado: paginacion y detalle de movimientos financieros.
- APIs: `GetByCuentaOraclePaged`.

---

## 8. Riesgos y puntos criticos

## 8.1 Seguridad y control de acceso
- La sesion y rol dependen de `localStorage` del cliente.
- No se observa uso de JWT firmado ni expiracion validada en frontend.
- En `RoleGuard`, roles desconocidos caen por defecto a `AGENTE` (riesgo de autorizacion incorrecta).
- El control de permisos es principalmente de cliente; requiere enforcement estricto en backend.

## 8.2 Configuracion de entornos
- `SaldosService` y `UpdateService` importan `environment.prod` directamente.
- Riesgo: en modo desarrollo se podrian consumir endpoints productivos.

## 8.3 Integridad de datos y contratos
- Existen endpoints genericos `/{id}` reutilizados para recursos distintos (usuario/ubicacion).
- Ubicaciones de usuario se manejan como CSV en un solo campo (`"1,2,3"`), lo que complica integridad relacional.
- Duplicidad de metodos en frontend (`consultaporidecuentasinincidenciaAll` y `...AllD`).

## 8.4 Riesgos operativos de UI
- Varias pantallas fuerzan `location.reload()` tras navegar con query param `reloaded`.
- Uso intensivo de DataTables/jQuery dentro de Angular (riesgo de lifecycle/memoria).
- Cargas grandes se parsean completas en navegador antes de enviar por lotes (memoria/latencia).

## 8.5 Riesgos funcionales
- Version hardcodeada en login (`v1.0.15`) no coincide con `environment.appVersion` (`1.0.8`).
- Componente de actualizacion PWA escucha evento distinto al emitido y tiene metodo `refresh` no invocado correctamente.
- Flujo OTP y validacion deben ser verificados en backend para evitar bypass por cliente.

## 8.6 Dependencias externas
- Geocodificacion con Nominatim/OpenStreetMap desde cliente puede fallar por limites de uso, latencia o bloqueo.

## 8.7 Recomendaciones tecnicas prioritarias
1. Centralizar autenticacion en token firmado con expiracion y validacion backend.
2. Corregir import de `environment` para respetar build `development/production`.
3. Eliminar reloads forzados y mover tablas a componentes Angular nativos.
4. Normalizar relacion usuario-ubicacion en backend (tabla puente).
5. Homologar versionado (UI vs environment) y flujo de actualizaciones PWA.
6. Revisar matriz de roles por defecto en guard para evitar asignaciones permisivas.

