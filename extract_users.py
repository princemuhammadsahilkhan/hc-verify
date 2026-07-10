import io
with io.open("diff.txt", "r", encoding="utf-16le") as f:
    lines = f.read().splitlines()

in_users = False
for line in lines:
    if '+      {tab === "Users" && (' in line:
        in_users = True
    if in_users and '+      {tab === "' in line and not '"Users"' in line:
        break
    if in_users and line.startswith('+'):
        print(line[1:])
