# Actividad 1: Hilos y Simulación Concurrente

Esta actividad forma parte de la evaluación de la UT1 del módulo de Programación de Servicios y Procesos. Contiene dos ejercicios prácticos diseñados para evaluar tus conocimientos en programación concurrente utilizando hilos en Java.

## Ejercicio 1: Hilos con Nombres Personalizados

### Descripción
Crea tres clases (o una y crea tres instancias) que extiendan `Thread`. Cada clase imprimirá su nombre en cada iteración de un bucle que va de 1 a 5. Asigna nombres personalizados a los hilos, como "Hilo A", "Hilo B" y "Hilo C", en el constructor de cada clase. Lanza estos hilos desde el método `main` y verifica que los nombres de los hilos se imprimen de forma intercalada en la consola.

### Criterios de Evaluación
- **Estructura y uso de clases** (25%)
- **Implementación del bucle y salida** (25%)
- **Uso de `start()` y gestión de hilos** (25%)
- **Claridad y organización del código** (25%)

---

## Ejercicio 2: Simulación de un Juego de Dados con Executors

### Descripción
Implementa un programa que simule el lanzamiento de un dado utilizando tres hilos gestionados por un `ScheduledExecutorService`. Cada hilo debe generar un número aleatorio entre 1 y 6 cada segundo y almacenarlo en una lista. Después de 5 lanzamientos, imprime el valor acumulado por cada hilo y cierra el `ExecutorService`.

### Criterios de Evaluación
- **Uso adecuado de `ScheduledExecutorService`** (30%)
- **Implementación de la lógica del dado y acumulación de resultados** (30%)
- **Salida correcta al finalizar la ejecución** (20%)
- **Claridad y organización del código** (20%)

---

## Entrega

1. Crea un repositorio en GitHub y envía una invitación al usuario `iesjesus` (correo: `jesusmunoz@iescastelar.com`).
2. Asegúrate de seguir las rúbricas de evaluación al desarrollar cada ejercicio.
3. La entrega debe realizarse **el 8 de noviembre de 2024, de 8:20 a 9:40**.

---

## Ejecución

Ejecuta cada ejercicio desde la línea de comandos o utilizando un entorno IDE como IntelliJ IDEA o Eclipse.

```bash
javac Main.java
java Main
