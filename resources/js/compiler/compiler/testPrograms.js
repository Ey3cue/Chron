
Compiler.TEST_PROGS = {
    'Everything 1':
    '{\n' +
    '    int a\n' +
    '    a = 1\n' +
    '    {\n' +
    '        int a\n' +
    '        a = 2\n' +
    '        print(a)\n' +
    '    }\n' +
    '    \n' +
    '    string b\n' +
    '    b = "alan"\n' +
    '    \n' +
    '    if (a == 1) {\n' +
    '        print(b)\n' +
    '    }\n' +
    '    \n' +
    '    string c\n' +
    '    c = "james"\n' +
    '    b = "blackstone"\n' +
    '    print(b)\n' +
    '} $\n',

    'Everything 2':
    '{\n' +
    '    int i\n' +
    '    i = 0\n' +
    '    \n' +
    '    int j\n' +
    '    j = 0\n' +
    '    \n' +
    '    while (j == 0) {\n' +
    '        i = 1 + i\n' +
    '        \n' +
    '        if (i == 3) {\n' +
    '            j = 1\n' +
    '        }\n' +
    '        \n' +
    '        print("loop ")\n' +
    '        print(i)\n' +
    '        print(" ")\n' +
    '        print(j)\n' +
    '        print("  ")\n' +
    '    }\n' +
    '    \n' +
    '    print("done")\n' +
    '} $\n',

    'Nested Everything':
    '{\n' +
    '    int i\n' +
    '    i = 0\n' +
    '    \n' +
    '    int j\n' +
    '    j = 0\n' +
    '    \n' +
    '    while (j == 0) {\n' +
    '        i = 1 + i\n' +
    '        \n' +
    '        if (i == 3) {\n' +
    '            j = 1\n' +
    '        }\n' +
    '        \n' +
    '        int g\n' +
    '        g = 0\n' +
    '        \n' +
    '        int h\n' +
    '        h = 0\n' +
    '        \n' +
    '        while (h == 0) {\n' +
    '            g = 1 + g\n' +
    '            \n' +
    '            if (g == 2) {\n' +
    '                h = 1\n' +
    '            }\n' +
    '            \n' +
    '            print("i")\n' +
    '            print(g)\n' +
    '        }\n' +
    '        \n' +
    '        print("o")\n' +
    '        print(i)\n' +
    '        print(" ")\n' +
    '    }\n' +
    '} $\n',

    'If 1':
    '{\n' +
    '    if (1==1) {\n' +
    '        print(1)\n' +
    '    }\n' +
    '    print(2)\n' +
    '} $\n',

    'If 2':
    '{\n' +
    '    int a\n' +
    '    a = 0\n' +
    '    if (a == 0) {\n' +
    '        print(0)\n' +
    '    }\n' +
    '    \n' +
    '    if (a == 1) {\n' +
    '        print(1)\n' +
    '    }\n' +
    '    \n' +
    '    print("done")\n' +
    '} $\n',

    'Infinite While':
    '{\n' +
    '    int a\n' +
    '    a = 0\n' +
    '    \n' +
    '    while true {\n' +
    '        a = 1 + a\n' +
    '        print(a)\n' +
    '    }\n' +
    '    \n' +
    '    print("done")\n' +
    '} $\n',

    'Non While':
    '{\n' +
    '    while false {\n' +
    '        print("a")\n' +
    '    }\n' +
    '    \n' +
    '    print("done")\n' +
    '} $\n',

    'String 1':
    '{\n' +
    '    string s\n' +
    '    s = "hi"\n' +
    '    print(s)\n' +
    '} $\n',

    'String 2':
    '{\n' +
    '    string s\n' +
    '    s = "nope"\n' +
    '    \n' +
    '    if true {\n' +
    '        if true {\n' +
    '            s = "yup"\n' +
    '            \n' +
    '            if false {\n' +
    '                s = "haha"\n' +
    '            }\n' +
    '        }\n' +
    '    }\n' +
    '    \n' +
    '    print(s)\n' +
    '}\n'
};

