/**
 * ════════════════════════════════════════════
 * Module Arbre — construction du modèle hiérarchique et rendu HTML
 * ════════════════════════════════════════════
 * Ce module ne connaît rien de Grist : il reçoit des données déjà
 * chargées (records) et une configuration, et se contente de :
 *   1) construire un arbre logique (buildTree)
 *   2) l'afficher sous forme de <ul>/<li> imbriqués (createTreeHTML)
 *
 * La formule de libellé et la formule d'icône ne sont compilées/analysées
 * qu'une seule fois par rendu complet (au niveau racine, dans
 * createTreeHTML), pas à chaque nœud — voir le détail dans createTreeHTML.
 */

/**
 * Transforme un texte de règles "clé=valeur" (une règle par ligne) en
 * objet { clé: valeur }. Utilisé pour les règles d'icônes par niveau de
 * nœud (paramétrage du widget).
 *
 * Variables globales utilisées : aucune.
 *
 * Entrée : rulesText (string) — ex. "1=racine.png\n2=dossier.png"
 * Sortie : Object — ex. { "1": "racine.png", "2": "dossier.png" }
 */
function parseRules(rulesText) {
    const rules = {};
    if (!rulesText) return rules;

    rulesText.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim();
            if (key && val) rules[key] = val;
        }
    });
    return rules;
}

/**
 * Détermine l'icône à utiliser pour un nœud, selon l'ordre de priorité :
 *   1) formule d'icône par colonnes (options.iconFormula, conditionnelle,
 *      ex. `$Departement === "Ain" ? "icone1.png" : "icone2.png"`)
 *   2) règle par niveau de profondeur (levelRules)
 *   3) icône par défaut (options.defaultIconName)
 *
 * La formule est évaluée même pour un nœud "virtuel" (recordData null,
 * c'est-à-dire un segment intermédiaire du chemin auquel aucune ligne ne
 * correspond exactement) — voir evaluateFormula.
 *
 * Variables globales utilisées : aucune (fonction pure ; tout lui est
 * transmis en paramètre par renderLevel).
 *
 * Entrée :
 *   - recordData  (Object|null) — ligne Grist associée au nœud (ou null)
 *   - level       (number)      — profondeur du nœud (1 = racine)
 *   - options     (Object)      — config du widget (defaultIconName, _lookup)
 *   - iconsMap    (Object)      — cache { nomIcone: dataURL } (voir app.js)
 *   - parsedRules (Object)      — { levelRules, compiledIconFormula }
 *                                  préparés une seule fois par createTreeHTML
 * Sortie : string — DataURL base64 de l'icône, ou "" si aucune icône
 */
export function getNodeIcon(recordData, level, options, iconsMap, parsedRules) {
    const { defaultIconName } = options;
    const { levelRules, compiledIconFormula } = parsedRules;

    // 1. Formule d'icône par colonnes (résultat attendu : nom d'icône)
    let iconName = evaluateFormula(recordData, compiledIconFormula, "", options._lookup);
    iconName = iconName ? String(iconName).trim() : "";

    // 2. Recherche par niveau de nœud (ex : 1, 2, 3)
    if (!iconName && levelRules[String(level)]) {
        iconName = levelRules[String(level)];
    }

    // 3. Icône par défaut
    if (!iconName) {
        iconName = defaultIconName || "";
    }

    return iconsMap[iconName] || "";
}

/**
 * Compile une formule (ex. `$Code + " - " + $Libelle`, ou une expression
 * conditionnelle `$Departement === "Ain" ? "icone1.png" : "icone2.png"`)
 * en une fonction JS directement exécutable. Utilisée à la fois pour la
 * formule de libellé et pour la formule de sélection d'icône par colonnes.
 *
 * La formule peut, en plus des colonnes de la ligne courante ($Colonne),
 * utiliser la fonction `lookup(colonneCible, colonneCritere, valeurCritere)`
 * pour aller chercher une valeur sur UNE AUTRE ligne de la table (la
 * première ligne dont colonneCritere vaut valeurCritere). Exemple :
 * `lookup("Departement", "Code_DGER", $uainiveau1_codedger)`.
 *
 * Variables globales utilisées : aucune.
 *
 * Entrée : formula (string) — formule saisie dans le paramétrage
 * Sortie : Function|null — fonction (record, lookup) => valeur calculée,
 *          ou null si aucune formule n'est définie ou si elle est invalide
 */
