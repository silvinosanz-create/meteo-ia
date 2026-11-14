METEO IA — PRIMER PROTOTIPO INSTALABLE

Qué incluye
- Aplicación web progresiva (PWA) instalable en Android desde Chrome.
- Localidades iniciales de la Ribera Alta, con Alberic seleccionado por defecto.
- Consultas en directo a cuatro modelos: ECMWF IFS, NOAA GFS, DWD ICON y Météo-France ARPEGE.
- Resumen combinado de temperatura, lluvia y viento; comparativa individual; evolución horaria y previsión diaria.
- Diseño adaptable a móvil y caché de la interfaz.

IMPORTANTE: esta primera versión compara salidas actuales y calcula promedios sencillos.
Todavía NO calcula un porcentaje histórico de acierto ni entrena un modelo de IA. La coincidencia entre modelos no debe confundirse con fiabilidad estadística.

Cómo instalarla en tu Samsung
1. Descomprime el ZIP.
2. Publica el contenido de la carpeta en un alojamiento HTTPS (por ejemplo, un hosting estático).
3. Abre la dirección HTTPS en Google Chrome en el Samsung.
4. Menú ⋮ > Instalar aplicación (o Añadir a pantalla de inicio).
5. Acepta. Meteo IA aparecerá como una aplicación.

No basta con abrir index.html desde el teléfono: para instalar una PWA se necesita servirla desde HTTPS (localhost es la excepción para desarrollo).

Fuentes de datos
- Open-Meteo Forecast API: https://open-meteo.com/en/docs
- Open-Meteo Historical Forecast API: https://open-meteo.com/en/docs/historical-forecast-api
- Open-Meteo Previous Runs API: https://open-meteo.com/en/docs/previous-runs-api
- AEMET OpenData: https://opendata.aemet.es/

Siguiente fase técnica recomendada
- Backend con base de datos para guardar cada salida de cada modelo con su hora de emisión y plazo.
- Ingesta de observaciones de estaciones (AEMET y estaciones disponibles en la comarca).
- Verificación sin sesgo temporal: comparar cada pronóstico archivado con observaciones posteriores, por localidad, variable y plazo (0–24 h, 24–48 h, etc.).
- Métricas separadas: MAE/RMSE para temperatura, error absoluto y Brier Score para precipitación, error de dirección/velocidad para viento.
- Pesos dinámicos solo cuando haya muestra suficiente, con validación fuera de muestra.
- Avisos de lluvia intensa, tormenta y viento.

Licencia y uso
La API gratuita de Open-Meteo está destinada a uso no comercial y requiere atribución CC BY 4.0. Para uso comercial o despliegue público a escala, revisar sus condiciones y opciones de licencia: https://open-meteo.com/en/pricing
