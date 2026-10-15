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

## Rodando localmente

Abra o `index.html` no navegador, ou sirva a pasta:

```bash
python -m http.server 5500
```

e acesse http://localhost:5500.

## Publicando no GitHub Pages

No repositório: **Settings → Pages → Branch: `main` / root → Save**.

## Estrutura

```
├── index.html
├── css/style.css
├── js/app.js
├── sw.js                  # cache offline
├── manifest.webmanifest   # instalação como app
└── icon.svg
```
