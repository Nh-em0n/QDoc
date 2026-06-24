export default function markdownItImageWithoutParagraph(md) {
  const defaultImage = md.renderer.rules.image || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.inline.ruler.before("image", "double_bang_image", (state, silent) => {
    const pos = state.pos;

    if (
      state.src.charCodeAt(pos) !== 0x21 || // !
      state.src.charCodeAt(pos + 1) !== 0x21 || // !
      state.src.charCodeAt(pos + 2) !== 0x5B // [
    ) {
      return false;
    }

    const oldPos = state.pos;
    state.pos++;

    const ok = md.inline.ruler.__rules__.find(r => r.name === "image").fn(state, silent);

    if (!ok) {
      state.pos = oldPos;
      return false;
    }

    state.tokens[state.tokens.length - 1].meta = { standalone: true };
    return true;
  });

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    return defaultImage(tokens, idx, options, env, self);
  };

  md.core.ruler.after("inline", "unwrap_double_bang_image", (state) => {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length - 2; i++) {
      if (
        tokens[i].type === "paragraph_open" &&
        tokens[i + 1].type === "inline" &&
        tokens[i + 1].children &&
        tokens[i + 1].children.length === 1 &&
        tokens[i + 1].children[0].type === "image" &&
        tokens[i + 1].children[0].meta?.standalone &&
        tokens[i + 2].type === "paragraph_close"
      ) {
        tokens.splice(i, 3, ...tokens[i + 1].children);
      }
    }
  });
}