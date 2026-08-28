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

## Cambiar el contrato

Este paquete es la unica cosa que garantiza que las dos puntas de una llamada
esten de acuerdo. Cuando antes era un cambio en un commit, ahora son tres pasos
y hay que hacer los tres:

1. Aca: el cambio, `pnpm test`, subir la `version` en `package.json`, publicar.
2. En `multicodigo-vm`: subir la version de la dependencia, correr los tests.
3. En `multicodigo-back` (bridge): lo mismo.

Un cambio que rompe compatibilidad es un **major**. Los dos consumidores piden
`^`, asi que un minor les llega solo en el proximo install y un major no: eso es
deliberado, para que una ruptura no entre sin que alguien la mire.
