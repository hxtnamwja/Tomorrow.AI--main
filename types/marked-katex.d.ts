declare module 'marked-katex-extension' {
  interface MarkedKatexOptions {
    throwOnError?: boolean;
    displayMode?: boolean;
    output?: 'html' | 'mathml' | 'htmlAndMathml';
    trust?: boolean | ((context: { command: string; url: string; protocol: string }) => boolean);
    macros?: { [key: string]: string };
  }

  function markedKatex(options?: MarkedKatexOptions): any;

  export default markedKatex;
}
