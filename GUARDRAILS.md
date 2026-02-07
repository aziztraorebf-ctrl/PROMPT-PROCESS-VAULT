# GUARDRAILS.md - Règles de Contribution Automatique

> ⚠️ Ce fichier est lu par Clawd avant chaque session de coding
> 📍 Location : À la racine du repo (visible et modifiable par l'humain)

## 🚫 Règles ABSOLUES (Ne jamais enfreindre)

### Règle #1 : Jamais sur `main`
```
INTERDIT : git push origin main
OBLIGATOIRE : git checkout -b clawd/nightly-YYYY-MM-DD
```

### Règle #2 : Jamais "prêt à merger" sans validation
```
INTERDIT : Dire "c'est prêt" ou "tu peux merger"
OBLIGATOIRE : Dire "code poussé sur [branche], en attente de validation"
```

### Règle #3 : Toujours notifier après push
```
OBLIGATOIRE : Envoyer message à l'humain avec :
- Nom de la branche
- Ce qui a été fait
- Ce qui reste à faire
```

## ✅ Workflow Automatique

### Phase 1 : Clawd travaille (22h-03h)
1. Créer branche `clawd/nightly-$(date +%F)`
2. Faire les modifications (architecture, features)
3. Commit avec message descriptif
4. Push sur la branche
5. **STOP** - Ne rien faire d'autre

### Phase 2 : Humain review (matin)
1. Lire les commits sur la branche
2. Exécuter `npm run type-check`
3. Exécuter `npm run build`
4. Corriger si nécessaire
5. Créer PR et merger quand prêt

## 🔧 Checklist pour Clawd (À cocher mentalement)

Avant chaque session :
- [ ] Je suis sur une branche `clawd/*`, pas `main`
- [ ] Je vais notifier l'humain après push
- [ ] Je ne vais pas merger

Après chaque session :
- [ ] Branche poussée sur GitHub
- [ ] Message envoyé à l'humain
- [ ] Fichier de log créé dans `logs/nightly-YYYY-MM-DD.md`

## 📝 Template de Message à l'Humain

```
🌙 Session Nightly Terminée

Branche : clawd/nightly-YYYY-MM-DD
Commits : X commits
Fichiers modifiés : liste

✅ Ce qui fonctionne :
- ...

⚠️ À vérifier :
- npm run type-check
- npm run build

🔗 URL : https://github.com/.../tree/clawd/nightly-...
```

## 🚨 En Cas d'Urgence

Si Clawd ne suit pas ces règles :
1. Révoquer le token GitHub immédiatement
2. Revert les commits sur `main` si nécessaire
3. Me le rappeler dans la prochaine session

---

**Dernière vérification** : 2026-02-06
**Prochaine review** : Avant chaque session proactive
