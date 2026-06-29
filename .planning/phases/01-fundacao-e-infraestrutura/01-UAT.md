---
status: complete
phase: 01-fundacao-e-infraestrutura
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md, 01-05-SUMMARY.md, 01-06-SUMMARY.md]
started: 2026-06-29T00:00:00Z
updated: 2026-06-29T00:00:00Z
url: https://meime.vercel.app/
---

## Current Test

number: 10
name: PWA instalável (Chrome desktop)
expected: |
  Chrome → DevTools (F12) → Application → Manifest → mostra nome
  "MEIME", theme_color #16A34A, ícones 192x192 e 512x512 sem erros.
result: pass

## Tests

### 1. WelcomePage carrega
expected: Abre https://meime.vercel.app/ → aparece "MEIME" em destaque e botão "Começar agora"
result: pass

### 2. Rota direta não dá 404
expected: Navegar para https://meime.vercel.app/privacidade → carrega a página de privacidade (não 404)
result: pass

### 3. Tela de autenticação abre
expected: Clicar "Começar agora" → navega para /auth com abas "Entrar" e "Criar conta"
result: pass

### 4. Criar conta funciona
expected: Aba "Criar conta" → preencher e-mail e senha → submeter → redireciona para /app com BottomNav visível
result: pass

### 5. BottomNav com 5 abas
expected: Na tela /app, a barra inferior mostra 5 ícones: Início, Finanças, Agenda, Cobrar, Conta. A aba ativa fica verde.
result: pass

### 6. Navegação entre abas
expected: Tocar em cada aba → URL muda para /app/financas, /app/agenda etc. → aba tocada fica verde, demais ficam cinza
result: pass

### 7. FAB visível
expected: Um botão "+" circular verde (56px) aparece no canto inferior direito, acima da BottomNav
result: pass

### 8. ContaTab — logout
expected: Aba Conta → botão "Sair" → clicar → redireciona para /welcome (deslogado)
result: pass

### 9. ContaTab — exclusão de conta (dialog)
expected: Aba Conta → "Excluir conta" → aparece um dialog de confirmação antes de executar qualquer ação
result: pass

### 10. PWA instalável (Chrome desktop)
expected: Chrome → DevTools (F12) → Application → Manifest → mostra nome "MEIME", theme #16A34A, ícones 192×192 e 512×512 sem erros
result: pending

## Summary

total: 10
passed: 10
issues: 0
