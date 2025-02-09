# Op with associative OpCode

These are internally represented as variadic operations. If they are nested, they are automagically simplified.

```polygolf
$a:-oo..oo <- 0;
$b:-oo..oo <- 0;
$c:-oo..oo <- 0;
print_int (($a + $b) + $c);
```

```polygolf nogolf
$a:-oo..oo <- 0;
$b:-oo..oo <- 0;
$c:-oo..oo <- 0;
print_int (+ $a $b $c);
```

```polygolf
$a:-oo..oo <- 0;
$b:-oo..oo <- 0;
$c:-oo..oo <- 0;
print_int ((($a + 5) + $c) + 4);
```

```polygolf nogolf
$a:-oo..oo <- 0;
$b:-oo..oo <- 0;
$c:-oo..oo <- 0;
print_int (+ 9 $a $c);
```

```polygolf
$a:-oo..oo <- 0;
$b:-oo..oo <- 0;
$c:-oo..oo <- 0;
print_int (((4 * $a) + 3) - $a);
```

```polygolf nogolf
$a:-oo..oo <- 0;
$b:-oo..oo <- 0;
$c:-oo..oo <- 0;
print_int (3 + (3 * $a));
```

```polygolf
$a:-oo..oo <- 0;
$b:-oo..oo <- 0;
$c:-oo..oo <- 0;
print_int (- $a);
```

```polygolf nogolf
$a:-oo..oo <- 0;
$b:-oo..oo <- 0;
$c:-oo..oo <- 0;
print_int (-1 * $a);
```

```polygolf
$a:-oo..oo <- 0;
$b:-oo..oo <- 0;
$c:-oo..oo <- 0;
print_int ($a - $b);
```

```polygolf nogolf
$a:-oo..oo <- 0;
$b:-oo..oo <- 0;
$c:-oo..oo <- 0;
print_int ($a + (-1 * $b));
```

```polygolf
$a:-oo..oo <- 0;
print_int (($a - (2 * $a)) + $a);
```

```polygolf nogolf
$a:-oo..oo <- 0;
print_int 0;
```

```polygolf
$a:Text <- "x";
$b:Text <- "x";
print (($a .. "abc") .. ("def" .. $b));
```

```polygolf nogolf
$a:Text <- "x";
$b:Text <- "x";
print (.. $a "abcdef" $b);
```
