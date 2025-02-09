import { isOp, isText, op, int, isOpCode } from "../IR";
import { type Plugin } from "../common/Language";
import { mapOps } from "./ops";
import { charLength } from "../common/strings";

/** Implements ascii text op by either byte / codepoint text ops. */
export function usePrimaryTextOps(char: "byte" | "codepoint"): Plugin {
  return {
    name: `usePrimaryTextOps(${JSON.stringify(char)})`,
    visit(node) {
      if (!isOp()(node) || !node.op.includes("[Ascii]")) return;
      const replacement = node.op.replace("[Ascii]", `[${char}]`);
      if (isOpCode(replacement)) {
        return op.unsafe(replacement, ...node.args);
      }
    },
  };
}

export const textGetToIntToTextGet: Plugin = mapOps({
  "ord_at[Ascii]": (x) => op["ord[Ascii]"](op["at[Ascii]"](x[0], x[1])),
  "ord_at[byte]": (x) => op["ord[byte]"](op["at[byte]"](x[0], x[1])),
  "ord_at[codepoint]": (x) =>
    op["ord[codepoint]"](op["at[codepoint]"](x[0], x[1])),
  "ord_at_back[Ascii]": (x) =>
    op["ord[Ascii]"](op["at_back[Ascii]"](x[0], x[1])),
  "ord_at_back[byte]": (x) => op["ord[byte]"](op["at_back[byte]"](x[0], x[1])),
  "ord_at_back[codepoint]": (x) =>
    op["ord[codepoint]"](op["at_back[codepoint]"](x[0], x[1])),
});

export const textToIntToTextGetToInt: Plugin = mapOps({
  "ord[byte]": (x) =>
    isOp("at[byte]")(x[0]) ? op["ord_at[byte]"](...x[0].args) : undefined,
  "ord[codepoint]": (x) =>
    isOp("at[codepoint]")(x[0])
      ? op["ord_at[codepoint]"](...x[0].args)
      : undefined,
});

export const textGetToTextGetToIntToText: Plugin = mapOps({
  "at[byte]": (x) => op["char[byte]"](op["ord_at[byte]"](x[0], x[1])),
  "at[codepoint]": (x) =>
    op["char[codepoint]"](op["ord_at[codepoint]"](x[0], x[1])),
});

export const textToIntToFirstIndexTextGetToInt: Plugin = mapOps({
  "ord[Ascii]": (x) => op["ord_at[Ascii]"](x[0], int(0n)),
  "ord[byte]": (x) => op["ord_at[byte]"](x[0], int(0n)),
  "ord[codepoint]": (x) => op["ord_at[codepoint]"](x[0], int(0n)),
});

/**
 * Converts nested text_replace to a text_multireplace provided the arguments are
 * text literals with no overlap.
 * @param singleCharInputsOnly Only applies the transform if the input args are single characters.
 * This is used in Python. In the future it might can generalised to some general callback filter.
 * @returns
 */
export function useMultireplace(singleCharInputsOnly = false): Plugin {
  return {
    name: "useMultireplace",
    visit(node) {
      const isReplace = isOp("replace", "text_multireplace");
      if (isReplace(node) && isReplace(node.args[0])) {
        const a = node.args[0].args.slice(1);
        const b = node.args.slice(1);
        if (a.every(isText()) && b.every(isText())) {
          const aValues = a.map((x) => x.value);
          const bValues = b.map((x) => x.value);
          const aIn = aValues.filter((_, i) => i % 2 === 0);
          const aOut = aValues.filter((_, i) => i % 2 === 1);
          const bIn = bValues.filter((_, i) => i % 2 === 0);
          const bOut = bValues.filter((_, i) => i % 2 === 1);
          const aInSet = new Set(aIn.join());
          const aOutSet = new Set(aOut.join());
          const bInSet = new Set(bIn.join());
          const bOutSet = new Set(bOut.join());
          if (
            (!singleCharInputsOnly ||
              [...aIn, ...bIn].every((x) => charLength(x) === 1)) &&
            ![...aInSet].some((x) => bInSet.has(x)) &&
            ![...bInSet].some((x) => aOutSet.has(x)) &&
            ![...aInSet].some((x) => bOutSet.has(x))
          ) {
            return op.unsafe("text_multireplace", ...node.args[0].args, ...b);
          }
        }
      }
    },
  };
}

export const replaceToSplitAndJoin: Plugin = mapOps({
  replace: ([x, y, z]) => op.join(op.split(x, y), z),
});

export function startsWithEndsWithToSliceEquality(
  char: "byte" | "codepoint",
): Plugin {
  return {
    name: `startsWithEndsWithToSliceEquality(${JSON.stringify(char)})`,
    visit(node) {
      if (isOp("starts_with")(node)) {
        return op["eq[Text]"](
          op[`slice[${char}]`](
            node.args[0],
            int(0),
            op[`size[${char}]`](node.args[1]),
          ),
          node.args[1],
        );
      }
      if (isOp("ends_with")(node)) {
        return op["eq[Text]"](
          op[`slice_back[${char}]`](
            node.args[0],
            op.neg(op[`size[${char}]`](node.args[1])),
            op[`size[${char}]`](node.args[1]),
          ),
          node.args[1],
        );
      }
    },
  };
}
