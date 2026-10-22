/**
 * Tiny, dependency-free syntax highlighter for the languages used in lessons.
 * It favours readability over completeness: comments, strings, keywords,
 * annotations, numbers and YAML keys. Runs on the server at build time.
 */

export type TokenKind = 'plain' | 'comment' | 'string' | 'keyword' | 'type' | 'annotation' | 'number' | 'key' | 'command';
export type Token = { kind: TokenKind; text: string };

const JAVA_KEYWORDS =
  'abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|record|return|sealed|permits|short|static|super|switch|synchronized|this|throw|throws|transient|try|var|void|volatile|while|yield|null|true|false';

const SHELL_COMMANDS =
  'java|javac|mvn|\\./mvnw|mvnw\\.cmd|curl|docker|podman|oc|kubectl|cd|ls|cat|echo|export|git|psql|FROM|WORKDIR|COPY|RUN|USER|EXPOSE|ENTRYPOINT|CMD|ENV|ARG|LABEL|HEALTHCHECK|ADD';

type Rule = [TokenKind, RegExp];

const rules: Record<string, Rule[]> = {
  java: [
    ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
    ['string', /"""[\s\S]*?"""|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])'/y],
    ['annotation', /@[A-Za-z_][\w.]*/y],
    ['keyword', new RegExp(`\\b(?:${JAVA_KEYWORDS})\\b`, 'y')],
    ['type', /\b[A-Z][A-Za-z0-9_]*\b/y],
    ['number', /\b\d[\d_]*(?:\.\d+)?[LlFfDd]?\b/y],
  ],
  yaml: [
    ['comment', /#[^\n]*/y],
    ['key', /^[ \t-]*[A-Za-z_][\w.-]*(?=\s*:)/my],
    ['string', /"(?:\\.|[^"\\\n])*"|'[^'\n]*'/y],
    ['number', /\b\d+(?:\.\d+)?(?:ms|s|m)?\b/y],
    ['keyword', /\b(?:true|false|null)\b/y],
  ],
  shell: [
    ['comment', /(?<=^|\s)#[^\n]*/my],
    ['string', /"(?:\\.|[^"\\\n])*"|'[^'\n]*'/y],
    ['command', new RegExp(`(?<=^|[;&|]\\s*)(?:${SHELL_COMMANDS})(?=\\s|$)`, 'my')],
    ['keyword', /(?<=\s)--?[A-Za-z][\w-]*/y],
  ],
};
rules.dockerfile = rules.shell;
rules.bash = rules.shell;
rules.sh = rules.shell;
rules.yml = rules.yaml;
rules.properties = [['comment', /#[^\n]*/y], ['key', /^[\w.-]+(?==)/my]];

export function highlight(code: string, lang: string): Token[] {
  const langRules = rules[lang];
  if (!langRules) return [{ kind: 'plain', text: code }];
  const tokens: Token[] = [];
  let plain = '';
  let i = 0;
  outer: while (i < code.length) {
    for (const [kind, re] of langRules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m.index === i && m[0].length > 0) {
        if (plain) tokens.push({ kind: 'plain', text: plain });
        plain = '';
        tokens.push({ kind, text: m[0] });
        i += m[0].length;
        continue outer;
      }
    }
    // Consume a whole identifier at once so keywords are not matched mid-word.
    const word = /[A-Za-z0-9_]+/y;
    word.lastIndex = i;
    const w = word.exec(code);
    const chunk = w && w.index === i ? w[0] : code[i];
    plain += chunk;
    i += chunk.length;
  }
  if (plain) tokens.push({ kind: 'plain', text: plain });
  return tokens;
}
