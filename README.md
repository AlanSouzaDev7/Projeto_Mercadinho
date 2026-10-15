# 🛒 Mercadinho

Calculadora de compras de mercado inspirada na Calculadora do iPhone.
Defina quanto você pode gastar, digite o preço de cada produto e acompanhe **em tempo real** quanto já gastou e quanto ainda resta. Se passar do limite, o app avisa **quanto passou** e **quanto vai precisar a mais** para pagar — e ainda sugere qual item tirar.

## Como usar

1. **Defina o limite** — digite o valor ou toque em um atalho (R$ 50, 100, 200, 500).
2. **Digite o preço** do produto — os centavos entram automaticamente (`1` `2` `5` `0` = R$ 12,50).
3. Comprou mais de uma unidade? Toque em **×** e digite a quantidade.
4. Toque em **+ Adicionar**.
5. Errou? **−** remove o último item, e o **×** ao lado de cada item o apaga (com opção de desfazer).

| Tecla | Função |
|---|---|
| `AC` | Limpa o valor digitado |
| `⌫` | Apaga o último dígito |
| `×` | Informa a quantidade |
| `−` | Remove o último item |
| `+` | Adiciona o item |

No computador também dá para usar o teclado: números, `Enter` (adicionar), `*` (quantidade), `Backspace`, `Esc` e `-`.

## Recursos

- Visor com prévia: mostra quanto vai sobrar **antes** de adicionar o item
- Barra de progresso verde → laranja (85%) → vermelha (estourou)
- Aviso de estouro com valor excedente, total a pagar e sugestão de item a remover
- A compra fica salva no aparelho (pode fechar o navegador sem perder a lista)
- Funciona offline e pode ser instalado na tela inicial (PWA)
- Sem dependências: HTML, CSS e JavaScript puros

## Aparelhos testados

Layout validado (sem rolagem lateral, sem sobreposição, teclas com no mínimo 44px de altura) em:

| Tipo | Tamanhos |
|---|---|
| iPhone | SE (375×667 e 375×548 com barras do Safari), 15/16 (393×852 e 393×659), Pro Max (430×932) |
| Android | Galaxy S (360×780 / 360×640), Pixel (412×915) |
| Celular deitado | 667×375, 852×393, 915×412 — layout em duas colunas |
| iPad | mini (744×1133), Air (820×1180), Pro 12,9" (1024×1366), em pé e deitado |
| Galaxy Tab | S9 (800×1280), A (712×1138), deitado (1280×800) |

## Rodando localmente

Abra o `index.html` no navegador, ou sirva a pasta:

```bash
python -m http.server 5500
```

e acesse http://localhost:5500.

## Publicando no GitHub Pages

No repositório: **Settings → Pages → Branch: `main` / root → Save**.

Ao publicar mudanças, aumente a versão em `?v=` no `index.html` e a constante `CACHE` no `sw.js`, para que os celulares baixem os arquivos novos.

## Estrutura

```
├── index.html
├── css/style.css
├── js/app.js
├── sw.js                  # cache offline
├── manifest.webmanifest   # instalação como app
└── icon.svg
```
