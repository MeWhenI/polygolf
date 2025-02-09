import {
  functionCall as func,
  indexCall,
  methodCall as method,
  op,
  listType,
  textType,
  builtin,
  infix,
  int,
  propertyCall as property,
  isText,
  text,
  implicitConversion,
  list,
  prefix,
} from "../../IR";
import {
  type Language,
  required,
  search,
  simplegolf,
  flattenTree,
  defaultWhitespaceInsertLogic,
} from "../../common/Language";

import emitProgram from "./emit";
import {
  removeImplicitConversions,
  printIntToPrint,
  methodsAsFunctions,
  mapOps,
  mapOpsTo,
  mapMutationTo,
} from "../../plugins/ops";
import { alias, renameIdents } from "../../plugins/idents";
import {
  forArgvToForEach,
  forRangeToForCLike,
  forRangeToForEach,
} from "../../plugins/loops";
import { golfStringListLiteral } from "../../plugins/static";
import {
  golfLastPrint,
  implicitlyConvertPrintArg,
  putcToPrintChar,
} from "../../plugins/print";
import {
  useDecimalConstantPackedPrinter,
  useLowDecimalListPackedPrinter,
} from "../../plugins/packing";
import {
  replaceToSplitAndJoin,
  textGetToIntToTextGet,
  textToIntToFirstIndexTextGetToInt,
  textToIntToTextGetToInt,
} from "../../plugins/textOps";
import { addOneToManyAssignments, inlineVariables } from "../../plugins/block";
import {
  applyDeMorgans,
  bitnotPlugins,
  decomposeIntLiteral,
  equalityToInequality,
  lowBitsPlugins,
  pickAnyInt,
  truncatingOpsPlugins,
  useIntegerTruthiness,
} from "../../plugins/arithmetic";
import { tableToListLookup } from "../../plugins/tables";
import { floodBigints, mapVarsThatNeedBigint } from "../../plugins/types";
import { forRangeToForEachKey, propertyCallToIndexCall } from "./plugins";

