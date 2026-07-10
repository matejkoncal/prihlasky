# Supabase setup a prvý admin

1. V Supabase Dashboarde nastavte Authentication → URL Configuration:
   - Site URL na aktuálnu nasadenú URL aplikácie;
   - Redirect URLs na `http://localhost:3000/auth/confirm` a nasadenú URL zakončenú `/auth/confirm`.
2. Pred produkčnými pozvánkami nastavte vlastný SMTP poskytovateľ v Authentication → SMTP Settings. Predvolený Supabase e-mail je určený iba na vývoj a môže byť oneskorený alebo limitovaný.
3. Lokálny `.env.local` musí obsahovať `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD` a podľa prostredia `NEXT_PUBLIC_APP_URL`.
4. Tie isté tri aplikačné hodnoty bez `SUPABASE_DB_PASSWORD` pridajte ako šifrované Vercel Environment Variables. `NEXT_PUBLIC_APP_URL` nastavte na nasadenú URL.
5. Prvého admina vytvorte Auth pozvánkou a nastavte jeho `profiles.role` na `admin`. Pre tento projekt je už pripravený účet `matej@koncal.sk` s rolou `admin`.
6. Admin sa prihlási cez `/login`, otvorí `/admin/hodnotitelia`, pozve hodnotiteľov a na `/admin` im pridelí kategórie jednotlivých prihlášok.
