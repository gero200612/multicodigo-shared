# @multicodigo/shared

El contrato entre los servicios de MultiCodigo.

Salio del repo `multicodigo-vm` cuando los servicios se repartieron por destino
de despliegue: el gateway, los agentes y el login corren en la VM, y el bridge
corre en Render. Al quedar en repos distintos, el contrato dejo de poder ser un
`workspace:*` y pasa a ser un paquete publicado.

- `contract.ts` — los schemas de zod que viajan por HTTP entre bridge, gateway
  y agentes: `AgentId`, `PromptRequest`, `PromptResponse`, las aprobaciones.
- `bearer.ts` — la comparacion en tiempo constante de los tokens.
- `sanitize.ts` — el recorte de lo que se muestra al usuario.

## Como lo consumen los otros repos

No por npm: por **git**, apuntando a un tag de este repo.

```json
"@multicodigo/shared": "github:gero200612/multicodigo-shared#v0.1.0"
```

pnpm clona el repo en el tag pedido y usa lo que encuentra. Por eso **`dist/`
esta commiteado**: la alternativa era un script `prepare` que compile al
instalar, y pnpm bloquea los scripts de instalacion salvo que se liste el HASH
del commit en `allowBuilds` — o sea, editar esa lista en cada bump. Commitear el
build sale mas barato y ademas no obliga a tener TypeScript en las imagenes.

**Por que git y no npm.** npm exige 2FA para publicar y el scope `@multicodigo`
necesitaria una organizacion. Con git no hace falta ninguna de las dos cosas, el
repo publico ya alcanza, y el tag da el mismo pinneo que una version. Lo que se
pierde es el rango `^`: un tag es exacto, asi que subir de version es editar los
dos consumidores a mano — que para dos consumidores esta bien, y ademas obliga a
mirar el cambio.

El costo del lado de las imagenes: `git` tiene que estar instalado para que el
install pueda clonar. El gateway y los agentes ya lo traian; al login y al
bridge se les agrego.

## Cambiar el contrato

Este paquete es la unica cosa que garantiza que las dos puntas de una llamada
esten de acuerdo. Cuando antes era un cambio en un commit, ahora son tres pasos
y hay que hacer los tres:

1. Aca: el cambio, `pnpm test`, **`pnpm build`** (dist/ va commiteado), subir la
   `version` en `package.json`, commit, y un tag nuevo
   (`git tag v0.2.0 && git push --tags`).
2. En `multicodigo-vm`: apuntar la dependencia al tag nuevo, `pnpm install`,
   correr los tests.
3. En `multicodigo-back/bridge`: lo mismo.

Los tags son inmutables por convencion: no muevas un tag ya publicado, porque
los lockfiles guardan el commit y la proxima instalacion limpia traeria otra
cosa con el mismo nombre.