const javascriptLanguage: Language = {
  name: "Javascript",
  extension: "js",
  emitter: emitProgram,
  phases: [
    required(printIntToPrint),
    simplegolf(golfLastPrint()),
    search(
      golfStringListLiteral(),
      forRangeToForEach("at[Array]", "at[List]", "at[codepoint]"),
      equalityToInequality,
      useDecimalConstantPackedPrinter,
      useLowDecimalListPackedPrinter,
      textToIntToTextGetToInt,
      ...bitnotPlugins,
      ...lowBitsPlugins,
      applyDeMorgans,
      useIntegerTruthiness,
      tableToListLookup,
      inlineVariables,
      forArgvToForEach,
      replaceToSplitAndJoin,
      decomposeIntLiteral(),
      forRangeToForEachKey,
    ),
    required(
      pickAnyInt,
      floodBigints("int53", {
        Assignment: "bigint",
        add: "bigint",
        sub: "bigint",
        mul: "bigint",
        mod: "bigint",
        pow: "bigint",
        bit_and: "bigint",
        bit_xor: "bigint",
        bit_or: "bigint",
        bit_shift_left: "bigint",
        bit_shift_right: "bigint",
        lt: "int",
        leq: "int",
        "eq[Int]": "int",
        "neq[Int]": "int",
        geq: "int",
        gt: "int",
        int_to_dec: "bigint",
      }),
      mapVarsThatNeedBigint("int53", (x) => func("BigInt", x)),
      forArgvToForEach,
      putcToPrintChar,
    ),
    required(
      forRangeToForCLike,
      mapOpsTo.builtin({
        true: "true",
        false: "false",
        argv: "arguments",
      }),
      mapOps({
        "at[argv]": (x) =>
          op["at[List]"](
            { ...builtin("arguments"), type: listType(textType()) },
            x[0],
          ),
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

      ...truncatingOpsPlugins,
      textGetToIntToTextGet,
      implicitlyConvertPrintArg,
      textToIntToFirstIndexTextGetToInt,
      mapMutationTo.method({
        append: "push",
      }),
      mapOps({
        "at[Ascii]": (x) => indexCall(x[0], x[1]),
        "slice[List]": (x) => method(x[0], "slice", x[1], op.add(x[1], x[2])),
        "slice[Ascii]": (x) => method(x[0], "slice", x[1], op.add(x[1], x[2])),
        "char[Ascii]": (x) => func("String.fromCharCode", x),
        "char[byte]": (x) => func("String.fromCharCode", x),
        "sorted[Ascii]": (x) =>
          method(
            x[0].kind === "List" ? x[0] : list([prefix("...", x[0])]),
            "sort",
          ),
        div: (x, s) =>
          s.node.targetType !== "bigint"
            ? func("Math.floor", infix("/", x[0], x[1]))
            : undefined,
        trunc_div: (x, s) =>
          s.node.targetType !== "bigint"
            ? func("Math.floor", infix("/", x[0], x[1]))
            : undefined,
        int_to_bin: (x) => method(x[0], "toString", int(2n)),
        int_to_bin_aligned: (x) =>
          method(method(x[0], "toString", int(2n)), "padStart", x[1], int(0n)),
        int_to_hex: (x) => method(x[0], "toString", int(16n)),
        int_to_Hex: (x) =>
          method(method(x[0], "toString", int(16n)), "toUpperCase"),
        int_to_hex_aligned: (x) =>
          method(method(x[0], "toString", int(16n)), "padStart", x[1], int(0n)),
        int_to_Hex_aligned: (x) =>
          method(
            method(method(x[0], "toString", int(16n)), "toUpperCase"),
            "padStart",
            x[1],
            int(0n),
          ),
        "size[List]": (x) => property(x[0], "length"),
        "size[Ascii]": (x) => property(x[0], "length"),
        "size[Table]": (x) => property(func("Object.keys", x[0]), "length"),
        right_align: (x) => method(x[0], "padStart", x[1]),
        join: (x) => method(x[0], "join", ...(isText(",")(x[1]) ? [] : [x[1]])),
        int_to_dec: (x) =>
          op["concat[Text]"](text(""), implicitConversion("int_to_dec", x[0])),
        dec_to_int: (x) =>
          op.bit_not(op.bit_not(implicitConversion("dec_to_int", x[0]))),
        "reversed[List]": (x) => method(x[0], "reverse"),
        "reversed[Ascii]": (x) =>
          method(
            method(list([prefix("...", x[0])]), "reverse"),
            "join",
            text(""),
          ),
        "reversed[codepoint]": (x) =>
          method(
            method(list([prefix("...", x[0])]), "reverse"),
            "join",
            text(""),
          ),
        append: (x) => op["concat[List]"](x[0], list([x[1]])),
        bool_to_int: (x) => implicitConversion("bool_to_int", x[0]),
        int_to_bool: (x) => implicitConversion("int_to_bool", x[0]),
        "contains[Table]": (x) => infix("in", x[1], x[0]),
        bit_count: (x) =>
          property(
            method(op.int_to_bin(x[0]), "replace", builtin("/0/g,``")),
            "length",
          ),
      }),
      mapMutationTo.prefix({
        succ: "++",
        pred: "--",
      }),
      mapMutationTo.infix({
        pow: "**=",
        mul: "*=",
        div: "/=",
        trunc_div: "/=",
        mod: "%=",
        rem: "%=",
        add: "+=",
        "concat[Text]": "+=",
        sub: "-=",
        bit_shift_left: "<<=",
        bit_shift_right: ">>=",
        bit_and: "&=",
        bit_xor: "^=",
        bit_or: "|=",
        and: "&&=",
        or: "||=",
      }),
      mapOpsTo.method({
        "ord_at[Ascii]": "charCodeAt",
        "contains[List]": "includes",
        "contains[Array]": "includes",
        "contains[Text]": "includes",
        include: "add",
        "find[List]": "indexOf",
        "find[Ascii]": "indexOf",
        "concat[List]": "concatenate",
        split: "split",
        replace: "replaceAll",
        repeat: "repeat",
        starts_with: "startsWith",
        ends_with: "endsWith",
      }),
      mapOpsTo.func({
        abs: "abs",
        max: "Math.max",
        min: "Math.min",
        "println[Text]": "print",
        "print[Text]": "write",
      }),
      mapOpsTo.infix({
        pow: "**",
        div: "/",
        trunc_div: "/",
        mod: "%",
        rem: "%",
        add: "+",
        "concat[Text]": "+",
        sub: "-",
        bit_shift_left: "<<",
        bit_shift_right: ">>",
        bit_and: "&",
        bit_xor: "^",
        bit_or: "|",
        lt: "<",
        leq: "<=",
        "eq[Int]": "==",
        "eq[Text]": "==",
        "neq[Int]": "!=",
        "neq[Text]": "!=",
        geq: ">=",
        gt: ">",
        and: "&&",
        or: "||",
      }),
      mapOpsTo.prefix({
        neg: "-",
        bit_not: "~",
        not: "!",
      }),
      mapOpsTo.infix({ mul: "*" }),
      methodsAsFunctions,
    ),
    simplegolf(addOneToManyAssignments()),
    search(propertyCallToIndexCall),
    simplegolf(
      alias({
        Identifier: (n, s) =>
          n.builtin &&
          (s.parent?.node.kind !== "PropertyCall" || s.pathFragment !== "ident")
            ? n.name
            : undefined,
        Integer: (x) => x.value.toString(),
        Text: (x) => `"${x.value}"`,
      }),
    ),
    required(renameIdents(), removeImplicitConversions),
  ],
  detokenizer(tree) {
    let result = "";
    flattenTree(tree).forEach((token, i, tokens) => {
      if (i === tokens.length - 1) result += token;
      else {
        const nextToken = tokens[i + 1];
        if (token === "\n" && "([`+-/".includes(nextToken[0])) {
          token = ";";
        }
        result += token;
        if (defaultWhitespaceInsertLogic(token, nextToken)) {
          result += " ";
        }
      }
    });
    return result;
  },
};

export default javascriptLanguage;
