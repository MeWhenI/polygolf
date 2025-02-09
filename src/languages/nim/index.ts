import {
  functionCall as func,
  indexCall,
  int,
  rangeIndexCall,
  succ,
  array,
  isText,
  builtin,
  op,
  prefix,
  text,
  type Text,
} from "../../IR";
import {
  defaultDetokenizer,
  type Language,
  required,
  search,
  simplegolf,
} from "../../common/Language";

import emitProgram from "./emit";
import {
  flipBinaryOps,
  removeImplicitConversions,
  printIntToPrint,
  mapOps,
  mapOpsTo,
  mapBackwardsIndexToForwards,
  mapMutationTo,
  flipped,
} from "../../plugins/ops";
import {
  addNimImports,
  getEndIndex,
  removeSystemNamespace,
  useBackwardsIndex,
  useUFCS,
  useUnsignedDivision,
} from "./plugins";
import { alias, renameIdents } from "../../plugins/idents";
import {
  forArgvToForEach,
  forArgvToForRange,
  forRangeToForEach,
  forRangeToForRangeInclusive,
  forRangeToForRangeOneStep,
  removeUnusedForVar,
  shiftRangeOneUp,
} from "../../plugins/loops";
import { golfStringListLiteral, listOpsToTextOps } from "../../plugins/static";
import {
  golfLastPrint,
  implicitlyConvertPrintArg,
  putcToPrintChar,
  mergePrint,
} from "../../plugins/print";
import {
  useDecimalConstantPackedPrinter,
  useLowDecimalListPackedPrinter,
} from "../../plugins/packing";
import { tableHashing, tableToListLookup } from "../../plugins/tables";
import hash from "./hash";
import {
  textToIntToTextGetToInt,
  textToIntToFirstIndexTextGetToInt,
  usePrimaryTextOps,
  useMultireplace,
  startsWithEndsWithToSliceEquality,
} from "../../plugins/textOps";
import { assertInt64 } from "../../plugins/types";
import {
  addManyToManyAssignments,
  addVarDeclarationManyToManyAssignments,
  addVarDeclarationOneToManyAssignments,
  addVarDeclarations,
  groupVarDeclarations,
  inlineVariables,
  noStandaloneVarDeclarations,
  tempVarToMultipleAssignment,
} from "../../plugins/block";
import {
  applyDeMorgans,
  equalityToInequality,
  truncatingOpsPlugins,
  bitnotPlugins,
  decomposeIntLiteral,
  pickAnyInt,
  lowBitsPlugins,
} from "../../plugins/arithmetic";
import { safeConditionalOpToAt } from "../../plugins/conditions";

const char48: Text = { ...text("0"), targetType: "char" };

