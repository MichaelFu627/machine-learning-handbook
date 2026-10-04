import ast
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_catalog_prerequisites_and_translations():
    catalog = json.loads((ROOT / 'content/lessons.json').read_text())
    slugs = {lesson['slug'] for lesson in catalog}
    assert len(slugs) == len(catalog)
    seen = set()
    for lesson in catalog:
        assert set(lesson['prerequisites']) <= seen
        for locale in ['en', 'zh-CN']:
            assert (ROOT / 'content' / locale / f"{lesson['slug']}.mdx").is_file()
            assert lesson['quiz']['answer'] < len(lesson['quiz']['options'][locale])
        seen.add(lesson['slug'])


def test_legacy_math_strings_have_no_control_characters():
    for file in (ROOT / 'legacy/streamlit/pages').glob('*.py'):
        tree = ast.parse(file.read_text())
        for node in ast.walk(tree):
            if isinstance(node, ast.Constant) and isinstance(node.value, str):
                assert not any(ord(c) < 32 and c not in '\n\t\r' for c in node.value), f'{file}:{node.lineno}'
