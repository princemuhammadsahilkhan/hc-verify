import re

with open(r'frontend/src/pages/AdminPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'const token = localStorage\.getItem\(\"adminToken\"\);\s*const authHeader = \{ headers: \{ Authorization: \Bearer \$\{token\}\ \} \};\s*', '', content)
content = re.sub(r'const authHeader = \{ headers: \{ Authorization: \Bearer \$\{localStorage\.getItem\(\"adminToken\"\)\}\ \} \};\s*', '', content)
content = re.sub(r',\s*authHeader', '', content)

with open(r'frontend/src/pages/AdminPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Replaced authHeaders.')