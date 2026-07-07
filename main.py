"""Simulación simple de lanzamiento parabólico.

Proyecto para Álgebra Lineal y Geometría Analítica.
Usa Tkinter para la interfaz y NumPy/Matplotlib para la validación.
"""

from __future__ import annotations

import math
import os
import sys
import tkinter as tk
from tkinter import ttk

import numpy as np


# --------------------------- Modelo matemático ---------------------------
# Datos elegidos para que el caso base (14 m/s, 45°) pase por el objetivo.
G = 9.8
P0 = (0.0, 1.0)                 # Punto inicial, en metros.
OBJETIVO = (18.0, 2.80)         # Centro del objetivo, en metros.
RADIO_OBJETIVO = 0.58
RADIO_PROYECTIL = 0.25
OBSTACULO = (8.0, 3.0, 0.55)    # x central, altura, ancho.
CASO_BASE_V = 14.0
CASO_BASE_ANGULO = 45.0

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RUTA_EVIDENCIA = os.path.join(BASE_DIR, "evidencia_validacion.png")
RUTA_REPORTE = os.path.join(BASE_DIR, "reporte_validacion.txt")


def componentes_velocidad(velocidad: float, angulo_grados: float) -> tuple[float, float]:
    """Devuelve las componentes horizontal y vertical de la velocidad inicial."""
    theta = math.radians(angulo_grados)
    return velocidad * math.cos(theta), velocidad * math.sin(theta)


def altura_en_x(x: float, velocidad: float, angulo_grados: float) -> float:
    """Evalúa y(x) al eliminar el tiempo de las ecuaciones paramétricas."""
    theta = math.radians(angulo_grados)
    return P0[1] + x * math.tan(theta) - (G * x * x) / (2 * velocidad * velocidad * math.cos(theta) ** 2)


def puntos_trayectoria(velocidad: float, angulo_grados: float, paso: float = 0.10) -> list[tuple[float, float]]:
    """Genera puntos de la parábola hasta que el proyectil toca el suelo."""
    vx, _ = componentes_velocidad(velocidad, angulo_grados)
    if vx <= 0:
        return []

    puntos: list[tuple[float, float]] = []
    x = 0.0
    while x <= 21.0:
        y = altura_en_x(x, velocidad, angulo_grados)
        if y < 0:
            break
        puntos.append((x, y))
        x += paso
    return puntos


