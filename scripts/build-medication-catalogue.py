#!/usr/bin/env python3
"""
Builds data/medications.json, the medication catalogue for the assessment search (10 §3.1).

Source: the European Medicines Agency "Article 57 product data" list, which names every medicine
authorised in the EU/EEA. We keep products authorised in Cyprus, in the United Kingdom (Northern
Ireland, the part of the UK market still in the list) and EU-wide (centrally authorised), so the
names match what people in the UK and Cyprus see on their packs. Reproduction of EMA data is
authorised provided the source is acknowledged.

Each active substance gets a plain-language class from its ATC code, looked up once here through
the U.S. National Library of Medicine RxClass service, so the app never calls an API at run time.

Usage (standard library only):
  python3 scripts/build-medication-catalogue.py            # downloads the EMA list
  python3 scripts/build-medication-catalogue.py art57.xlsx # or reads a local copy
"""
import json
import re
import sys
import urllib.parse
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from pathlib import Path
from xml.etree.ElementTree import iterparse

EMA_URL = 'https://www.ema.europa.eu/en/documents/other/article-57-product-data_en.xlsx'
CLASS_URL = 'https://rxnav.nlm.nih.gov/REST/rxclass/class/byDrugName.json'
COUNTRIES = {'Cyprus', 'United Kingdom (Northern Ireland)', 'European Union'}
OUT = Path(__file__).resolve().parent.parent / 'data' / 'medications.json'
CACHE = Path(__file__).resolve().parent / '.medication-classes.json'
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

# Must match MedicationClassKey in lib/medications.ts. Most specific ATC prefix wins.
ATC_CLASSES = [
    ('N05AN', 'moodStabiliser'), ('N06A', 'antidepressant'), ('N05A', 'antipsychotic'),
    ('N05B', 'anxiolytic'), ('N05C', 'sleepAid'), ('N06B', 'stimulant'), ('N03', 'moodStabiliser'),
    ('N02', 'painRelief'), ('M01', 'antiInflammatory'), ('R03', 'inhaler'), ('R06', 'antihistamine'),
    ('C', 'heart'), ('A10', 'diabetes'), ('H03', 'thyroid'), ('G03', 'hormone'), ('H02', 'hormone'),
    ('J01', 'antibiotic'), ('A02', 'stomach'), ('A11', 'supplement'), ('A12', 'supplement'), ('B03', 'supplement'),
]
CLASS_KEYS = sorted({k for _, k in ATC_CLASSES})

# Salt and form words dropped to get the generic name ("Sertraline Hydrochloride" -> "Sertraline").
SALTS = re.compile(
    r'\b(hydrochloride|dihydrochloride|hydrobromide|sodium|potassium|calcium|magnesium|maleate|besilate|'
    r'besylate|mesilate|mesylate|tartrate|bitartrate|succinate|fumarate|hemifumarate|citrate|acetate|'
    r'sulfate|sulphate|phosphate|bromide|chloride|monohydrate|dihydrate|trihydrate|hemihydrate|'
    r'sesquihydrate|anhydrous|oxalate|lactate|gluconate|tosilate|embonate|pamoate|disodium|dipropionate|'
    r'propionate|furoate|valerate|xinafoate|hyclate|arginine|lysine|tromethamine|trometamol|base|'
    r'decanoate|enantate|palmitate|benzoate|nitrate|salicylate|carbonate|tetrahydrate|hydrogen|pheur|dc|bp|usp|ph\. ?eur\.?)(?=\W|$)',
    re.I,
)
# INN names RxNorm only knows by their U.S. name, used for the class lookup only.
US_NAMES = {'paracetamol': 'acetaminophen', 'salbutamol': 'albuterol', 'adrenaline': 'epinephrine',
            'noradrenaline': 'norepinephrine', 'glyceryl trinitrate': 'nitroglycerin', 'ciclosporin': 'cyclosporine',
            'colecalciferol': 'cholecalciferol', 'beclometasone': 'beclomethasone', 'dexamfetamine': 'dextroamphetamine',
            'aciclovir': 'acyclovir', 'cefalexin': 'cephalexin', 'mesalazine': 'mesalamine', 'lidocaine': 'lidocaine',
            'levothyroxine': 'levothyroxine', 'estradiol': 'estradiol', 'pethidine': 'meperidine'}