Compiler.TEST_PROGS_PROJECT2 = {
    'Everything Working':
    '{\n' +
    '    int i\n' +
    '    int j\n' +
    '    int k\n' +
    '    string a\n' +
    '    string b\n' +
    '    \n' +
    '    i = 1\n' +
    '    j = 2 + i\n' +
    '    k = 3 + j\n' +
    '    \n' +
    '    {\n' +
    '        print(1 + 2 - k)\n' +
    '        \n' +
    '        a = "hello world"\n' +
    '        b = " a b c "\n' +
    '    }\n' +
    '    {\n' +
    '        string c\n' +
    '        c = " "\n' +
    '        print(a)\n' +
    '        print(c)\n' +
    '    }\n' +
    '    print(b)\n' +
    '} $\n',

    'Redeclaration':
    '{\n' +
    '    int a\n' +
    '    string a\n' +
    '} $\n',

    'Mismatch 1':
    '{\n' +
    '    int a\n' +
    '    a = "a"\n' +
    '} $\n',

    'Mismatch 2':
    '{\n' +
    '    string a\n' +
    '    a = 1\n' +
    '} $\n' +
    '\n',

    'Adding 1':
    '{\n' +
    '    string s\n' +
    '    s = "hello"\n' +
    '    int i\n' +
    '    i = 1 + s\n' +
    '} $\n',

    'Adding 2':
    '{\n' +
    '    string s\n' +
    '    s = "hello"\n' +
    '    print(1 - s)\n' +
    '} $\n',

    'Adding 3':
    '{\n' +
    '    int i\n' +
    '    i = 1 + 2 - 1 + "a"\n' +
    '} $\n',

    'Undeclared 1':
    'i = 1',

    'Undeclared 2':
    '{\n' +
    '    {\n' +
    '        int i\n' +
    '    }\n' +
    '    {\n' +
    '        i = 0\n' +
    '    }\n' +
    '} $\n',

    'Undeclared 3':
    '{\n' +
    '    {\n' +
    '        int i\n' +
    '    }\n' +
    '    print(i)\n' +
    '} $\n',

    'Warnings':
    '{\n' +
    '    string s\n' +
    '    \n' +
    '    string t\n' +
    '    print(t)\n' +
    '    \n' +
    '    int i\n' +
    '    int j\n' +
    '    int k\n' +
    '    i = 0 + j\n' +
    '}\n',

    'You\'ll like this one':
    '{\n' +
    '   print("the best of both worlds")\n' +
    '} $\n'
};

Compiler.TEST_PROGS_PROJECT1 = {
    '{ int a ...':
    '{\n' +
    '    int a\n' +
    '    int b\n' +
    '    string c\n' +
    '    a = 2+b\n' +
    '    b= 2-5+4+ 5\n' +
    '    c="hello"\n' +
    '    {{{{}{}}{{}{{}{int d}}}}}\n' +
    '    print("hi")\n' +
    '    print(9 + "y")\n' +
    '}\n',

    'After $':
    'int a $\nInvalid Code, but the compiler doesn\'t touch it anyway...',

    'Nice CST':
    '{\n' +
    '    int a\n' +
    '    a = 2\n' +
    '} $',
    // Errors


    // Lex Errors

    // Invalid characters
    'Invalid Char':
    'int A',

    'Invalid CharList':
    'a = "aaa+bbb"',


    // Parse Errors

    // Invalid Statement
    'Invalid Stmt':
    '0 = 42',

    // Invalid Expr
    'Invalid Expr':
    '{\n' +
    '    int a\n' +
    '    a = +\n' +
    '}',

    // Invalid Expr
    'Invalid Expr 2':
    '{\n' +
    '    int a\n' +
    '    a = 2 + -3\n' +
    '}',

    // Invalid IntExpr
    'Invalid IntExpr':
    '{\n' +
    '    int a\n' +
    '    a = 2 --\n' +
    '}',

    // Invalid VarDecl
    'Invalid VarDecl':
    'int 9',

    // Invalid VarDecl
    'Invalid VarDecl 2':
    'int "a"',

    // Duplicate variable declaration
    'Duplicate var':
    '{\n' +
    '    int a\n' +
    '    char a\n' +
    '}\n',

    // Variable used before declared
    'Before dec.':
    'a = 2',
};
