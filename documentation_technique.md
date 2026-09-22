# Fiche procédure — Utilisation du widget « Arbre de navigation »

## Objectif

Cette fiche décrit comment installer, configurer et utiliser au quotidien le widget « Arbre de navigation » dans un document Grist.

## 1. Installer le widget dans une page Grist

1. Créer (ou ouvrir) une page Grist et ajouter une vue de type **Custom** (Personnalisée) **en la pointant sur la table à afficher sous forme d'arbre** — c'est cette étape, native à Grist (pas un réglage du panneau ⚙ du widget), qui détermine la table utilisée par défaut par le widget.
2. Dans les paramètres de la vue Custom, renseigner l'URL de déploiement des 4 fichiers du widget (`index.html`, `app.js`, `tree.js`, `styles.css`).
3. Grist demande l'autorisation d'accès du widget : accepter l'accès **complet (« full »)**. Cet accès est nécessaire pour :
   - créer automatiquement la table d'icônes si elle n'existe pas,
   - sélectionner des lignes dans une vue liée.
4. Ajouter ensuite, sur la même page, la table (ou vue) que vous souhaitez filtrer par clic dans l'arbre, et la **relier** au widget « Arbre de navigation » via l'option Grist « Select by » (Sélectionner par) de cette seconde vue.

💡 Vous pouvez changer la table liée à tout moment sans perdre le paramétrage : clic sur les « ⋮ » (trois points) en haut du widget dans Grist → « Sélectionner les données » (Select Data).

## 2. Table d'icônes : initialisation

Lors du premier chargement du widget dans un document, si la table `Icones` n'existe pas encore, le widget la crée automatiquement avec ses deux colonnes (`Nom` en Texte, `Fichier` en Pièce jointe) et **5 lignes vierges** déjà nommées : `defaut`, `niveau1`, `niveau2`, `niveau3`, `niveau4`. Le paramétrage par défaut (icône par défaut + règles par niveau) est configuré pour correspondre à ces 5 noms.

**Aucune image n'est fournie automatiquement** : il vous appartient d'ouvrir la table `Icones` dans Grist et de joindre un fichier PNG à chacune des 5 lignes créées (colonne `Fichier`), ou d'ajouter/renommer des lignes selon vos besoins (voir §3.2 ci-dessous).

## 3. Préparer les données

### 3.1 Colonne « chemin » dans la table source

Le widget a besoin d'une colonne dont chaque valeur décrit le chemin hiérarchique de la ligne, avec des segments séparés par un caractère séparateur (par défaut le tiret `-`, mais configurable — voir §4.2).

Exemple pour une colonne `C1` :

| C1 |
|---|
| `Region1` |
| `Region1-Departement1` |
| `Region1-Departement1-Commune1` |

Chaque segment devient un nœud de l'arbre ; les nœuds intermédiaires sans ligne propre (ex. `Region1` s'il n'existe qu'implicitement) sont créés automatiquement comme dossiers « virtuels ».

### 3.2 Table d'icônes (facultatif)

Pour afficher des icônes personnalisées, une fois la table `Icones` créée (§2) :
1. Ouvrir cette table dans Grist.
2. Pour chacune des 5 lignes déjà présentes (`defaut`, `niveau1`, `niveau2`, `niveau3`, `niveau4`), joindre le fichier image **PNG** voulu dans la colonne `Fichier`. Vous pouvez aussi renommer ces lignes, en ajouter, ou en supprimer selon vos besoins — le nom (colonne `Nom`) est ce qui sera utilisé dans les règles du paramétrage (§4.3).

## 4. Configurer le widget (panneau ⚙)

Cliquer sur le bouton **⚙** en bas à droite du widget pour ouvrir le panneau de paramétrage. Le numéro de version du widget déployé est affiché juste sous le titre (« Version : X.Y.Z ») — utile pour vérifier que la dernière version a bien été déployée.

### 4.1 Gérer plusieurs navigations (plusieurs arbres)

Le widget peut proposer **plusieurs arborescences différentes** sur la même table (par exemple : une navigation géographique et une navigation par filière), sélectionnables via une liste déroulante au-dessus de l'arbre.

Dans la section **🧭 Navigations**, en haut du panneau ⚙ :

1. **Navigation en cours de modification** : liste déroulante pour choisir quelle navigation vous êtes en train de paramétrer. Toutes les sections suivantes du panneau (Structure & Libellé, icônes, Vue liée) s'appliquent à la navigation sélectionnée ici.
2. **+ Nouvelle navigation** : crée une navigation vierge, à paramétrer aussitôt.
3. **🗑 Supprimer cette navigation** : supprime la navigation actuellement sélectionnée (impossible de supprimer la dernière navigation restante).
4. **Libellé de cette navigation** : le nom qui apparaîtra dans la liste déroulante proposée aux utilisateurs, au-dessus de l'arbre.

⚠️ Les ajouts/suppressions/modifications de navigations ne sont pris en compte qu'après avoir cliqué sur **Enregistrer** (§4.5) ; **Annuler** les abandonne.

Si vous n'avez qu'une seule navigation configurée, la liste déroulante au-dessus de l'arbre reste masquée (elle apparaît automatiquement dès qu'une deuxième navigation est créée).

### 4.2 Onglet « Structure & Libellé » (pour la navigation sélectionnée en §4.1)

