
---

### **README.md for Activity 2 (Parte 2)**

Place this `README.md` in the `activity2/` directory.

```markdown
# Proyecto Práctico: Simulador de Procesamiento Concurrente

Este proyecto forma parte de la evaluación de la UT1 del módulo de Programación de Servicios y Procesos. Está diseñado para demostrar tu comprensión de la programación concurrente, la sincronización y el uso de Virtual Threads en Java.

## Objetivo

Implementar un simulador que gestione solicitudes de tareas concurrentes con dos enfoques:
1. Usando hilos tradicionales (`Thread`) con un pool de `ExecutorService`.
2. Usando Virtual Threads para la gestión concurrente.

---

## Instrucciones

### Paso 1: Configuración del ExecutorService
1. Implementa un `ExecutorService` que gestione las solicitudes en un pool de hilos.
2. Crea tareas personalizadas con tiempos de espera calculados según la suma de los dígitos de tu matrícula multiplicada por 10 segundos.

### Paso 2: Implementación de Hilos Tradicionales
1. Desarrolla una versión del proyecto utilizando hilos tradicionales (`Thread`) con el `ExecutorService`.

### Paso 3: Implementación de Virtual Threads
1. Desarrolla una segunda versión utilizando Virtual Threads para manejar las tareas concurrentemente.

### Paso 4: Comparación de Rendimiento
1. Genera un gráfico comparativo entre el tiempo de respuesta de las dos versiones.
2. Incluye capturas de pantalla o de texto que muestren la ejecución de cada versión.

---

## Criterios de Evaluación

| Criterio                            | Puntos |
|-------------------------------------|--------|
| Configuración de `ExecutorService`  | 10     |
| Implementación de Tareas Personalizadas | 10     |
| Uso de Hilos Tradicionales y Virtuales | 10     |
| Salida en Consola                   | 10     |
| Análisis Comparativo de Rendimiento | 10     |
| Documentación (`README.md`)         | 10     |
| Estructura y Organización del Código | 10     |
| Uso de Git y Entrega en GitHub      | 10     |

---

## Entrega

1. Sube el proyecto a un repositorio en GitHub en una rama propia con el formato: `feature/ev1ApellidosNombre` (por ejemplo, `feature/ev1MessiLionel`).
2. Incluye en la rama:
   - Archivos fuente de ambas versiones (hilos tradicionales y Virtual Threads).
   - Este archivo `README.md` con:
     - Resumen del proyecto.
     - Gráfico comparativo.
     - Capturas de pantalla de la ejecución.
3. Fecha límite: **8 de noviembre de 2024, hasta las 23:59**. Cada día de retraso penaliza 1 punto.

---

## Consejos

- Planifica tu tiempo y revisa los criterios de evaluación.
- Documenta tu código con comentarios explicativos.
- Estructura y organiza tu entrega para que sea clara y profesional.