# --------------------------- Validación NumPy/Matplotlib ---------------------------
def validar_modelo() -> tuple[str, str]:
    """Contrasta valores manuales del caso base con los obtenidos por Python."""
    # NumPy se usa intencionalmente para el cálculo y para graficar la evidencia.
    theta = np.deg2rad(CASO_BASE_ANGULO)
    vx = CASO_BASE_V * np.cos(theta)
    vy = CASO_BASE_V * np.sin(theta)
    t_objetivo = OBJETIVO[0] / vx
    x_vertice = vx * vy / G
    y_vertice = P0[1] + (vy * vy) / (2 * G)
    y_obstaculo = P0[1] + OBSTACULO[0] * np.tan(theta) - (G * OBSTACULO[0] ** 2) / (2 * CASO_BASE_V ** 2 * np.cos(theta) ** 2)
    y_objetivo = P0[1] + OBJETIVO[0] * np.tan(theta) - (G * OBJETIVO[0] ** 2) / (2 * CASO_BASE_V ** 2 * np.cos(theta) ** 2)

    # Resultados obtenidos manualmente con las ecuaciones del informe.
    manuales = {
        "Vx": 9.90,
        "Vy": 9.90,
        "Vertice x": 10.00,
        "Vertice y": 6.00,
        "Altura en x=8": 5.80,
        "Altura en x=18": 2.80,
        "Tiempo al objetivo": 1.82,
    }
    python_valores = {
        "Vx": float(vx),
        "Vy": float(vy),
        "Vertice x": float(x_vertice),
        "Vertice y": float(y_vertice),
        "Altura en x=8": float(y_obstaculo),
        "Altura en x=18": float(y_objetivo),
        "Tiempo al objetivo": float(t_objetivo),
    }

    # Matplotlib se importa aquí para permitir ejecutar el juego aunque aún no se haya validado.
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    xs = np.linspace(0, 20, 500)
    ys = P0[1] + xs * np.tan(theta) - (G * xs ** 2) / (2 * CASO_BASE_V ** 2 * np.cos(theta) ** 2)
    ys[ys < 0] = np.nan

    fig, ax = plt.subplots(figsize=(10, 5.4), dpi=160)
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")
    ax.plot(xs, ys, color="black", linewidth=2, label="Trayectoria calculada")
    ax.scatter([P0[0]], [P0[1]], color="#cc3333", s=55, zorder=4, label="Punto inicial")
    ax.scatter([OBJETIVO[0]], [OBJETIVO[1]], color="#3d9b45", s=90, zorder=4, label="Objetivo")
    ax.scatter([x_vertice], [y_vertice], color="#444444", s=45, zorder=4, label="Vértice")
    ax.bar([OBSTACULO[0]], [OBSTACULO[1]], width=OBSTACULO[2], color="#8a8a8a", alpha=0.8, label="Obstáculo")
    ax.annotate("y = 1 + x - 0.05x²", xy=(11.5, 5.1), fontsize=10)
    ax.set_title("Validación computacional del caso base")
    ax.set_xlabel("x (metros)")
    ax.set_ylabel("y (metros)")
    ax.set_xlim(0, 20)
    ax.set_ylim(0, 7)
    ax.grid(True, color="#d9d9d9", linewidth=0.8)
    ax.legend(loc="upper right")
    fig.tight_layout()
    fig.savefig(RUTA_EVIDENCIA, facecolor="white")
    plt.close(fig)

    filas = [
        ("Vx", "m/s"),
        ("Vy", "m/s"),
        ("Vertice x", "m"),
        ("Vertice y", "m"),
        ("Altura en x=8", "m"),
        ("Altura en x=18", "m"),
        ("Tiempo al objetivo", "s"),
    ]
    lineas = [
        "VALIDACIÓN DEL MODELO DE LANZAMIENTO PARABÓLICO",
        "Caso base: v0 = 14 m/s, θ = 45°, y0 = 1 m, g = 9.8 m/s²",
        "Ecuación obtenida: y = 1 + x - 0.05x²",
        "",
        "Elemento | Manual | Python con NumPy | Estado",
        "-" * 72,
    ]
    for nombre, unidad in filas:
        manual = manuales[nombre]
        valor = python_valores[nombre]
        coincide = abs(manual - valor) < 0.05
        estado = "COINCIDE" if coincide else "REVISAR"
        lineas.append(f"{nombre} | {manual:.2f} {unidad} | {valor:.2f} {unidad} | {estado}")

    lineas.extend([
        "",
        "La tolerancia usada es menor a 0.05.",
        "La trayectoria despeja el obstáculo porque y(8) = 5.80 m > 3.00 m.",
        "La trayectoria alcanza el objetivo porque y(18) = 2.80 m.",
    ])
    with open(RUTA_REPORTE, "w", encoding="utf-8") as archivo:
        archivo.write("\n".join(lineas))

    return RUTA_EVIDENCIA, RUTA_REPORTE