1. **Colonne chemin dans CE widget** : saisir manuellement le nom **exact** (respecter la casse) de la colonne « chemin » préparée à l'étape 2.1, tel qu'il apparaît dans Grist (pas de liste de colonnes à cliquer dans ce champ).
2. **Caractère séparateur des segments du chemin** : le caractère utilisé pour découper le chemin en segments (ex. `-` ou `§`). Il doit correspondre **exactement** au séparateur utilisé dans la formule Grist qui construit la colonne chemin.
3. **Formule du libellé du nœud** (facultatif) : composer l'affichage souhaité avec `$NomColonne`, par exemple :
   ```
   $Code + " -- " + $Libelle
   ```
   Si laissé vide, seul le segment de chemin est affiché.

### 4.3 Onglet « Table d'icônes PNG » (facultatif)

Le nom de la table d'icônes, l'icône par défaut et la taille d'affichage sont **communs à toutes les navigations**. La formule d'icône et les règles par niveau sont, elles, **propres à la navigation sélectionnée en §4.1**.

1. **Nom de la table des icônes Grist** *(global)* : nom de la table créée automatiquement à l'étape 2 (par défaut `Icones`).
2. **Nom de l'icône par défaut** *(global)* : nom (colonne `Nom`) de l'icône à utiliser quand aucune règle plus précise ne s'applique — par défaut `defaut`, correspondant à la ligne créée automatiquement (§2).
3. **Icônes par formule sur les colonnes** *(par navigation, facultatif)* : formule conditionnelle, sur le même principe que la formule de libellé (§4.2), qui renvoie le nom d'une icône selon le contenu des colonnes de la ligne. Exemples :
   ```
   $Departement === "Ain" ? "niveau1" : "niveau2"

   $Departement !== "" && $Code_DGER === "" ? "niveau3" : "niveau4"

   $Code.startsWith("02") ? "niveau1" : "defaut"
   ```
   Comparaisons disponibles : égalité (`===`), différence (`!==`), supérieur/inférieur (`>`, `<`), colonne non vide/non nulle (`$Col !== ""`), colonne vide/nulle (`$Col === ""`), commence par (`$Col.startsWith("...")`), combinaisons de conditions (`&&` pour « et », `||` pour « ou »).
4. **Icônes par niveau de nœud** *(par navigation)* : une règle par ligne, au format — par défaut configuré ainsi à la création de la table (§2) :
   ```
   1=niveau1
   2=niveau2
   3=niveau3
   4=niveau4
   ```

### 4.4 Onglet « Vue liée » (facultatif — pour filtrer une autre table au clic, par navigation)

1. **Colonne de filtre dans la vue liée** : saisir manuellement le nom **exact** (respecter la casse) de la colonne de la table liée à comparer avec le nœud sélectionné.
2. **Mode de correspondance** :
   - *Valeur exacte du nœud* : compare avec le dernier segment sélectionné (ex. `N0.1`),
   - *Chemin complet* : compare avec le chemin entier reconstitué (ex. `Region1-Departement1-N0.1`),
   - *Commence par* : sélectionne les lignes dont la colonne commence par le chemin sélectionné.

### 4.5 Enregistrer

Cliquer sur **Enregistrer** : toutes les navigations (ajouts, suppressions, modifications) et les réglages globaux sont sauvegardés dans le document Grist, la table d'icônes est vérifiée/créée si besoin, les icônes sont rechargées et l'arbre est redessiné automatiquement avec la navigation en cours d'édition. Le bouton **Annuler** ferme le panneau sans rien modifier.

## 5. Utilisation courante

- **Changer de navigation** : si plusieurs navigations sont configurées, une liste déroulante apparaît au-dessus de l'arbre — la sélection change l'arbre affiché (structure, libellés, icônes, filtre vers la vue liée propres à cette navigation).
- **Déplier/replier un nœud** : cliquer sur le triangle ▶ / ▼ à gauche du nœud.
- **Sélectionner un nœud** : cliquer sur son libellé. Le nœud est mis en surbrillance et, si une vue liée est configurée pour cette navigation, les lignes correspondantes y sont automatiquement sélectionnées.
- **Diagnostiquer un problème** : cocher « Afficher le panneau de debug » dans le paramétrage ⚙ pour faire apparaître, sous l'arbre, les messages techniques (erreurs de chargement d'icône, résultat du filtrage, etc.).

## 6. Résolution des problèmes courants

| Symptôme | Cause probable | Action |
|---|---|---|
| L'arbre est vide | Colonne « chemin » mal renseignée dans le paramétrage de la navigation active (nom mal orthographié ou casse incorrecte), ou table source vide | Vérifier l'orthographe exacte du paramètre « Colonne chemin dans CE widget » de la navigation concernée (§4.2) |
| Les icônes ne s'affichent pas (icône 📁/📄 générique à la place) | Nom d'icône incorrect dans les règles, fichier PNG manquant, ou icône non jointe dans la table `Icones` | Activer le panneau de debug ; vérifier l'orthographe exacte du `Nom` dans la table d'icônes |
| Le clic sur un nœud ne sélectionne rien dans l'autre table | Vue liée non configurée (« Select by ») entre les deux widgets, ou colonne de filtre mal orthographiée (nom ou casse) pour la navigation active | Vérifier la liaison Grist entre les deux vues, puis l'orthographe exacte du paramètre « Colonne de filtre dans la vue liée » de la navigation concernée |
| La liste déroulante de navigation n'apparaît pas au-dessus de l'arbre | Une seule navigation est configurée (comportement normal : la liste est masquée s'il n'y a rien à choisir) | Créer une deuxième navigation via « + Nouvelle navigation » (§4.1) si besoin |
| Erreur lors de la création de la table d'icônes | Accès du widget insuffisant | Réautoriser le widget avec l'accès « complet (full) » |
