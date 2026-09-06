import json

with open("public/locales/kmr/translation.json", "r", encoding="utf-8") as f:
    kmr = json.load(f)

print("KMR keys outside experiments:", [k for k in kmr.keys() if k != "experiments"])