function compileFormula(formula) {
    if (!formula || !formula.trim()) return null;

    try {
        // $NomColonne → record["NomColonne"] (accès sécurisé, "" si absent)
        const expr = formula.replace(
            /\$([a-zA-Z0-9_]+)/g,
            (_, col) => `(record[${JSON.stringify(col)}] ?? "")`
        );
        return new Function("record", "lookup", `"use strict"; return (${expr});`);
    } catch (e) {
        return null;
    }
}

/**
 * Applique une fonction de formule compilée (voir compileFormula) à un
 * enregistrement donné, avec une valeur de repli en cas d'absence de
 * formule ou d'erreur d'évaluation.
 *
 * Un nœud "virtuel" (segment intermédiaire du chemin auquel aucune ligne
 * ne correspond exactement — recordData vaut alors null) n'empêche pas
 * l'évaluation : la formule est exécutée avec un enregistrement vide
 * ({}), afin qu'une formule constante (ex. juste un nom d'icône) ou une
 * formule ne référençant aucune colonne s'applique aussi à ces nœuds.
 * Une référence $Colonne y vaudra simplement "" (voir compileFormula).
 *
 * Variables globales utilisées : aucune.
 *
 * Entrée :
 *   - recordData   (Object|null)
 *   - compiledFn   (Function|null) — issue de compileFormula
 *   - defaultValue (any) — valeur de repli
 *   - lookupFn     (Function|undefined) — fonction lookup(...) exposée à
 *                  la formule (voir compileFormula) ; absente = no-op
 * Sortie : any — résultat de la formule, ou defaultValue
 */
