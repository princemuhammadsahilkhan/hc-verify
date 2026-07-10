import io
with io.open("diff.txt", "r", encoding="utf-16le") as f:
    lines = f.read().splitlines()

in_voters = False
out_voters = []
in_votes = False
out_votes = []

for line in lines:
    if '+      {tab === "Voters" && (' in line:
        in_voters = True
    if '+      {tab === "Votes" && (' in line:
        in_voters = False
        in_votes = True
    
    if in_votes and ('+      {tab === "Elections" && (' in line or '+      {/* ── MISSING TABS' in line):
        in_votes = False

    if in_voters and line.startswith('+'):
        out_voters.append(line[1:])
    if in_votes and line.startswith('+'):
        out_votes.append(line[1:])

with io.open("voters.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out_voters))

with io.open("votes.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out_votes))
