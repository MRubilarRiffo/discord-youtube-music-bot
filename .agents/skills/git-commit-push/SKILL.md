---
name: git-commit-push
description: >-
  Procedimiento obligatorio para subir cambios a GitHub en este proyecto.
  Usar siempre que el usuario pida hacer commit, push, subir cambios, o
  actualizar el repositorio. Incluye el formato de mensaje de commit
  estructurado por impacto, bump de version en package.json, ejecucion
  de tests y validacion de archivos sensibles antes del push.
---

# Git Commit & Push — Procedimiento del Proyecto

Este skill define el flujo completo y obligatorio para subir cambios al repositorio de GitHub.

---

## Checklist Obligatorio (seguir en orden)

### 1. Revisar cambios

```bash
git status
git diff
```

- Identificar **todos** los archivos modificados, nuevos o eliminados.
- Clasificar los cambios por área (comandos, reproductor, pruebas, configuración, documentación).

### 2. Ejecutar tests

```bash
npm test
```

- **NUNCA** hacer commit si los tests fallan.
- Anotar el total de tests pasados para mencionarlo en el mensaje de commit.

### 3. Verificar archivos sensibles

Antes de hacer `git add`, confirmar que los siguientes archivos **NO se subirán**:

| Archivo | Debe estar en `.gitignore` |
|---|---|
| `.env` | ✅ Sí |
| `package-lock.json` | ✅ Sí |
| `node_modules/` | ✅ Sí |

Verificar con:

```bash
git check-ignore -v .env package-lock.json
```

### 4. Bump de versión en `package.json`

> [!CAUTION]
> **OBLIGATORIO en CADA commit.** Este paso NO se puede omitir bajo ninguna circunstancia.

Incrementar la versión en `package.json` siguiendo **Semantic Versioning**:

| Tipo de cambio | Ejemplo | Bump |
|---|---|---|
| `feat:` (nueva funcionalidad) | Nuevo comando, nueva feature | **MINOR** (1.0.0 → 1.1.0) |
| `fix:` (corrección de bug) | Fix de race condition, bug fix | **PATCH** (1.1.0 → 1.1.1) |
| `refactor:` (refactorización sin cambio funcional) | Migración de API, renombrado | **PATCH** (1.1.1 → 1.1.2) |
| Breaking change | Cambio de arquitectura mayor | **MAJOR** (1.1.2 → 2.0.0) |

### 5. Stage de archivos

```bash
git add .
git status
```

- Verificar que `.env` y `package-lock.json` **NO aparecen** en los archivos staged.

### 6. Escribir mensaje de commit

El mensaje debe seguir **exactamente** este formato estructurado:

```text
<tipo>: <resumen conciso en español, sin tildes>

--- IMPACTO ALTO ---

[<Area>] <Titulo descriptivo>
- Descripcion del cambio principal sin tildes.
- Otro cambio relevante.

[<Area>] <Otro titulo si aplica>
- Descripcion.

--- IMPACTO MEDIO ---

[<Area>] <Titulo>
- Descripcion.

--- IMPACTO BAJO ---

[<Area>] <Titulo>
- Descripcion.
```

#### Reglas del mensaje:

- **Idioma**: Español, **sin tildes ni caracteres especiales** (ñ sí se permite).
- **Tipo**: Usar prefijos convencionales (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`).
- **Secciones de impacto**: Agrupar cambios por nivel de impacto (ALTO, MEDIO, BAJO).
- **Áreas entre corchetes**: Ejemplos: `[Reproductor & Audio]`, `[Comandos Slash]`, `[Pruebas]`, `[General]`, `[Documentacion]`, `[Interacciones & Eventos]`, `[Despliegue & Configuracion]`.
- **Bump de version**: Siempre mencionar el incremento de versión en la sección `--- IMPACTO BAJO ---` bajo `[General] Bump de version`.
- **Tests**: Mencionar el resultado de la suite de pruebas en `--- IMPACTO MEDIO ---` o `--- IMPACTO BAJO ---`.

### 7. Commit y Push

```bash
git commit -F <ruta_archivo_mensaje>
git push origin main
```

### 8. Verificación final

```bash
git status
```

- Confirmar: `nothing to commit, working tree clean`
- Confirmar: `Your branch is up to date with 'origin/main'`

---

## Ejemplo Real de Commit

```text
fix: control de transicion manual y prevencion de saltos involuntarios en reproductor de audio

--- IMPACTO ALTO ---

[Reproductor & Audio] Bandera de transicion manual y proteccion contra eventos Idle espurios
- Implementacion de la bandera `isManualTransition` en `GuildQueue` para marcar cambios iniciados por `previous()` y `skipTo()`.
- Detencion segura del reproductor de audio al cambiar de pista manualmente, ignorando el evento Idle residual.

--- IMPACTO MEDIO ---

[Pruebas] Suite de pruebas unitarias
- Adicion de nueva prueba unitaria para validar que `previous()` activa correctamente `isManualTransition`.
- Verificacion y ejecucion de 39 pruebas automatizadas con 100% de exito.

--- IMPACTO BAJO ---

[General] Bump de version
- Incremento de version a v1.1.1 en package.json.
```

---

## Errores Comunes a Evitar

> [!WARNING]
> - **Olvidar el bump de versión**: Es el error más frecuente. Verificar SIEMPRE antes del commit.
> - **Subir `.env`**: Contiene tokens y claves privadas. Jamás debe aparecer en staged.
> - **Subir `package-lock.json`**: Este proyecto no lo versiona. Verificar que está en `.gitignore`.
> - **Hacer commit con tests fallidos**: Ejecutar `npm test` siempre antes del commit.
> - **Tildes en el mensaje de commit**: Usar solo ASCII (sin acentos) para compatibilidad.
