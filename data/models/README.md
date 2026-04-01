# Dossier `data/models`

Ce dossier contient les fichiers generes localement apres l'entrainement des modeles.

Exemples de fichiers produits :

- `svd_model.pkl`
- `tfidf_vectorizer.pkl`
- `tfidf_matrix.pkl`
- `movies.csv`

Ils ne sont pas versionnes dans Git afin de garder un depot plus leger et plus propre.

Pour les regenerer :

```bash
python prepare_data.py
python train_models.py
```
