module.exports = grammar({
  name: 'rescript',

  extras: $ => [
    $.comment,
    /[\s\uFEFF\u2060\u200B\u00A0]/
  ],

  supertypes: $ => [
    $.statement,
    $.declaration,
    $.expression,
    $.primary_expression,
    $.pattern,
    $._type,
    $.module_expression,
  ],

  precedences: $ => [
    [
      'unary_not',
      'member',
      'call',
      'binary_times',
      'binary_plus',
      'binary_compare',
      'binary_relation',
      'binary_and',
      'binary_or',
      'ternary',
      $.expression,
      $.function,
      $.let_binding,
    ],
    [$.module_name, $.variant_identifier],
    [$.function_type_parameters, $.function_type],
  ],

  conflicts: $ => [
    [$.unit, $.formal_parameters],
    [$.pipe_expression, $.expression],
    [$.primary_expression, $.pattern],
    [$.tuple_pattern, $._formal_parameter],
    [$.primary_expression, $._formal_parameter],
    [$.nested_module_expression, $.module_expression],
    [$.tuple_type, $._function_type_parameter],
  ],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => seq($.statement, choice(';', '\n')),

    statement: $ => choice(
      alias($._decorated_statement, $.decorated),
      $.expression_statement,
      $.declaration,
      $.block,
      $.open_statement,
      $.include_statement,
    ),

    _decorated_statement: $ => seq(
      repeat1($.decorator),
      $.declaration,
    ),

    block: $ => prec.right(seq(
      '{',
      repeat($._statement),
      '}',
    )),

    open_statement: $ => seq(
      'open',
      optional('!'),
      $.module_expression,
    ),

    include_statement: $ => seq(
      'include',
      $.module_expression,
    ),

    declaration: $ => choice(
      $.type_declaration,
      $.let_binding,
      $.module_declaration,
      $.external_declaration,
    ),

    module_declaration: $ => seq(
      'module',
      $.module_name,
      '=',
      choice($.block, $.module_expression),
    ),

    external_declaration: $ => seq(
      'external',
      $.identifier,
      $.type_annotation,
      '=',
      $.string,
    ),

    type_declaration: $ => seq(
      'type',
      $.type_identifier,
      optional(seq(
        '=',
        $._type,
      ))
    ),

    type_annotation: $ => seq(
      ':',
      $._inline_type,
    ),

    _type: $ => choice(
      $._inline_type,
      $.variant_type,
      $.record_type,
    ),

    _inline_type: $ => choice(
      $._non_function_inline_type,
      $.function_type,
    ),

    _non_function_inline_type: $ => choice(
      $._qualified_type_identifier,
      $.tuple_type,
      $.polyvar_type,
      $.object_type,
      $.generic_type,
      $.unit_type,
    ),

    tuple_type: $ => prec.dynamic(-1, seq(
      '(',
      commaSep1t($._type),
      ')',
    )),

    variant_type: $ => seq(
      optional('|'),
      barSep1($.variant_declaration),
    ),

    variant_declaration: $ => prec.right(seq(
      $.variant_identifier,
      optional($.variant_parameters),
      optional('\n'),
    )),

    variant_parameters: $ => seq(
      '(',
      commaSep1t($._type),
      ')',
    ),

    polyvar_type: $ => seq(
      choice('[', '[>', '[<',),
      optional('|'),
      barSep1($.polyvar_declaration),
      ']',
    ),

    polyvar_declaration: $ => prec.right(seq(
      $.polyvar_identifier,
      optional($.polyvar_parameters),
    )),

    polyvar_parameters: $ => seq(
      '(',
      commaSep1t($._type),
      ')',
    ),

    record_type: $ => seq(
      '{',
      commaSep1t($.record_type_field),
      '}',
    ),

    record_type_field: $ => seq(
      alias($.identifier, $.property_identifier),
      $.type_annotation,
    ),

    object_type: $ => seq(
      '{',
      choice(
        commaSep1t($._object_type_field),
        seq('.', commaSep($._object_type_field)),
        seq('..', commaSep($._object_type_field)),
      ),
      '}',
    ),

    _object_type_field: $ => alias($.object_type_field, $.field),

    object_type_field: $ => seq(
      alias($.string, $.property_identifier),
      ':',
      $._type,
    ),

    record_type_field: $ => seq(
      alias($.identifier, $.property_identifier),
      $.type_annotation,
    ),

    generic_type: $ => seq(
      $._qualified_type_identifier,
      $.type_arguments
    ),

    type_arguments: $ => seq(
      '<', commaSep1($._type), optional(','), '>'
    ),

    function_type: $ => prec.left(seq(
      $.function_type_parameters,
      '=>',
      $._type,
    )),

    function_type_parameters: $ => choice(
      $._non_function_inline_type,
      $._function_type_parameter_list,
    ),

    _function_type_parameter_list: $ => seq(
      '(',
      commaSep($._function_type_parameter),
      ')',
    ),

    _function_type_parameter: $ => choice(
      $._type,
      $.labeled_parameter,
    ),

    let_binding: $ => seq(
      'let',
      $.pattern,
      optional($.type_annotation),
      '=',
      choice($.expression, $.block),
    ),

    expression_statement: $ => $.expression,

    expression: $ => choice(
      $.primary_expression,
      $._jsx_element,
      $.jsx_fragment,
      $.unary_expression,
      $.binary_expression,
      $.ternary_expression,
    ),

    primary_expression: $ => choice(
      $.parenthesized_expression,
      $.module_nested_identifier,
      $.identifier,
      $.number,
      $.string,
      $.template_string,
      $.true,
      $.false,
      $.function,
      $.polyvar,
      $.unit,
      $.record,
      $.object,
      $.tuple,
      $.array,
      $.variant,
      $.if_expression,
      $.switch_expression,
      $.call_expression,
      $.pipe_expression,
      $.subscript_expression,
      $.member_expression,
    ),

    parenthesized_expression: $ => seq(
      '(',
      $.expression,
      ')'
    ),

    module_nested_identifier: $ => seq(
      repeat1(seq($.module_name, '.')),
      $.identifier,
    ),

    function: $ => prec.left(seq(
      choice(
        field('parameter', $.identifier),
        $._definition_signature
      ),
      '=>',
      field('body', choice(
        $.expression,
        $.block
      )),
    )),

    record: $ => seq(
      '{',
      commaSep1t($.record_field),
      '}',
    ),

    record_field: $ => seq(
      alias($.identifier, $.property_identifier),
      ':',
      $.expression,
    ),

    object: $ => seq(
      '{',
      choice(
        commaSep1t($._object_field),
        seq('.', commaSep($._object_field)),
        seq('..', commaSep($._object_field)),
      ),
      '}',
    ),

    _object_field: $ => alias($.object_field, $.field),

    object_field: $ => seq(
      alias($.string, $.property_identifier),
      ':',
      $.expression,
    ),

    tuple: $ => seq(
      '(',
      commaSep2t($.expression),
      ')',
    ),

    array: $ => seq(
      '[',
      commaSep($.expression),
      optional(','),
      ']'
    ),

    if_expression: $ => seq(
      'if',
      $.expression,
      $.block,
      repeat($.else_if_clause),
      optional($.else_clause),
    ),

    switch_expression: $ => seq(
      'switch',
      $.expression,
      '{',
      repeat1($.switch_match),
      repeat('\n'),
      '}',
    ),

    switch_match: $ => seq(
      repeat('\n'),
      '|',
      barSep1($._switch_pattern),
      '=>',
      $.expression,
    ),

    _switch_pattern: $ => choice(
      $.variant,
      $.string,
      $.number,
      $.true,
      $.false,
      $.identifier,
    ),

    else_if_clause: $ => seq(
      'else',
      'if',
      $.expression,
      $.block,
    ),

    else_clause: $ => seq(
      'else',
      $.block,
    ),

    call_expression: $ => prec('call', seq(
      field('function', $.primary_expression),
      field('arguments', alias($.call_arguments, $.arguments)),
    )),

    pipe_expression: $ => prec.left(seq(
      $.primary_expression,
      repeat('\n'),
      '->',
      choice(
        $.identifier,
        $.module_nested_identifier,
        choice($.variant_identifier, $.nested_variant_identifier),
      ),
    )),

    call_arguments: $ => seq(
      '(',
      commaSep(choice(
        $.expression,
        $.labeled_argument,
      )),
      ')'
    ),

    labeled_argument: $ => seq(
      '~',
      field('label', $.identifier),
      choice(
        alias('?', $.optional),
        seq('=', field('value', $.expression)),
      ),
    ),

    _definition_signature: $ => seq(
      field('parameters', $.formal_parameters),
      optional(field('return_type', alias($._return_type_annotation, $.type_annotation))),
    ),

    _return_type_annotation: $ => seq(
      ':',
      $._non_function_inline_type,
    ),

    formal_parameters: $ => seq(
      '(',
      optional(commaSep1t($._formal_parameter)),
      ')'
    ),

    _formal_parameter: $ => choice(
      $.pattern,
      $.positional_parameter,
      $.labeled_parameter,
      $.unit,
    ),

    positional_parameter: $ => seq(
      $.pattern,
      $.type_annotation,
    ),

    labeled_parameter: $ => seq(
      '~',
      $.identifier,
      optional($.type_annotation),
      optional(field('default_value', $._default_value)),
    ),

    _default_value: $ => seq(
      '=',
      choice(
        $.expression,
        alias('?', $.optional),
      ),
    ),

    // This negative dynamic precedence ensures that during error recovery,
    // unfinished constructs are generally treated as literal expressions,
    // not patterns.
    pattern: $ => prec.dynamic(-1, choice(
      $.identifier,
      $._destructuring_pattern,
    )),

    _destructuring_pattern: $ => choice(
      $.record_pattern,
      $.tuple_pattern,
    ),

    record_pattern: $ => seq(
      '{',
      commaSep1t(choice(
        //$.pair_pattern,
        //$.object_assignment_pattern,
        alias($.identifier, $.shorthand_property_identifier_pattern)
      )),
      '}'
    ),

    tuple_pattern: $ => seq(
      '(',
      commaSep2t($.pattern),
      ')',
    ),

    _jsx_element: $ => choice($.jsx_element, $.jsx_self_closing_element),

    jsx_element: $ => seq(
      field('open_tag', $.jsx_opening_element),
      repeat($._jsx_child),
      field('close_tag', $.jsx_closing_element)
    ),

    jsx_fragment: $ => seq('<', '>', repeat($._jsx_child), '<', '/', '>'),

    jsx_expression: $ => seq(
      '{',
      optional(choice(
        $.expression,
        $.spread_element
      )),
      '}'
    ),

    _jsx_child: $ => choice(
      $.identifier,
      $._jsx_element,
      $.jsx_fragment,
      $.jsx_expression
    ),

    jsx_opening_element: $ => prec.dynamic(-1, seq(
      '<',
      field('name', $._jsx_element_name),
      repeat(field('attribute', $.jsx_attribute)),
      '>'
    )),

    _jsx_identifier: $ => alias(
      choice($.identifier, $.module_name),
      $.jsx_identifier
    ),

    nested_jsx_identifier: $ => prec('member', seq(
      choice($._jsx_identifier, $.nested_jsx_identifier),
      '.',
      $._jsx_identifier
    )),

    _jsx_element_name: $ => choice(
      $._jsx_identifier,
      $.nested_jsx_identifier,
    ),

    jsx_closing_element: $ => seq(
      '<',
      '/',
      field('name', $._jsx_element_name),
      '>'
    ),

    jsx_self_closing_element: $ => seq(
      '<',
      field('name', $._jsx_element_name),
      repeat(field('attribute', $.jsx_attribute)),
      '/',
      '>'
    ),

    _jsx_attribute_name: $ => alias($.identifier, $.property_identifier),

    jsx_attribute: $ => seq(
      optional('?'),
      $._jsx_attribute_name,
      optional(seq(
        '=',
        $._jsx_attribute_value
      ))
    ),

    _jsx_attribute_value: $ => choice(
      $.primary_expression,
      $.jsx_expression,
    ),

    decorator: $ => seq('@', $.decorator_identifier, optional($.decorator_arguments)),

    decorator_arguments: $ => seq(
      '(',
      commaSep($.string),
      ')',
    ),

    subscript_expression: $ => prec.right('member', seq(
      field('object', $.primary_expression),
      '[', field('index', $.expression), ']'
    )),

    member_expression: $ => prec('member', seq(
      field('record', $.primary_expression),
      '.',
      field('property', alias($.identifier, $.property_identifier)),
    )),

    spread_element: $ => seq('...', $.expression),

    ternary_expression: $ => prec.right('ternary', seq(
      field('condition', $.expression),
      '?',
      field('consequence', $.expression),
      ':',
      field('alternative', $.expression)
    )),

    binary_expression: $ => choice(
      ...[
        ['&&', 'binary_and'],
        ['||', 'binary_or'],
        ['+', 'binary_plus'],
        ['+.', 'binary_plus'],
        ['-', 'binary_plus'],
        ['-.', 'binary_plus'],
        ['*', 'binary_times'],
        ['*.', 'binary_times'],
        ['/', 'binary_times'],
        ['/.', 'binary_times'],
        ['<', 'binary_relation'],
        ['<=', 'binary_relation'],
        ['==', 'binary_relation'],
        ['===', 'binary_relation'],
        ['!=', 'binary_relation'],
        ['!==', 'binary_relation'],
        ['>=', 'binary_relation'],
        ['>', 'binary_relation'],
      ].map(([operator, precedence]) =>
        prec.left(precedence, seq(
          field('left', $.expression),
          field('operator', operator),
          field('right', $.expression)
        ))
      )
    ),

    unary_expression: $ => choice(...[
      ['!', 'unary_not'],
      ['-', 'unary_not'],
      ['-.', 'unary_not'],
      ['+', 'unary_not'],
      ['+.', 'unary_not'],
    ].map(([operator, precedence]) =>
      prec.left(precedence, seq(
        field('operator', operator),
        field('argument', $.expression)
      ))
    )),

    variant: $ => prec.right(seq(
      choice($.variant_identifier, $.nested_variant_identifier),
      optional(alias($.variant_arguments, $.arguments)),
    )),

    nested_variant_identifier: $ => seq(repeat1(seq($.module_name, '.')), $.variant_identifier),

    variant_arguments: $ => seq(
      '(',
      commaSep($.expression),
      optional(','),
      ')',
    ),

    _qualified_type_identifier: $ =>
      choice(
        $.type_identifier,
        $.nested_type_identifier
      ),

    nested_type_identifier: $ => seq(repeat1(seq($.module_name, '.')), $.type_identifier),

    module_expression: $ => choice(
      $.module_name,
      $.nested_module_expression,
    ),

    nested_module_expression: $ => prec.left(seq(
      $.module_expression,
      '.',
      $.module_expression,
    )),

    variant_identifier: $ => /[A-Z][a-zA-Z0-9_]*/,

    polyvar: $ => seq('#', /[a-zA-Z0-9_]*/),

    polyvar_identifier: $ => seq(
      '#',
      choice(
        /[a-zA-Z0-9_]+/,
        seq(optional('\\'), $.string)
      ),
    ),

    type_identifier: $ => /[a-z_'][a-zA-Z0-9_]*/,

    identifier: $ => choice(
      /[a-z_][a-zA-Z0-9_']*/,
      $._escape_identifier,
    ),

    _escape_identifier: $ => token(seq('\\', '"', /[^"]+/ , '"')),

    module_name: $ => /[A-Z][a-zA-Z0-9_]*/,

    decorator_identifier: $ => /[a-zA-Z0-9_\.]+/,

    number: $ => {
      const hex_literal = seq(
        choice('0x', '0X'),
        /[\da-fA-F](_?[\da-fA-F])*/
      )

      const decimal_digits = /\d(_?\d)*/
      const signed_integer = seq(optional(choice('-', '+')), decimal_digits)
      const exponent_part = seq(choice('e', 'E'), signed_integer)

      const binary_literal = seq(choice('0b', '0B'), /[0-1](_?[0-1])*/)

      const octal_literal = seq(choice('0o', '0O'), /[0-7](_?[0-7])*/)

      const bigint_literal = seq(choice(hex_literal, binary_literal, octal_literal, decimal_digits), 'n')

      const decimal_integer_literal = choice(
        '0',
        seq(optional('0'), /[1-9]/, optional(seq(optional('_'), decimal_digits)))
      )

      const decimal_literal = choice(
        seq(decimal_integer_literal, '.', optional(decimal_digits), optional(exponent_part)),
        seq('.', decimal_digits, optional(exponent_part)),
        seq(decimal_integer_literal, exponent_part),
        seq(decimal_digits),
      )

      return token(choice(
        hex_literal,
        decimal_literal,
        binary_literal,
        octal_literal,
        bigint_literal,
      ))
    },

    unit: $ => seq('(', ')'),
    unit_type: $ => 'unit',

    true: $ => 'true',
    false: $ => 'false',

    string: $ => seq(
      '"',
      repeat(choice(
        alias($.unescaped_double_string_fragment, $.string_fragment),
        $.escape_sequence
      )),
      '"'
    ),

    // Workaround to https://github.com/tree-sitter/tree-sitter/issues/1156
    // We give names to the token() constructs containing a regexp
    // so as to obtain a node in the CST.
    //
    unescaped_double_string_fragment: $ =>
      token.immediate(prec(1, /[^"\\]+/)),

    escape_sequence: $ => token.immediate(seq(
      '\\',
      choice(
        /[^xu0-7]/,
        /[0-7]{1,3}/,
        /x[0-9a-fA-F]{2}/,
        /u[0-9a-fA-F]{4}/,
        /u{[0-9a-fA-F]+}/
      )
    )),

    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: $ => token(choice(
      seq('//', /.*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/'
      )
    )),

    template_string: $ => seq(
      choice(
        '`',
        'j`',
      ),
      repeat(choice(
        $._unescaped_template_string_fragment,
        $.template_substitution,
        choice(
          alias('\\`', $.escape_sequence),
          $.escape_sequence,
        ),
      )),
      '`'
    ),

    template_substitution: $ => choice(
      seq('$', $.identifier),
      seq('${', $.expression, '}'),
    ),

    _unescaped_template_string_fragment: $ =>
      token.immediate(prec(1, /[^`\\\$]+/)),
  },
});

function barSep1(rule) {
  return seq(rule, repeat(seq('|', rule)));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep2(rule) {
  return seq(rule, ',', commaSep1(rule));
}

function commaSep1t(rule) {
  return seq(commaSep1(rule), optional(','));
}

function commaSep2t(rule) {
  return seq(commaSep2(rule), optional(','));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}
