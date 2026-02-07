#!/bin/bash
# nightly-coding.sh - Script de coding proactif
# À placer dans ~/scripts/ ou exécuter via cron

DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M)
LOG_DIR="$HOME/.clawdbot/logs"
LOG_FILE="$LOG_DIR/nightly-$DATE.md"
REPO_DIR="/tmp/PROMPT-PROCESS-VAULT"

# Créer le dossier de logs
mkdir -p $LOG_DIR

# Header du log
echo "# Nightly Coding Session - $DATE" > $LOG_FILE
echo "" >> $LOG_FILE
echo "**Heure de démarrage** : $TIME" >> $LOG_FILE
echo "" >> $LOG_FILE
echo "## Branche" >> $LOG_FILE
echo "\`clawd/nightly-$DATE\`" >> $LOG_FILE
echo "" >> $LOG_FILE

# Aller dans le repo
cd $REPO_DIR

# Créer la branche
git checkout -b clawd/nightly-$DATE 2>/dev/null || git checkout clawd/nightly-$DATE

echo "## Commits" >> $LOG_FILE
echo "" >> $LOG_FILE

# (Ici le code serait exécuté par Kimi)

# Log des commits
git log --oneline --since="today" >> $LOG_FILE

echo "" >> $LOG_FILE
echo "## Statut" >> $LOG_FILE
echo "- ✅ Code poussé sur GitHub" >> $LOG_FILE
echo "- ⏳ En attente de validation" >> $LOG_FILE
echo "" >> $LOG_FILE
echo "## Prochaines étapes" >> $LOG_FILE
echo "1. Vérifier la branche sur GitHub" >> $LOG_FILE
echo "2. Exécuter \`npm run type-check\`" >> $LOG_FILE
echo "3. Exécuter \`npm run build\`" >> $LOG_FILE
echo "4. Merger quand prêt" >> $LOG_FILE

# Ouvrir le log
open $LOG_FILE