def read_rows(data: bytes):
    z = zipfile.ZipFile(BytesIO(data))
    shared = []
    for _, el in iterparse(z.open('xl/sharedStrings.xml')):
        if el.tag == NS + 'si':
            shared.append(''.join(t.text or '' for t in el.iter(NS + 't')))
            el.clear()
    for _, el in iterparse(z.open('xl/worksheets/sheet1.xml')):
        if el.tag != NS + 'row':
            continue
        row = {}
        for c in el.iter(NS + 'c'):
            v = c.find(NS + 'v')
            if v is None:
                continue
            col = 0
            for ch in re.match(r'[A-Z]+', c.get('r')).group(0):
                col = col * 26 + ord(ch) - 64
            row[col - 1] = shared[int(v.text)] if c.get('t') == 's' else v.text
        el.clear()
        yield row


RELEASE = {'xl', 'xr', 'sr', 'cr', 'mr', 'la', 'er', 'odt', 'cd', 'pr'}


def title(s: str) -> str:
    s = re.sub(r'\s+', ' ', s).strip()
    if s.isupper() or s.islower():
        s = s[:1].upper() + s[1:].lower()
    # Release-form suffixes read in capitals: "Seroquel XL".
    return ' '.join(w.upper() if w.lower() in RELEASE else w for w in s.split(' '))


def generic(substance: str) -> str:
    """'Abacavir Sulfate, Lamivudine' -> 'Abacavir + Lamivudine'."""
    parts = []
    for part in substance.split('|')[0].split(','):
        base = re.sub(r'\s+', ' ', SALTS.sub('', part)).strip(' -')
        if base and base.lower() not in (p.lower() for p in parts):
            parts.append(title(base))
    return ' + '.join(parts)


def lookup_class(name: str):
    first = name.split(' + ')[0].lower()
    query = US_NAMES.get(first, first)
    url = f'{CLASS_URL}?drugName={urllib.parse.quote(query)}&relaSource=ATC'
    try:
        with urllib.request.urlopen(url, timeout=20) as res:
            items = json.load(res).get('rxclassDrugInfoList', {}).get('rxclassDrugInfo', [])
    except Exception:
        return name, None
    ids = [i['rxclassMinConceptItem']['classId'] for i in items]
    for prefix, key in sorted(ATC_CLASSES, key=lambda p: -len(p[0])):
        if any(i.startswith(prefix) for i in ids):
            return name, key
    return name, None


def main():
    data = Path(sys.argv[1]).read_bytes() if len(sys.argv) > 1 else urllib.request.urlopen(EMA_URL, timeout=300).read()
    generics: dict[str, str] = {}  # combination key -> display (first spelling seen)
    brands: dict[str, tuple[str, str]] = {}  # lower-case product -> (display, generic lower)
    dated = None
    for row in read_rows(data):
        if dated is None and str(row.get(0, '')).startswith('Data as present'):
            dated = row[0]
        if row.get(3) not in COUNTRIES or not row.get(1) or not row.get(0):
            continue
        substance = row[1]
        # Skip herbal extracts, homeopathics, vaccines and other strain or dilution names.
        if substance.count(',') > 2 or len(substance) > 120 or re.search(r'extract|tincture|homeopath|vaccine|virus|strain|antigen|\(|\d{2,}', substance, re.I):
            continue
        g = generic(substance)
        if not g:
            continue
        # "Codeine + Paracetamol" and "Paracetamol + Codeine" are one entry.
        key = ' + '.join(sorted(g.lower().split(' + ')))
        g = generics.setdefault(key, g)
        product = title(row[0])
        # "Sertraline Accord" only repeats the generic with a maker's name; keep real brands (Apotel, Seroquel).
        first = g.split(' + ')[0].lower()
        if not product.lower().startswith(first) and not product.lower().startswith(g.lower()):
            brands.setdefault(product.lower(), (product, g.lower()))

    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    todo = [g for g in generics.values() if g not in cache]
    with ThreadPoolExecutor(max_workers=8) as pool:
        for name, key in pool.map(lookup_class, todo):
            cache[name] = key
    CACHE.write_text(json.dumps(cache, indent=0, sort_keys=True))

    names = sorted(generics.values(), key=str.lower)
    index = {n.lower(): i for i, n in enumerate(names)}
    out = {
        'source': f'European Medicines Agency, Article 57 product data ({dated}); Cyprus, United Kingdom (Northern Ireland) and EU-wide authorisations. Classes from ATC codes via NLM RxClass.',
        'classes': CLASS_KEYS,
        # [generic name, class index or -1]
        'generics': [[n, CLASS_KEYS.index(cache[n]) if cache.get(n) else -1] for n in names],
        # [brand name, generic index]
        'brands': sorted(([b, index[g]] for b, g in brands.values()), key=lambda r: r[0].lower()),
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
    print(f"{len(out['generics'])} generics, {len(out['brands'])} brands, "
          f"{sum(1 for g in out['generics'] if g[1] >= 0)} with a class -> {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == '__main__':
    main()
