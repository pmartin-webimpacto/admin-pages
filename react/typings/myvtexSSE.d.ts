declare module 'myvtex-sse' {
  interface Options {
    host?: string
    verbose?: boolean
  }

  function myvtexSSE(
    account: string,
    workspace: string,
    path: string,
    options: Options,
    callback?: (data: any) => void
  ): EventSource
  export default myvtexSSE
}
