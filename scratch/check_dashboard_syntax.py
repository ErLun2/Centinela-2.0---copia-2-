try:
    with open(r"c:\Users\vidal\OneDrive\Anti-Gravity\Centinela 2.0 - copia (2)\src\pages\CompanyDashboard.jsx", 'r', encoding='utf-8') as f:
        content = f.read()
    # Basic check for balanced braces (not perfect for JSX but helps)
    if content.count('{') != content.count('}'):
        print(f"Brace mismatch: {{: {content.count('{')}, }}: {content.count('}')}")
    if content.count('(') != content.count(')'):
        print(f"Parenthesis mismatch: (: {content.count('(')}, ): {content.count(')')}")
    print("Basic check complete.")
except Exception as e:
    print(f"Error: {e}")
