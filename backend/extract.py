import re

with open('main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get_block(start_line_idx):
    block = []
    i = start_line_idx
    # Capture decorators
    while i < len(lines) and lines[i].startswith('@'):
        block.append(lines[i])
        i += 1
    # Capture def
    while i < len(lines) and (lines[i].startswith('async def') or lines[i].startswith('def ')):
        block.append(lines[i])
        i += 1
    # Check for multi-line def args
    while i < len(lines) and not lines[i-1].strip().endswith(':'):
        block.append(lines[i])
        i += 1
    # Capture body
    while i < len(lines):
        if not lines[i].strip():
            block.append(lines[i])
            i += 1
            continue
        if not lines[i].startswith(' ') and not lines[i].startswith('\t'):
            break
        block.append(lines[i])
        i += 1
    return ''.join(block), start_line_idx, i - 1

targets = [
    '@app.post("/auth/register")',
    '@app.post("/auth/login")',
    '@app.get("/auth/me")',
    '@app.put("/auth/me")',
    '@app.get("/voters")',
    '@app.get("/authenticate/{voter_id}")',
    '@app.get("/candidates")',
    '@app.post("/candidates")',
    '@app.put("/candidates/{id}")',
    '@app.delete("/candidates/{id}")',
    '@app.post("/vote")',
    '@app.get("/results")'
]

for t in targets:
    for i, line in enumerate(lines):
        if t in line:
            block, start, end = get_block(i)
            print(f'Found {t} from line {start+1} to {end+1}')
            break
