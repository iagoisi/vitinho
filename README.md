# Vitinho Birdwatching Tours

Landing page local em Vite, React e TypeScript para publicação futura na Vercel. Conteúdo público em inglês (`/en/`) e português (`/pt/`). O espanhol fica pendente de validação de conteúdo e não é publicado.

## Executar

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

O build gera HTML pré-renderizado para `/en/` e `/pt/`. Configure `SITE_URL` com o domínio final para gerar canonical, hreflang e sitemap. A página inicial redireciona para `/en/`.

## Mapas dos destinos

Os mapas interativos usam o estilo do Bubble Maps. Configure `VITE_MAPBOX_TOKEN` com um token público do Mapbox no ambiente local e na Vercel. O contorno de cada região é ilustrativo e não representa limite oficial nem roteiro garantido. Sem o token ou suporte a WebGL, o site exibe uma imagem do mapa.

## Fotografias

As fotos originais fornecidas ficam em `src/assets/images/`. Versões JPEG menores, usadas pelo site, ficam em `public/media/` e podem ser refeitas com `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/prepare-images.ps1`. O mapeamento e os tamanhos responsivos estão em `src/media.ts`.

O logotipo original, fotos identificadas do Pantanal Sul e da Serra da Bodoquena, a onça-pintada e um retrato da Daiani ainda não foram fornecidos. As seções sem imagem mantêm espaços reservados. Antes da publicação, confirme os créditos de cada foto e os enquadramentos finais.

## Contato

O WhatsApp funciona com o número informado no briefing. O formulário usa `api/contact.ts` como Vercel Function e Resend. Configure `RESEND_API_KEY` e `RESEND_FROM` na Vercel; o endereço de envio precisa estar em um domínio autenticado no Resend. Sem isso, o formulário informa falha e oferece WhatsApp e e-mail. Não coloque credenciais em variáveis `VITE_`.

O formulário coleta apenas dados para responder à solicitação, exige consentimento e aplica validação no cliente e no servidor, campo isca e tempo mínimo de preenchimento. Antes de publicar, confirme o texto de privacidade/LGPD, o domínio, as imagens, os créditos e o endereço de envio com o cliente. Se houver abuso real, ative limite de requisições na borda da Vercel.