# --------------------------- Interfaz del juego ---------------------------
class LanzamientoApp(tk.Tk):
    CANVAS_W = 1050
    CANVAS_H = 560
    ORIGEN_X = 72
    SUELO_Y = 485
    ESCALA = 48

    def __init__(self) -> None:
        super().__init__()
        self.title("Lanzamiento parabólico - Python")
        self.resizable(False, False)
        self.configure(bg="white")

        self.velocidad_var = tk.DoubleVar(value=CASO_BASE_V)
        self.angulo_var = tk.DoubleVar(value=CASO_BASE_ANGULO)
        self.puntaje = 0
        self.intentos = 0
        self.volando = False
        self.tiempo = 0.0
        self.traza: list[tuple[float, float]] = []
        self.score_label = tk.StringVar(value="Puntaje: 0    Intentos: 0")

        self._crear_interfaz()
        self.reiniciar_lanzamiento()

    def _crear_interfaz(self) -> None:
        encabezado = tk.Frame(self, bg="white", padx=12, pady=10)
        encabezado.pack(fill="x")

        tk.Label(
            encabezado,
            text="Simulación simple de lanzamiento parabólico",
            bg="white",
            fg="#111111",
            font=("Arial", 16, "bold"),
        ).pack(side="left")
        tk.Label(
            encabezado,
            textvariable=self.score_label,
            bg="white",
            fg="#111111",
            font=("Arial", 11, "bold"),
        ).pack(side="right")

        controles = tk.Frame(self, bg="white", padx=12, pady=4)
        controles.pack(fill="x")

        tk.Label(controles, text="Velocidad inicial (m/s)", bg="white", font=("Arial", 10)).grid(row=0, column=0, sticky="w")
        self.velocidad_slider = tk.Scale(
            controles,
            from_=6,
            to=18,
            resolution=0.5,
            orient="horizontal",
            variable=self.velocidad_var,
            length=210,
            bg="white",
            highlightthickness=0,
            command=lambda _=None: self.redibujar(),
        )
        self.velocidad_slider.grid(row=1, column=0, padx=(0, 16), sticky="w")

        tk.Label(controles, text="Ángulo (grados)", bg="white", font=("Arial", 10)).grid(row=0, column=1, sticky="w")
        self.angulo_slider = tk.Scale(
            controles,
            from_=10,
            to=70,
            resolution=1,
            orient="horizontal",
            variable=self.angulo_var,
            length=210,
            bg="white",
            highlightthickness=0,
            command=lambda _=None: self.redibujar(),
        )
        self.angulo_slider.grid(row=1, column=1, padx=(0, 16), sticky="w")

        botones = tk.Frame(controles, bg="white")
        botones.grid(row=0, column=2, rowspan=2, sticky="nsew")
        self._boton(botones, "Lanzar", self.lanzar).grid(row=0, column=0, padx=4, pady=2)
        self._boton(botones, "Reiniciar", self.reiniciar_nivel).grid(row=0, column=1, padx=4, pady=2)

        self.canvas = tk.Canvas(
            self,
            width=self.CANVAS_W,
            height=self.CANVAS_H,
            bg="white",
            highlightbackground="#999999",
            highlightthickness=1,
        )
        self.canvas.pack(padx=12, pady=(8, 5))


    @staticmethod
    def _boton(contenedor: tk.Widget, texto: str, comando) -> ttk.Button:
        return ttk.Button(contenedor, text=texto, command=comando)

    # --------------------------- Dibujo ---------------------------
    def mundo_a_pantalla(self, x: float, y: float) -> tuple[float, float]:
        return self.ORIGEN_X + x * self.ESCALA, self.SUELO_Y - y * self.ESCALA

    def redibujar(self) -> None:
        self.canvas.delete("all")
        self._dibujar_plano()
        self._dibujar_elementos()
        self._dibujar_datos()

    def _dibujar_plano(self) -> None:
        # Fondo blanco, cuadrícula y ejes del plano cartesiano.
        for x in range(0, 21):
            sx, _ = self.mundo_a_pantalla(x, 0)
            self.canvas.create_line(sx, 80, sx, self.SUELO_Y, fill="#e3e3e3")
            if x % 2 == 0:
                self.canvas.create_text(sx, self.SUELO_Y + 16, text=str(x), fill="#555555", font=("Arial", 9))

        for y in range(0, 9):
            _, sy = self.mundo_a_pantalla(0, y)
            self.canvas.create_line(self.ORIGEN_X, sy, self.CANVAS_W - 22, sy, fill="#e3e3e3")
            if y > 0:
                self.canvas.create_text(self.ORIGEN_X - 20, sy, text=str(y), fill="#555555", font=("Arial", 9))

        self.canvas.create_line(self.ORIGEN_X, self.SUELO_Y, self.CANVAS_W - 20, self.SUELO_Y, fill="black", width=2, arrow="last")
        self.canvas.create_line(self.ORIGEN_X, self.SUELO_Y + 6, self.ORIGEN_X, 78, fill="black", width=2, arrow="last")
        self.canvas.create_text(self.CANVAS_W - 34, self.SUELO_Y + 25, text="x (m)", font=("Arial", 10, "bold"))
        self.canvas.create_text(self.ORIGEN_X - 20, 68, text="y (m)", font=("Arial", 10, "bold"))

    def _dibujar_elementos(self) -> None:
        # Obstáculo, objetivo y resortera simplificados.
        x_obs, h_obs, ancho_obs = OBSTACULO
        sx1, sy0 = self.mundo_a_pantalla(x_obs - ancho_obs / 2, 0)
        sx2, syh = self.mundo_a_pantalla(x_obs + ancho_obs / 2, h_obs)
        self.canvas.create_rectangle(sx1, syh, sx2, sy0, outline="black", fill="#d9d9d9", width=2)
        self.canvas.create_text((sx1 + sx2) / 2, syh - 12, text="obstáculo", font=("Arial", 9))

        tx, ty = self.mundo_a_pantalla(*OBJETIVO)
        radio = RADIO_OBJETIVO * self.ESCALA
        self.canvas.create_oval(tx - radio, ty - radio, tx + radio, ty + radio, outline="black", fill="#6dbb72", width=2)
        self.canvas.create_text(tx, ty + radio + 16, text="objetivo", font=("Arial", 9))

        p0x, p0y = self.mundo_a_pantalla(*P0)
        self.canvas.create_line(p0x - 14, self.SUELO_Y, p0x, p0y, fill="black", width=4)
        self.canvas.create_line(p0x + 14, self.SUELO_Y, p0x, p0y, fill="black", width=4)
        self.canvas.create_text(p0x + 32, p0y + 20, text="P₀(0, 1)", font=("Arial", 9))

        # Trayectoria prevista en gris cuando aún no se está animando.
        if not self.volando:
            self._dibujar_curva(puntos_trayectoria(self.velocidad_var.get(), self.angulo_var.get()), "#9a9a9a", 2, True)
        elif self.traza:
            self._dibujar_curva(self.traza, "#444444", 2, False)

        # Vector velocidad y arco del ángulo: evidencia visual de vectores y ángulos.
        velocidad = self.velocidad_var.get()
        angulo = self.angulo_var.get()
        vx, vy = componentes_velocidad(velocidad, angulo)
        largo_visual = 0.23
        fx, fy = self.mundo_a_pantalla(P0[0] + vx * largo_visual, P0[1] + vy * largo_visual)
        self.canvas.create_line(p0x, p0y, fx, fy, fill="#1f4f99", width=2, arrow="last")
        self.canvas.create_text(fx + 28, fy - 10, text="v₀", fill="#1f4f99", font=("Arial", 10, "bold"))
        self.canvas.create_arc(p0x - 35, p0y - 35, p0x + 35, p0y + 35, start=0, extent=-angulo, style="arc", outline="#1f4f99", width=2)
        self.canvas.create_text(p0x + 44, p0y - 13, text=f"{angulo:.0f}°", fill="#1f4f99", font=("Arial", 9, "bold"))

        # Proyectil.
        if self.volando:
            x, y = self.x_actual, self.y_actual
        else:
            x, y = P0
        bx, by = self.mundo_a_pantalla(x, y)
        r = RADIO_PROYECTIL * self.ESCALA
        self.canvas.create_oval(bx - r, by - r, bx + r, by + r, outline="black", fill="#d9534f", width=2)

    def _dibujar_curva(self, puntos: list[tuple[float, float]], color: str, ancho: int, punteada: bool) -> None:
        if len(puntos) < 2:
            return
        coords: list[float] = []
        for x, y in puntos:
            sx, sy = self.mundo_a_pantalla(x, y)
            coords.extend([sx, sy])
        self.canvas.create_line(*coords, fill=color, width=ancho, dash=(5, 4) if punteada else None, smooth=True)

    def _dibujar_datos(self) -> None:
        v0 = self.velocidad_var.get()
        theta = self.angulo_var.get()
        vx, vy = componentes_velocidad(v0, theta)
        ecuacion = f"Modelo: y = {P0[1]:.1f} + x·tan({theta:.0f}°) - {G / (2 * v0 * v0 * math.cos(math.radians(theta)) ** 2):.4f}x²"
        texto1 = f"v₀ = {v0:.1f} m/s     θ = {theta:.0f}°     Vx = {vx:.2f} m/s     Vy = {vy:.2f} m/s"
        self.canvas.create_text(92, 28, text=texto1, anchor="w", fill="#111111", font=("Arial", 11, "bold"))
        self.canvas.create_text(92, 53, text=ecuacion, anchor="w", fill="#333333", font=("Arial", 10))

    # --------------------------- Acciones ---------------------------
    def actualizar_marcador(self) -> None:
        self.score_label.set(f"Puntaje: {self.puntaje}    Intentos: {self.intentos}")

    def lanzar(self) -> None:
        if self.volando:
            return
        self.volando = True
        self.tiempo = 0.0
        self.traza = [P0]
        self.x_actual, self.y_actual = P0
        self.vx_actual, self.vy_actual = componentes_velocidad(self.velocidad_var.get(), self.angulo_var.get())
        self.intentos += 1
        self.actualizar_marcador()
        self._animar()

    def _animar(self) -> None:
        if not self.volando:
            return
        self.tiempo += 0.04
        self.x_actual = P0[0] + self.vx_actual * self.tiempo
        self.y_actual = P0[1] + self.vy_actual * self.tiempo - 0.5 * G * self.tiempo * self.tiempo
        self.traza.append((self.x_actual, self.y_actual))

        # Colisión simple con el objetivo.
        distancia = math.hypot(self.x_actual - OBJETIVO[0], self.y_actual - OBJETIVO[1])
        if distancia <= RADIO_OBJETIVO + RADIO_PROYECTIL:
            self.volando = False
            self.puntaje += 1000
            self.actualizar_marcador()
            self.redibujar()
            return

        # Colisión simple con el obstáculo.
        x_obs, h_obs, ancho_obs = OBSTACULO
        if abs(self.x_actual - x_obs) <= ancho_obs / 2 + RADIO_PROYECTIL and 0 <= self.y_actual <= h_obs + RADIO_PROYECTIL:
            self.volando = False
            self.redibujar()
            return

        if self.y_actual < 0 or self.x_actual > 20.7:
            self.volando = False
            self.redibujar()
            return

        self.redibujar()
        self.after(25, self._animar)

    def reiniciar_lanzamiento(self) -> None:
        self.volando = False
        self.tiempo = 0.0
        self.traza = []
        self.x_actual, self.y_actual = P0
        self.redibujar()

    def reiniciar_nivel(self) -> None:
        self.puntaje = 0
        self.intentos = 0
        self.actualizar_marcador()
        self.reiniciar_lanzamiento()



if __name__ == "__main__":
    if "--validate" in sys.argv:
        evidencia, reporte = validar_modelo()
        print(f"Generado: {evidencia}")
        print(f"Generado: {reporte}")
    else:
        app = LanzamientoApp()
        app.mainloop()
