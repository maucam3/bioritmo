# Sincronía · Bioritmo y compatibilidad

App web instalable para conocer tu **bioritmo diario** (físico, emocional e intelectual) y tu **compatibilidad bioritmica** con otra persona.

**👉 Abrir la app: <https://maucam3.github.io/bioritmo/>**

## Qué incluye

- **Introducción**: qué es el bioritmo, sus tres ciclos y sus aplicaciones.
- **Mi día**: energía general, los tres ciclos con su tendencia, lectura del día, gráfica del mes, próximos días críticos y el mejor día de la semana.
- **Compatibilidad**: porcentaje total y por ciclo, ondas de ambos en los próximos 30 días y los mejores días para estar juntos.
- Funciona **sin internet** una vez instalada; los datos se guardan solo en tu dispositivo.

## Cómo instalarla (descargarla)

- **Android (Chrome)**: abre el enlace → botón *Instalar app* o menú ⋮ → *Instalar aplicación*.
- **iPhone (Safari)**: abre el enlace → botón Compartir → *Agregar a pantalla de inicio*.
- **PC (Chrome o Edge)**: abre el enlace → icono de instalar en la barra de direcciones.

También puedes descargar el código en ZIP desde [Releases](https://github.com/maucam3/bioritmo/releases).

## Ciclos

| Ciclo | Periodo | Fórmula |
|---|---|---|
| Físico | 23 días | `sen(2π·t/23)` |
| Emocional | 28 días | `sen(2π·t/28)` |
| Intelectual | 33 días | `sen(2π·t/33)` |

`t` = días vividos. La compatibilidad por ciclo es `(1 + cos(2π·Δ/periodo)) / 2`, con `Δ` = días entre ambos nacimientos.

> El bioritmo es una tradición popular sin respaldo científico: úsalo como entretenimiento.

## Verlo en local

```bash
python -m http.server 5501
```

y abre <http://localhost:5501>.
