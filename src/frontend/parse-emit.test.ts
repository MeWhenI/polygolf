import { normalize } from "@/common/compile";

describe("Restricted nodes: parse - emit match", () => {
  for (const t of [
    `implicit_conversion "dec_to_int" "1";`,
    `var_declaration $x:Int;`,
    `var_declaration_with_assignment ($x:Int <- 0);`,
    `var_declaration_block (var_declaration $x:Int) (var_declaration $y:Int);`,
    `many_to_many_assignment {$x; $y} {"x"; "y"};`,
    `one_to_many_assignment {$x; $y} "x";`,
    `index_call $x $y;`,
    `range_index_call $x $y $z $w;`,
    `method_call $o "name" $x $y;`,
    `property_call $o "name";`,
    `infix "name" $x $y;`,
    `prefix "name" $x;`,
    `builtin "name";`,
    `id "name!";`,
    `import "name" "x" "y";`,
    `for_range_inclusive $x $s $e 1 $body;`,
    `for_difference_range $x $s $d 1 $body;`,
    `for $_ 0 $e 2 $body;`,
    `for $i 0 $e 2 $body;`,
    `for $i $s $e $body;`,
    `for $i $e $body;`,
    `for $e $body;`,
    `for_range_inclusive $_ $s $e 1 $body;`,
    `for_each $x $col $body;`,
    `for_each_key $x $col $body;`,
    `for_each_pair $k $v $col $body;`,
    `for_c_like $i $c $a $body;`,
    `named_arg "name" $x;`,
    `1:1..1:"int";`,
  ]) {
    test(t.split(" ")[0], () => {
      const normalized = normalize(t);
      expect(normalize(normalized)).toEqual(normalized);
    });
  }
});
