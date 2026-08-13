# GeoTech Lab — Sprint Review 1
## Révision des flux d'essais — Retour expert de domaine

**Date :** Juin 2025
**Participants :** Développeur (GeoTech Lab) · Expert de domaine (géotechnique)
**Objectif :** Recueillir le retour expert sur les formulaires d'essais avant d'entrer en phase d'implémentation.

---

## 1. Champs Poids du Moule et Volume du Moule — Champs à rendre éditables

L'expert a signalé que les champs Poids du Moule et Volume du Moule sont actuellement fixes. Or, ces valeurs varient selon les moules utilisés en laboratoire. Ces champs doivent donc être des saisies libres par l'utilisateur.

**Action requise :** Convertir les champs Poids du Moule et Volume du Moule en champs de saisie libre.

---

## 2. Correction de l'intitulé — « Densité Relative »

Le champ actuellement intitulé « Densité Relative » porte un nom incorrect sur le plan géotechnique. Le terme exact est :

- **Poids Spécifique (PS)** — désigne la densité réelle des grains solides d'un matériau.
- Si une appellation « densité » est préférée, le terme correct est **Densité Absolue**.

**Action requise :** Renommer « Densité Relative » en « Poids Spécifique » dans l'ensemble de l'application.

---

## 3. Chaîne de dépendance des essais — Clarification du flux de données

L'expert a clarifié l'enchaînement complet des essais et la manière dont les données circulent entre eux. L'ensemble des essais est réalisé sur un même échantillon de sol et permet d'en établir la classification.

**Flux de données entre essais :**

```
Teneur en Eau → Granulométrie → Poids Spécifique (PS) → Proctor → CBR → VBS → Compacité → Fiche Récapitulative
```

---

## 4. Essai de Teneur en Eau — Champs manquants dans la Granulométrie

Lors d'une simulation en direct, il a été constaté que le formulaire d'Analyse Granulométrique est incomplet. Deux champs d'entrée obligatoires, provenant de l'essai de Teneur en Eau, sont absents :

- Poids de l'échantillon
- Valeur de la teneur en eau calculée dans l'essai précédent

Actuellement, le Poids Total Sec est saisi manuellement. Or, il doit être calculé automatiquement à partir du poids de l'échantillon et de la teneur en eau.

**Action requise :** Ajouter les champs Poids de l'Échantillon et Teneur en Eau dans le formulaire Granulométrie, avec calcul automatique du Poids Total Sec.

---

## 5. Flux de données du Poids Spécifique (PS)

Les données du Poids Spécifique doivent se propager automatiquement vers plusieurs essais en aval :

- Fiche Récapitulative (Récap)
- Essai Proctor
- Essai de Compacité
- Essai CBR

**Action requise :** S'assurer que le champ PS est disponible comme entrée dans tous les formulaires concernés et que sa valeur se propage automatiquement.

---

## 6. Flux de travail du Lab Manager — Validé

Le rôle Lab Manager a été examiné et confirmé comme fonctionnant correctement :

- Réception des essais soumis
- Assignation des essais à un technicien
- Définition de la priorité (ex. : Urgent) et de l'échéance
- Suivi de la charge de travail par technicien pour éviter les surcharges
- Consultation des résultats une fois les essais complétés

Aucune modification requise sur ce flux pour le moment.

---

## 7. Fenêtre d'Approbation — Confirmée

La fenêtre d'approbation de **24 à 48 heures**, convenue précédemment, a été confirmée par l'expert.

---

## Récapitulatif des Actions

| # | Action à effectuer | Priorité |
|---|---|---|
| 1 | Rendre les champs Poids du Moule et Volume du Moule modifiables par l'utilisateur | Élevée |
| 2 | Renommer « Densité Relative » en « Poids Spécifique » dans toute l'application | Moyenne |
| 3 | Ajouter les champs Poids de l'Échantillon et Teneur en Eau dans le formulaire Granulométrie | Élevée |
| 4 | Calculer automatiquement le Poids Total Sec à partir de la Teneur en Eau et du Poids de l'Échantillon | Élevée |
| 5 | Assurer la propagation automatique des données PS vers les essais Proctor, CBR, Compacité et Récap | Élevée |

Le prochain sprint traitera l'ensemble de ces modifications avant de poursuivre le développement de la chaîne d'essais.
