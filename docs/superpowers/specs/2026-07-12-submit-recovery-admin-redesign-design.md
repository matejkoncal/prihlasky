# Obnova submitu a redizajn administrácie

## Cieľ

Obnoviť odosielanie verejných prihlášok a prepracovať zamestnanecký appbar a zoznam prihlášok tak, aby mali jasnú vizuálnu hierarchiu, stabilné rozloženie a dobré responzívne správanie.

## Príčina submit chyby

Posledné produkčné deploymenty odovzdali `RESEND_API_KEY` cez CLI ako prázdnu runtime hodnotu, pretože lokálny `.env.local` tento kľúč neobsahuje. Tým sa pre dané deploymenty prekryla citlivá Production premenná uložená vo Verceli. `createProductionDependencies()` následne skončí ešte pred vytvorením pending prihlášky, čo zodpovedá databáze bez nových pending/failed riadkov.

## Obnova a ochrana deploymentu

- Resend kľúč ostane citlivou Production premennou spravovanou vo Verceli.
- Supabase URL, publishable key a service-role key sa nastavia ako Production premenné projektu.
- Produkčný deploy nebude posielať žiadne tajné runtime hodnoty cez `-e`; použije iba projektové Production premenné.
- Aplikačný test zachová kontrolovanú chybu pri chýbajúcom `RESEND_API_KEY`.
- Deployment dokumentácia alebo skript nesmie obsahovať `-e RESEND_API_KEY=...`.

## Appbar

Na desktope bude appbar jeden kompaktný riadok:

- malé logo a krátky názov systému vľavo,
- navigácia uprostred ako pokojné pill tlačidlá bez veľkých blokov a uppercase textu,
- používateľ vpravo ako avatar s iniciálami, meno a rola,
- odhlásenie ako ikonová akcia s tooltipom.

Aktívna navigácia dostane svetlé pozadie a tyrkysový akcent bez hrubej spodnej lišty. Na mobile sa brand a používateľské akcie ponechajú v prvom riadku a navigácia bude v druhom horizontálne posúvateľnom riadku.

## Karty prihlášok

Hlavička karty bude mať tri explicitné zóny, aby CSS auto-placement nikdy nezmenil poradie:

1. identita žiaka vľavo: meno, trieda, odbor a dátum,
2. kompaktný stavový panel uprostred: skóre, priradenia a dokončenia ako malé metriky s popismi,
3. akcie vpravo: PDF a rozbalenie detailu ako ikonové tlačidlá.

Kritérium bude jeden samostatný stavový badge, nie ďalší rovnocenný chip. Na mobile bude identita a akcie v prvom riadku, metriky cez celú šírku pod nimi.

## Detail prihlášky

- Dokumenty a údaje žiaka budú v ľahkom informačnom paneli bez zbytočného vnoreného rámovania.
- Kategórie budú číslované, s názvom vľavo a hodnotiteľom/stavom vpravo.
- Všetky riadky budú mať rovnakú minimálnu výšku a vyvážené stĺpce.
- Komentár dokončeného hodnotenia bude sekundárny text pod menom hodnotiteľa a skóre.
- Existujúce pending indikátory, disabled formuláre a snackbar spätná väzba ostanú funkčné.

## Testovanie

- Regression test overí, že produkčný deployment flow neprepisuje Resend prázdnou hodnotou.
- Existujúce submit testy musia prejsť s aj bez príloh.
- UI testy overia explicitné grid pozície, meno/triedu/odbor, tri metriky, ikonové akcie, aktívnu navigáciu, používateľský avatar a responzívne zóny.
- Prejdú celý test suite, lint, build a produkčný smoke test dostupnosti formulára a admin stránok.
