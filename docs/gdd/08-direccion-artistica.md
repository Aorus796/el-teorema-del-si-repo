# 8. Dirección artística

## 8.1. Visión

Pixel art estilizado inspirado en RPG de 16 bits, sin reproducir de forma estricta las limitaciones de una consola concreta. El mundo debe transmitir calidez, aventura, misterio amable, humor y cuidado artesanal.

No debe parecer un aula, un RPG medieval genérico ni un juego oscuro.

## 8.2. Resolución y escala

- Resolución lógica provisional del mundo: **480 x 270**.
- Relación: 16:9.
- Escalado entero siempre que sea posible.
- Filtrado desactivado para mantener píxeles definidos.
- La interfaz HTML podrá usar una resolución superior para texto y P10.

## 8.3. Cuadrícula y sprites

- Tiles base: 16 x 16 píxeles.
- Personajes: caja aproximada de 24 x 32 o 32 x 40.
- Cabezas ligeramente grandes y siluetas claras.
- Cuatro direcciones, con diagonales resueltas mediante dirección dominante.

La escala se validará con una prueba que incluya protagonista, novia, NPC, plaza, diálogo y panel de puzle.

## 8.4. Personajes personalizados

La semejanza de la pareja se construye mediante peinado, gafas, barba, colores, accesorios, postura, expresiones y retratos. No se busca realismo fotográfico.

La novia llevará indumentaria ceremonial práctica. Un vestido voluminoso encarecería animaciones, reduciría credibilidad y reforzaría un papel pasivo.

## 8.5. Siluetas de NPC

| Personaje | Elemento dominante |
|---|---|
| Maestro Nodo | Bastón y abrigo amplio |
| Señora Prima | Sombrero y tijeras |
| Bibliotecario Silogio | Gafas y libro |
| Doctora Paralaje | Lente y círculos |
| Maestro Permuto | Herramientas y gafas protectoras |
| Alcaldesa Corolaria | Banda y carpeta |
| Testigo Cero | Sombrero y mochila |
| Custodio | Cuerpo alto y geométrico |

## 8.6. Custodio

Materiales: piedra marfil, metal dorado envejecido, cristal turquesa y líneas de luz. Su rostro se compone de formas simples. Los estados de procesamiento, validación, error y contradicción se expresan mediante movimiento geométrico, no mediante emociones humanas completas.

## 8.7. Retratos

- Tamaño aproximado: 64 x 64 u 80 x 80.
- Protagonista y novia: cuatro o cinco expresiones.
- Custodio: cuatro estados.
- NPCs principales: dos o tres expresiones.
- Secundarios: sin retrato o recurso simplificado.

## 8.8. Paleta

Paleta global controlada, no extremadamente limitada.

- Cálidos: crema, ocre, terracota, madera, dorado.
- Naturales: verde salvia, verde bosque, azul agua, turquesa.
- Narrativos: violeta para misterio, cian para archivo, dorado para validación, coral para contradicción.
- Sombras azuladas, violáceas o marrones; negro puro reservado.

## 8.9. Identidad de zonas

| Zona | Paleta y sensación |
|---|---|
| Plaza | Piedra clara, flores, dorados; acogedora y festiva |
| Biblioteca | Madera, verde oscuro, vino y papel; tranquila y densa |
| Puentes | Azul, turquesa y madera; fresca y dinámica |
| Jardín | Verdes, amarillo, rosa y blanco; viva y ordenada |
| Observatorio | Azul profundo, violeta y plata; contemplativa |
| Molino | Cobre, naranja, gris y aceite; energética y caótica |
| Archivo | Marfil, turquesa y oro; antiguo, inteligente y no terrorífico |

## 8.10. Tilesets

Un conjunto común exterior e interior se combina con grupos especializados para agua, jardín, observatorio, molino y archivo. El archivo puede justificar un tileset más específico; las demás zonas reutilizan materiales y arquitectura.

Las variantes decorativas no deben confundirse con información de puzle.

## 8.11. Capas y profundidad

1. Fondo.
2. Suelo.
3. Elementos bajos.
4. Personajes y objetos.
5. Elementos altos.
6. Efectos.
7. Iluminación.
8. Interfaz.

Los elementos que ocultan al protagonista se vuelven translúcidos o muestran su silueta.

## 8.12. Iluminación

Sistema atmosférico, no físicamente realista. Combina color ambiental, luces locales y cambios narrativos. Los efectos nunca pueden ocultar símbolos o alterar el contraste necesario para un puzle.

## 8.13. Animaciones

- Protagonista: caminar, quieto, examinar, recoger, cuaderno, accionar, reacción y celebración.
- Novia: caminar, escribir, manipular, señalar, llamar y reencuentro.
- NPC: movimiento básico, espera y una animación característica.
- Caminar: cuatro a seis fotogramas por dirección.
- Acciones: cuatro a ocho fotogramas cuando sean necesarias.

Una acción característica aporta más personalidad que muchas animaciones genéricas.

## 8.14. Agua y vegetación

El agua comunica nivel, flujo y compuertas mediante animación y forma, no solo color. La vegetación interactiva del jardín utiliza parterres reconocibles y estados abiertos o cerrados claramente distintos de la decoración.

## 8.15. Lenguaje de mecanismos

Los mecanismos del archivo comparten piedra clara, metal, turquesa y geometría. Estados:

- Inactivo.
- Disponible.
- Parcial.
- Resuelto.
- Error.

Esto revela que la fuente, canales, observatorio, jardín y molino pertenecen a un sistema común.

## 8.16. Lenguaje de pistas

- Novia: trazos manuales, color cálido, pequeñas imperfecciones y dos arcos.
- Custodio: simetría, líneas exactas y luz turquesa o dorada.
- Historia: papel envejecido, grabados y tinta.
- Ayuntamiento: sellos, formularios y lenguaje administrativo.

## 8.17. Interfaz y cuaderno

Papel, tinta, madera clara y detalles geométricos. El cuaderno parece un objeto físico, pero mantiene áreas de texto limpias. Los paneles de puzle comparten cabecera, controles, materiales y estados aunque sus interacciones sean diferentes.

## 8.18. Producción artística

1. Prueba de estilo.
2. Kit base.
3. Zonas.
4. Personajes y retratos.
5. Puzles.
6. Pulido.

Se utilizará arte temporal hasta validar escala, cámara, controles y paneles. Aseprite es la herramienta principal provisional; Tiled se utilizará para mapas.

## 8.19. Prioridad de recorte

1. Interiores secundarios.
2. Variantes decorativas.
3. Expresiones adicionales.
4. Animaciones secundarias.
5. Personajes menores.
6. Partículas.
7. Escenas opcionales.

No se recortan primero la pareja, el Custodio, la legibilidad de puzles, el reencuentro o el metapuzle.
