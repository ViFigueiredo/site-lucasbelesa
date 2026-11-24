#!/usr/bin/env bash
# Gera os ativos de marca do site a partir do manual de identidade (PDF).
#
# Uso: scripts/build-brand-assets.sh [caminho/para/logo.pdf]
#
# O manual entrega o monograma como vetor desenhado; aqui ele é rasterizado em
# alta resolução (600 dpi) e reconvertido em variantes monocromáticas com fundo
# transparente via máscara alfa. Assim o mesmo desenho serve sobre fundo claro e
# escuro sem depender de qual variante de cor estava na página do manual.
#
# Requer: ghostscript (gs) e ImageMagick 6 (convert/identify).
# Não roda no deploy: é build de ativo, executado uma vez e versionado no repo.
set -euo pipefail

PDF="${1:-$HOME/Downloads/logo.pdf}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMG="$HERE/public/assets/img"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

[ -r "$PDF" ] || { echo "PDF não encontrado: $PDF" >&2; exit 1; }
command -v gs >/dev/null || { echo "ghostscript ausente" >&2; exit 1; }

# Azul e vinho vêm do manual (#173454 / #7A1B27); claro é o off-white da marca.
AZUL='#173454'; VINHO='#7A1B27'; PRETO='#111111'; CLARO='#F4F3F1'; BEGE='#DCC7A1'

mkdir -p "$IMG"

# 1) página 6 do manual = prancha do MONOGRAMA. Rasteriza em 300 dpi.
#    (600 dpi produzia 12000x6750 e não trazia ganho visível no tamanho final.)
gs -q -dNOPAUSE -dBATCH -dFirstPage=6 -dLastPage=6 -sDEVICE=pngalpha -r300 \
   -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -sOutputFile="$WORK/p06.png" "$PDF"

# 2) recorta o primeiro monograma da prancha (bbox 134x157+244+309 a 72 dpi -> x4.1667)
convert "$WORK/p06.png" -crop 620x720+1005+1275 +repage "$WORK/raw.png"

# 3) fundo chapado (#E6E4E1) -> transparente e ajusta ao desenho
convert "$WORK/raw.png" -fuzz 18% -transparent '#E6E4E1' -trim +repage "$WORK/mono.png"

# 4) máscara alfa = desenho em si; permite repintar em qualquer cor da marca
convert "$WORK/mono.png" -alpha extract "$WORK/mask.png"

# 5) repinta: cor sólida + máscara como opacidade
paint() { # paint <cor> <arquivo> <lado>
  local hex="$1" out="$2" side="$3"
  convert -size "$(identify -format '%wx%h' "$WORK/mask.png")" "xc:$hex" \
          "$WORK/mask.png" -alpha off -compose CopyOpacity -composite \
          -resize "${side}x${side}" -strip "$out"
}

paint "$AZUL"  "$IMG/monograma-azul.png"   512
paint "$VINHO" "$IMG/monograma-vinho.png"  512
paint "$PRETO" "$IMG/monograma-preto.png"  512
paint "$CLARO" "$IMG/monograma-claro.png"  256

# 6) favicon: monograma claro sobre o azul da marca, quadrado
tile() { # tile <cor-fundo> <lado> <arquivo>
  local bg="$1" side="$2" out="$3" inner
  inner=$(( side * 58 / 100 ))
  convert "$IMG/monograma-claro.png" -resize "${inner}x${inner}" -strip \
    \( -size "${side}x${side}" "xc:$bg" \) +swap -gravity center -composite -strip "$out"
}
tile "$AZUL" 180 "$IMG/apple-touch-icon.png"
tile "$AZUL" 32  "$IMG/favicon-32.png"
tile "$AZUL" 16  "$IMG/favicon-16.png"

# 7) favicon.ico multi-resolução (16 + 32 + 48) na raiz pública
tile "$AZUL" 48 "$WORK/f48.png"
convert "$IMG/favicon-16.png" "$IMG/favicon-32.png" "$WORK/f48.png" "$HERE/public/favicon.ico"
rm -f "$WORK/f48.png"

# 8) og:image 1200x630 — monograma claro centralizado sobre azul, com filete bege
#    (o -resize vai entre parênteses para não encolher também o canvas)
convert -size 1200x630 "xc:$AZUL" \
  -fill "$AZUL" -stroke "$BEGE" -strokewidth 2 -draw "rectangle 60,60 1140,570" \
  -stroke none \
  \( "$IMG/monograma-claro.png" -resize 300x300 -strip \) \
  -gravity center -composite -strip "$IMG/og-image.png"

echo "ativos gerados em $IMG:"
identify -format '  %f %wx%h %[channels]\n' "$IMG"/*.png "$HERE/public/favicon.ico"
