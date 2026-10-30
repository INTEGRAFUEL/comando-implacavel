# COMANDO IMPLACÁVEL — NÃO PERCA A DIREÇÃO
Agenda pessoal e privada do Jhony Brianezi (IN'TEGRA Fuel). PWA estática (GitHub Pages) + Supabase `nwcixkllbxmetfcozkwb`.
Independente do OFFICIUM INEXORABILE (nenhum dado importado, nenhuma tabela antiga tocada).

## Arquitetura
- `src/app.html` + `src/app.js` + supabase-js UMD embutido → `python3 build.py` → `dist/index.html`. `dist/` = site publicado (manifest, sw.js, ícones).
- Auth: Supabase e-mail/senha. Dono único: brianezi.heritage@gmail.com, uid `dd3e1b45-230a-48aa-8d7d-01df7cfe9d0a`. Outro uid → "Acesso restrito" + logout.
- Tabelas: `cmd_items` (itens) e `cmd_sugestoes` (fila do RADAR). RLS ativa e FORÇADA; policy `FOR ALL TO authenticated` só com `auth.uid() = dd3e1b45-…`. `anon` sem nenhum GRANT.
- Categorias (`categoria`): dia, fuel, air, b2b, pessoas, potenciais, rotas. Prioridade 1–4. Status: ABERTO, EM ANDAMENTO, CONCLUÍDO, CANCELADO.

## RADAR → inserir sugestão (via MCP execute_sql, service role)
```sql
insert into public.cmd_sugestoes (origem, payload) values ('RADAR', jsonb_build_object(
 'categoria','fuel','titulo','Retornar Posto X','descricao','Cliente pediu orçamento',
 'data','2026-10-31','hora','09:00','prioridade',2,'contato_nome','Fulano','contato_tel','5543999999999',
 'local','Londrina','valor',null,'proxima_acao','Ligar e enviar orçamento'));
```
Nada vira item sem o Jhony clicar Aprovar no app.

## Cronograma do dia
```sql
select prioridade, hora, categoria, titulo, status, data, (data < (now() at time zone 'America/Sao_Paulo')::date) atrasado
from public.cmd_items where status in ('ABERTO','EM ANDAMENTO') and data <= (now() at time zone 'America/Sao_Paulo')::date
order by prioridade, hora nulls last, data;
```
Sugestões pendentes: `select count(*) from public.cmd_sugestoes where status='pendente';`
