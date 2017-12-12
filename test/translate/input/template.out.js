var __$0 = ['a', 'b', 'c\n'], __$1 = (__$0.raw = ["a", "b", "c\\n"]), __$2 = ['a', 'b\n\
', ' c\u0060'], __$3 = (__$2.raw = ["a", "b\n", " c\\u0060"]), __$4 = ['foo', ''], __$5 = (__$4.raw = __$4.slice(0)), __$6 = [''], __$7 = (__$6.raw = __$6.slice(0)); 'abcdefg';
'abc$efg';
'abc\'efg';
'abc"efg';
'abc' + (d) + 'efg';
'abc\n\
\n\
\n\
efg';
'"""';
(html(__$0, x, y));
(html(__$2, x, y));
(html(__$4, bar));

// asi
1
;(abc(__$6))
