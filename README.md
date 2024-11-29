# Proyecto de Revisión de Código de Tareas

Este proyecto está diseñado para automatizar la revisión del código de las tareas indicadas, utilizando repositorios alojados en GitHub. Proporciona herramientas para analizar y evaluar las contribuciones de los estudiantes o colaboradores.

## Requisitos Previos

1. **Node.js**: Asegúrate de tener Node.js instalado en tu sistema.
2. **Token de GitHub**:
   - Necesitarás un token de acceso personal de GitHub con los permisos suficientes para acceder a los repositorios.
   - Los permisos mínimos recomendados son:
     - `repo`: Para acceder a repositorios privados, si es necesario.
     - `read:org`: Para obtener información de los colaboradores (si corresponde).
   - Puedes generar un token desde tu cuenta de GitHub en la sección [Developer Settings](https://github.com/settings/tokens).

## Configuración

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu_usuario/tu_repositorio.git
   cd tu_repositorio