const nimLanguage: Language = {
  name: "Nim",
  extension: "nim",
  emitter: emitProgram,
  phases: [
    required(printIntToPrint, putcToPrintChar, usePrimaryTextOps("byte")),
    simplegolf(golfLastPrint()),
    search(
      mergePrint,
      flipBinaryOps,
      golfStringListLiteral(),
      listOpsToTextOps("find[byte]", "at[byte]"),
      forRangeToForEach("at[Array]", "at[List]", "at[byte]"),
      tempVarToMultipleAssignment,
      useDecimalConstantPackedPrinter,
      useLowDecimalListPackedPrinter,
      tableHashing(hash),
      tableToListLookup,
      equalityToInequality,
      shiftRangeOneUp,
      forRangeToForRangeInclusive(),
      ...bitnotPlugins,
      ...lowBitsPlugins,
      applyDeMorgans,
      textToIntToTextGetToInt,
      forRangeToForRangeOneStep,
      useMultireplace(),
      inlineVariables,
      forArgvToForEach,
      forArgvToForRange(true),
      ...truncatingOpsPlugins,
      decomposeIntLiteral(),
      startsWithEndsWithToSliceEquality("byte"),
    ),
    simplegolf(safeConditionalOpToAt("Array")),
    required(
      pickAnyInt,
      forArgvToForEach,
      ...truncatingOpsPlugins,
      mapOps({
        "at[argv]": (x) => func("paramStr", succ(x[0])),
      }),
      removeUnusedForVar,
      forRangeToForRangeInclusive(true),
      implicitlyConvertPrintArg,
      textToIntToFirstIndexTextGetToInt,
      useUnsignedDivision,
      useBackwardsIndex,
      mapBackwardsIndexToForwards({
        "at_back[Ascii]": 0,
        "at_back[byte]": 0,
        "at_back[codepoint]": 0,
        "at_back[List]": 0,
        "slice_back[Ascii]": 0,
        "slice_back[byte]": 0,
        "slice_back[codepoint]": 0,
        "slice_back[List]": 0,
        "with_at_back[List]": 0,
      }),
      mapMutationTo.index({
        "with_at[Array]": 0,
        "with_at[List]": 0,
        "with_at[Table]": 0,
      }),
      mapOpsTo.index({
        "at[Array]": 0,
        "at[List]": 0,
        "at[Table]": 0,
      }),
      mapOps({
        "reversed[codepoint]": (x) =>
          op.join(func("reversed", func("toRunes", x)), text("")),
        "reversed[byte]": (x) => op.join(func("reversed", x[0]), text("")),
      }),
      mapOps({
        "char[codepoint]": (x) => prefix("$", func("Rune", x)),
        "ord_at[byte]": (x) => func("ord", op["at[byte]"](x[0], x[1])),
        "ord_at[codepoint]": (x) =>
          func("ord", op["at[codepoint]"](x[0], x[1])),
        "read[line]": func("readLine", builtin("stdin")),
        join: (x) => func("join", isText("")(x[1]) ? [x[0]] : x),
        "at[byte]": (x) => indexCall(x[0], x[1]),
        "at[codepoint]": (x) =>
          prefix("$", indexCall(func("toRunes", x[0]), x[1])),
        "slice[byte]": (x) =>
          rangeIndexCall(x[0], x[1], getEndIndex(x[1], x[2]), int(1n)),
        "slice[List]": (x) =>
          rangeIndexCall(x[0], x[1], getEndIndex(x[1], x[2]), int(1n)),
        "print[Text]": (x) => func("write", builtin("stdout"), x),
        replace: (x) => func("replace", isText("")(x[2]) ? [x[0], x[1]] : x),
        text_multireplace: (x) =>
          func(
            "multireplace",
            x[0],
            array(
              x.flatMap((_, i) =>
                i % 2 > 0 ? [array(x.slice(i, i + 2))] : [],
              ), // Polygolf doesn't have array of tuples, so we use array of arrays instead
            ),
          ),
        "size[codepoint]": (x) => op["size[List]"](func("toRunes", x)),
        int_to_bool: (x) => op["eq[Int]"](x[0], int(0n)),
        int_to_bin_aligned: (x) =>
          func("align", op.int_to_bin(x[0]), x[1], char48),
        int_to_hex_aligned: (x) =>
          func("align", op.int_to_hex(x[0]), x[1], char48),
        int_to_Hex_aligned: (x) =>
          func("align", op.int_to_Hex(x[0]), x[1], char48),
      }),
      mapOpsTo.builtin({ true: "true", false: "false" }),
      mapOps({
        int_to_hex: (x) => func("toLowerAscii", op.int_to_Hex(x[0])),
      }),
      mapOpsTo.func(
        {
          argv: "commandLineParams",
          gcd: "gcd",
          split: "split",
          split_whitespace: "split",
          "size[byte]": "len",
          "size[List]": "len",
          "size[Table]": "len",
          repeat: "repeat",
          max: "max",
          min: "min",
          abs: "abs",
          dec_to_int: "parseInt",
          "println[Text]": "echo",
          bool_to_int: "int",
          "char[byte]": "chr",
          "find[List]": "system.find",
          "find[byte]": "find",
          "sorted[Int]": "sorted",
          "sorted[Ascii]": "sorted",
          "reversed[List]": "reversed",
          int_to_bin: "toBin",
          int_to_Hex: "toHex",
          right_align: "align",
          starts_with: "startsWith",
          ends_with: "endsWith",
          bit_count: "popcount",
        },
        "leftChain",
      ),
      mapMutationTo.infix({
        add: "+=",
        sub: "-=",
        mul: "*=",
        "concat[Text]": "&=",
        "concat[List]": "&=",
        append: "&=",
      }),
      mapOpsTo.infix({
        "contains[Array]": flipped`system.in`,
        "contains[List]": flipped`system.in`,
        "contains[Text]": flipped`in`,
        "contains[Table]": flipped`system.in`,
        pow: "^",
        trunc_div: "div",
        rem: "mod",
        unsigned_rem: "%%",
        unsigned_trunc_div: "/%",
        bit_shift_left: "shl",
        bit_shift_right: "shr",
        add: "+",
        sub: "-",
        "concat[Text]": "&",
        "concat[List]": "&",
        append: "&",
        lt: "<",
        leq: "<=",
        "eq[Int]": "==",
        "eq[Text]": "==",
        "neq[Int]": "!=",
        "neq[Text]": "!=",
        geq: ">=",
        gt: ">",
        and: "and",
        bit_and: "and",
        or: "or",
        bit_or: "or",
        bit_xor: "xor",
      }),
      mapOpsTo.prefix({
        bit_not: "not",
        not: "not",
        neg: "-",
        int_to_dec: "$",
      }),
      mapOpsTo.infix({ mul: "*" }),
      addNimImports,
    ),
    simplegolf(
      alias(
        {
          Integer: (x) => x.value.toString(),
          Text: (x) => `"${x.value}"`,
        },
        [1, 7],
      ),
    ),
    required(
      renameIdents(),
      addVarDeclarations,
      addVarDeclarationOneToManyAssignments(),
      addVarDeclarationManyToManyAssignments((_, spine) => spine.depth > 1),
      addManyToManyAssignments((_, spine) => spine.depth > 1),
      groupVarDeclarations((_, spine) => spine.depth <= 1),
      noStandaloneVarDeclarations,
      assertInt64,
      removeImplicitConversions,
      removeSystemNamespace,
    ),
    search(useUFCS),
  ],
  detokenizer: defaultDetokenizer((a, b) => {
    const left = a[a.length - 1];
    const right = b[0];

    if (/[A-Za-z0-9_]/.test(left) && /[A-Za-z0-9_]/.test(right)) return true; // alphanums meeting

    const symbols = "=+-*/<>@$~&%|!?^.:\\";
    if (symbols.includes(left) && symbols.includes(right)) return true; // symbols meeting

    if (
      /[A-Za-z]/.test(left) &&
      ((!["var", "in", "else", "if", "while", "for"].includes(a) &&
        (symbols + `"({[`).includes(right)) ||
        right === `"`) &&
      !["=", ":", ".", "::"].includes(b)
    )
      return true; // identifier meeting an operator or string literal or opening paren

    return false;
  }),
};

export default nimLanguage;
