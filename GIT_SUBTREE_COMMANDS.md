3) Главная команда на будущее (обновление)

Когда в любом из трёх репо сделаны изменения — обновляешь platform так:

git fetch lexar-chat
git fetch lex-admin
git fetch lex-back

git subtree pull --prefix=apps/lexar-chat  lexar-chat  main --squash
git subtree pull --prefix=apps/lex-admin   lex-admin   main --squash
git subtree pull --prefix=apps/lex-back    lex-back    main --squash

git push origin main