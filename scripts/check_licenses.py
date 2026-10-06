"""Contrôle des licences des paquets Python installés (via pip-licenses)."""

import json
import re
import subprocess
import sys

PERMISSIVE = re.compile(
    r"^(mit(-0)?|isc|apache|bsd|psf|python|0bsd|unlicense|cc0|zlib|blueoak)", re.IGNORECASE
)
COPYLEFT = re.compile(r"(^|[^a-z])(a|l)?gpl|gnu (affero|lesser|general)|(^|[^a-z])mpl|mozilla", re.IGNORECASE)


def load_allowlist(path):
    allowed = set()
    try:
        lines = open(path, encoding="utf-8").read().splitlines()
    except FileNotFoundError:
        return allowed
    for line in lines:
        entry = line.split("#", 1)[0].strip()
        if entry:
            allowed.add(entry.lower())
    return allowed


def classify(expression):
    """Return 'ok', 'copyleft' or 'unknown' for a license string / SPDX expression."""
    text = expression.strip().strip("()")
    if not text or text.upper() == "UNKNOWN":
        return "unknown"
    # "A OR B": acceptable if one alternative is acceptable.
    alternatives = re.split(r"\s+OR\s+|;", text)
    verdicts = []
    for alt in alternatives:
        parts = re.split(r"\s+AND\s+", alt)
        part_verdicts = [
            "copyleft" if COPYLEFT.search(p) else "ok" if PERMISSIVE.match(p.strip()) else "unknown"
            for p in parts
        ]
        if "copyleft" in part_verdicts:
            verdicts.append("copyleft")
        elif "unknown" in part_verdicts:
            verdicts.append("unknown")
        else:
            verdicts.append("ok")
    if "ok" in verdicts:
        return "ok"
    return "copyleft" if "copyleft" in verdicts else "unknown"


def main():
    allowlist = load_allowlist(sys.argv[1])
    out = subprocess.run(
        [sys.executable, "-m", "piplicenses", "--format=json", "--from=mixed"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    packages = json.loads(out)
    problems = 0
    for pkg in packages:
        name, version, lic = pkg["Name"], pkg["Version"], pkg["License"]
        verdict = classify(lic)
        if verdict == "ok":
            continue
        if name.lower() in allowlist or f"{name}@{version}".lower() in allowlist:
            print(f"  exception justifiée : {name} {version} ({lic})")
            continue
        problems += 1
        label = "RÉCIPROCITÉ" if verdict == "copyleft" else "INCONNUE/NON RECONNUE"
        print(f"  [{label}] {name} {version} : {lic}", file=sys.stderr)
    print(f"{len(packages)} paquets Python analysés, {problems} problème(s).")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
