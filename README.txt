LANZAMIENTO PARABÓLICO - VERSIÓN SIMPLE EN PYTHON

1. Qué es
   Simulación sencilla de un lanzamiento parabólico con fondo blanco.
   El usuario modifica la velocidad inicial y el ángulo para alcanzar un objetivo.

2. Cómo ejecutar en Windows
   - Instala Python 3.
   - Abre esta carpeta.
   - Haz doble clic en ejecutar.bat.

   También puedes abrir una terminal dentro de la carpeta y ejecutar:
   python -m pip install -r requirements.txt
   python main.py

3. Controles del programa
   - Velocidad inicial: cambia la magnitud del vector velocidad v0.
   - Ángulo: cambia la dirección del vector velocidad.
   - Lanzar: inicia la animación de la trayectoria parabólica.
   - Reiniciar: limpia el intento, el puntaje y devuelve el proyectil al punto inicial.

   La simulación inicia con el caso base: v0 = 14 m/s y ángulo = 45°.

4. Modelo matemático usado
   Componentes del vector inicial:
      Vx = v0 cos(theta)
      Vy = v0 sin(theta)

   Movimiento parabólico ideal:
      x = Vx t
      y = y0 + Vy t - (g t²)/2

   Eliminando el tiempo:
      y = y0 + x tan(theta) - [g x² / (2 v0² cos²(theta))]

5. Validación para la rúbrica
   El archivo evidencia_validacion.png y el reporte_validacion.txt ya están incluidos
   como respaldo de la validación con Python, NumPy y Matplotlib.

   Para volver a generarlos desde la terminal, usa:
      python main.py --validate

IMPORTANTE:
La bibliografía obligatoria de la rúbrica debe aparecer en la monografía y las diapositivas.