function evaluateFormula(recordData, compiledFn, defaultValue, lookupFn) {
    if (!compiledFn) return defaultValue;
    try {
        const result = compiledFn(recordData || {}, lookupFn || (() => ""));
        return (result !== undefined && result !== null && result !== "") ? result : defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

/**
 * Construit l'arbre logique (structure imbriquée d'objets) à partir des
 * enregistrements Grist et d'une colonne "chemin" dont la valeur est une
 * suite de segments séparés par un caractère séparateur (ex. avec "-" :
 * "Region-Departement-Commune").
 *
 * Variables globales utilisées : aucune.
 *
 * Entrée :
 *   - records   (Object[]) — enregistrements Grist (allData dans app.js)
 *   - sourceCol (string)   — nom de la colonne contenant le chemin
 *   - separator (string)   — caractère séparateur des segments (défaut "-")
 * Sortie : Object — arbre { clé: { children: {...}, recordData } }
 *          recordData contient la ligne Grist du nœud si le chemin s'arrête
 *          exactement à ce niveau, sinon null (nœud intermédiaire "virtuel")
 */
export function buildTree(records, sourceCol, separator = "-") {
    const root = {};

    records.forEach(record => {
        const path = record[sourceCol] || record.C1;
        if (!path) return;

        const parts = String(path).split(separator);
        let current = root;

        parts.forEach((part, index) => {
            part = part.trim();

            if (!current[part]) {
                current[part] = { children: {}, recordData: null };
            }

            if (index === parts.length - 1) {
                current[part].recordData = record;
            }

            current = current[part].children;
        });
    });

    return root;
}

/**
 * Élément .node actuellement sélectionné dans le DOM (VARIABLE GLOBALE
 * du module, utilisée et mise à jour par renderLevel). Conserver cette
 * référence évite un `document.querySelectorAll(".node")` sur tout le
 * document à chaque clic.
 */
let lastSelectedEl = null;

/**
 * Point d'entrée public du rendu de l'arbre. Affiche l'arbre HTML dans
 * parentElement. Au premier appel (niveau racine), pré-calcule une seule
 * fois la fonction de libellé compilée et les règles d'icônes analysées,
 * puis délègue le rendu récursif à renderLevel(). Les appels récursifs
 * internes réutilisent ces pré-calculs sans les refaire.
 *
 * Effet de bord sur le paramètre `options` : cette fonction AJOUTE les
 * propriétés `_compiledLabelFn` et `_parsedIconRules` à l'objet options
 * reçu (mutation directe, pas de copie) — options doit donc être un
 * objet frais à chaque rendu complet (c'est ce que fait app.js).
 *
 * Variables globales utilisées : aucune directement (mais délègue à
 * renderLevel, qui lit/modifie lastSelectedEl).
 *
 * Entrée :
 *   - node             (Object)      — arbre logique (issu de buildTree)
 *   - parentElement    (HTMLElement) — conteneur DOM cible
 *   - currentPath      (string)      — chemin déjà parcouru ("" à la racine)
 *   - options          (Object)      — réglages de la navigation active
 *                                      (labelFormat, iconFormula, iconLevelRules,
 *                                      defaultIconName, pathSeparator, _lookup)
 *   - iconsMap         (Object)      — cache des icônes chargées (app.js)
 *   - onSelectCallback (Function)    — appelé (nodePath, key) au clic sur un nœud
 *   - level            (number)      — profondeur courante (1 = racine ;
 *                                      paramètre à usage interne pour la récursion)
 * Sortie : aucune — effet de bord : ajoute un <ul> à parentElement
 */
export function createTreeHTML(node, parentElement, currentPath, options, iconsMap, onSelectCallback, level = 1) {
    if (level === 1 && currentPath === "") {
        options._compiledLabelFn = compileFormula(options.labelFormat);
        options._parsedIconRules = {
            levelRules: parseRules(options.iconLevelRules),
            compiledIconFormula: compileFormula(options.iconFormula)
        };
    }

    renderLevel(node, parentElement, currentPath, options, iconsMap, onSelectCallback, level);
}

/**
 * Rendu récursif d'un niveau de l'arbre (fonction interne, non exportée).
 * Le chemin de chaque nœud (nodePath) est reconstruit avec le même
 * séparateur (options.pathSeparator) que celui utilisé par buildTree()
 * pour découper la colonne chemin — les deux doivent rester cohérents,
 * sans quoi le chemin transmis au clic ne correspond plus aux valeurs
 * réelles de la colonne (utilisé ensuite par app.js pour filtrer la vue liée).
 *
 * Variables globales utilisées : lastSelectedEl (lue et réassignée au
 * clic sur un nœud, pour déplacer la surbrillance sans reparcourir tout
 * le DOM).
 *
 * Entrée : identique à createTreeHTML (mais options._compiledLabelFn et
 *          options._parsedIconRules sont déjà renseignés).
 * Sortie : aucune — effet de bord : DOM
 */
function renderLevel(node, parentElement, currentPath, options, iconsMap, onSelectCallback, level) {
    const ul = document.createElement("ul");

    for (const key in node) {
        const nodeData = node[key];
        const children = nodeData.children;
        const hasChildren = Object.keys(children).length > 0;
        const nodePath = currentPath ? `${currentPath}${options.pathSeparator || "-"}${key}` : key;

        const li = document.createElement("li");
        const line = document.createElement("div");
        line.className = "node-line";

        const toggle = document.createElement("span");
        toggle.className = "toggle";
        toggle.textContent = hasChildren ? "▶" : "";

        const label = document.createElement("span");
        label.className = "node";

        const iconContainer = document.createElement("span");
        iconContainer.className = "icon-container";

        const iconDataUrl = getNodeIcon(nodeData.recordData, level, options, iconsMap, options._parsedIconRules);

        if (iconDataUrl) {
            const img = document.createElement("img");
            img.src = iconDataUrl;
            img.className = "icon-img";
            img.alt = "";
            iconContainer.appendChild(img);
        } else {
            const txt = document.createElement("span");
            txt.className = "icon-text";
            txt.textContent = hasChildren ? "📁" : "📄";
            iconContainer.appendChild(txt);
        }

        const displayLabel = evaluateFormula(nodeData.recordData, options._compiledLabelFn, key, options._lookup);
        const text = document.createElement("span");
        text.textContent = displayLabel;

        label.appendChild(iconContainer);
        label.appendChild(text);

        // Sélection d'un nœud : met en surbrillance le nœud cliqué et
        // notifie app.js (qui déclenche le filtrage vers la vue liée)
        label.onclick = () => {
            if (lastSelectedEl) lastSelectedEl.classList.remove("selected");
            label.classList.add("selected");
            lastSelectedEl = label;
            onSelectCallback(nodePath, key);
        };

        line.appendChild(toggle);
        line.appendChild(label);
        li.appendChild(line);

        if (hasChildren) {
            const childContainer = document.createElement("div");
            childContainer.classList.add("hidden");

            renderLevel(nodeData.children, childContainer, nodePath, options, iconsMap, onSelectCallback, level + 1);

            toggle.onclick = () => {
                const isHidden = childContainer.classList.contains("hidden");
                childContainer.classList.toggle("hidden", !isHidden);
                toggle.textContent = isHidden ? "▼" : "▶";
            };

            li.appendChild(childContainer);
        }

        ul.appendChild(li);
    }

    parentElement.appendChild(ul);
}
