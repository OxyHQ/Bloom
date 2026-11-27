from unittest import TestCase

from tree_sitter import Language, Parser
import tree_sitter_bloom


class TestLanguage(TestCase):
    def test_can_load_grammar(self):
        try:
            Parser(Language(tree_sitter_bloom.language()))
        except Exception:
            self.fail("Error loading Bloom grammar")

    def test_parses_a_view(self):
        parser = Parser(Language(tree_sitter_bloom.language()))
        tree = parser.parse(
            b'public struct Greeting: View {\n'
            b'  let name: String\n'
            b'  var body: some View {\n'
            b'    Text("Hello, \\(name)")\n'
            b'      .padding(.md)\n'
            b'  }\n'
            b'}\n'
        )
        self.assertFalse(tree.root_node.has_error)
        self.assertEqual(tree.root_node.children[0].type, "struct_declaration")
