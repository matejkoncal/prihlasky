# Export hodnotení, prílohy a identita v appbare

## Cieľ

Admin musí vedieť z detailu prihlášky stiahnuť životopis a motivačný list a pri prihláške s dokončenými všetkými piatimi hodnoteniami vytvoriť samostatné PDF hodnotenia. Zamestnanecký appbar zároveň zobrazí logo SOŠTaR a identitu prihláseného používateľa.

## Rozsah

- Ukladať životopis a motivačný list pri všetkých nových prihláškach.
- Existujúce prihlášky ostanú bez príloh; spätne ich nie je možné obnoviť.
- Prílohy môže stiahnuť iba aktívny admin.
- Každá dokončená prihláška má vlastné PDF hodnotenia.
- Export je dostupný iba pri presne piatich dokončených hodnoteniach.
- Verejný formulár sa vizuálne nemení.
- Appbar sa zlepší bez zmeny verejnej stránky.

## Dátový model a Storage

Supabase dostane privátny bucket `application-attachments` a tabuľku `application_attachments`:

- `id` UUID,
- `application_id` s väzbou na `applications`,
- `kind` s hodnotou `cv` alebo `motivation_letter`,
- `original_filename`,
- `mime_type`,
- `size_bytes`,
- `storage_path`,
- `created_at`,
- unikátnu kombináciu `application_id` + `kind`.

Bucket nebude verejný. Klient nedostane service-role kľúč ani internú Storage cestu. Admin zoznam bude obsahovať iba bezpečné metadáta potrebné na vykreslenie tlačidiel.

Nové prihlášky budú vo `form_data` ukladať triedu a odbor oddelene. Pole `classField` ostane zachované pre existujúci PDF formulár a spätnú kompatibilitu. Pri starších záznamoch export rozdelí `classField` na prvom oddeľovači ` – `.

## Odoslanie prihlášky

Po validácii sa vytvorí pending prihláška. Server následne nahrá prijaté prílohy do privátneho bucketu pod náhodnými, neuhádnuteľnými cestami a zapíše ich metadáta. Potom pokračuje existujúce vytvorenie PDF, odoslanie e-mailov a označenie prihlášky ako odoslanej.

Ak nahratie prílohy alebo neskorší krok zlyhá, už nahrané objekty a ich metadáta sa odstránia a prihláška sa označí ako neúspešná. Tým nevzniknú osirelé súbory. Limit a povolené typy príloh ostávajú zhodné s verejným formulárom.

## Chránené download endpointy

Endpoint prílohy:

- overí session a aktívnu admin rolu,
- podľa ID prihlášky a typu prílohy načíta metadáta,
- stiahne objekt cez serverový Supabase klient,
- vráti ho s pôvodným bezpečne escapovaným názvom,
- pri chýbajúcom súbore vráti 404, pri chýbajúcom oprávnení 403.

Endpoint PDF exportu:

- overí aktívneho admina,
- načíta údaje prihlášky, aktívne kategórie, hodnotenia a mená hodnotiteľov,
- vyžaduje presne päť dokončených hodnotení,
- vygeneruje PDF na serveri a vráti ho ako prílohu na stiahnutie,
- rozpracovanú alebo neúplnú prihlášku odmietne konfliktom 409.

## Obsah PDF

PDF použije existujúce vizuálne prvky školy a Erasmus+ a bude obsahovať:

- meno a priezvisko žiaka,
- triedu,
- odbor,
- všetkých päť hodnotiacich kategórií v definovanom poradí,
- meno hodnotiteľa,
- skóre z 10,
- slovný komentár,
- celkový súčet z 50 bodov,
- výsledok `Kritérium splnené` pri 35 a viac bodoch, inak `Kritérium nesplnené`.

Dlhšie komentáre môžu dokument rozšíriť na viac strán; hlavičky, okraje a zalomenie musia zostať čitateľné.

## Admin UI

V rozbalenom detaile prihlášky pribudne sekcia `Dokumenty`. Pre existujúcu prílohu zobrazí samostatné tlačidlo na stiahnutie; pri chýbajúcej prílohe zobrazí stručnú informáciu bez nefunkčného odkazu.

V hlavičke karty sa tlačidlo `Exportovať hodnotenie PDF` zobrazí iba pri stave 5/5 hotových hodnotení. Každé tlačidlo smeruje na chránený serverový endpoint konkrétnej prihlášky.

## Appbar

`StaffLayout` dostane overeného používateľa, nie iba rolu. `getVerifiedStaffUser` preto vráti aj `displayName` a `email`. Appbar zobrazí:

- existujúce logo SOŠTaR,
- názov `Erasmus+ hodnotenie`,
- navigáciu podľa roly,
- meno používateľa s fallbackom na e-mail,
- rolu používateľa,
- odhlásenie.

Rozloženie musí byť responzívne a sticky appbar nesmie prekrývať obsah.

## Bezpečnosť a chyby

- Storage ostáva privátny a bez verejných read policies.
- Všetky downloady vykonáva server až po autorizácii.
- Názvy súborov sa nesmú použiť ako Storage cesty.
- Odpovede nesmú odhaliť service-role kľúč ani internú cestu.
- PDF endpoint nesmie dôverovať stavu z klienta; úplnosť overí z databázy.
- Neplatné UUID, neexistujúce záznamy a chyby generovania dostanú kontrolované HTTP odpovede.

## Testovanie a overenie

- SQL testy overia tabuľku, privátny bucket, constraints, RLS a admin export funkciu.
- Unit testy overia upload, metadáta, cleanup a existujúce e-mailové prílohy.
- Route testy overia admin autorizáciu, 404/409 a download hlavičky.
- PDF testy overia všetky povinné polia, súčet a hranicu 35 bodov.
- UI testy overia podmienené exportné tlačidlo, dokumenty a používateľský blok appbaru.
- Finálny PDF sa vyrenderuje do PNG a vizuálne skontroluje.
- Pred nasadením prejdú celý test suite, lint, build a `git diff --check`.
- Po nasadení sa vykoná živý smoke test autorizovaných endpointov a produkčných logov.
