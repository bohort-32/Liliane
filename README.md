# Lil-IA-ne
### Présentation

Lil-IA-ne est un LLM pour répondre aux questions d'orientation du BTS SIO du lycée Saint-louis à Châteaulin.

 * La partie LLM représente la configuration de la réflexion du modèle de langage.
 * La partie WebChat représente la gestion l'interface web pour discuter.

### Prérequis
 *  [Ollama](https://ollama.com/) installé
 *  [llama3.2](https://ollama.com/library/llama3.2) installé
     * Le modèle peut être modifié
 *  [Python 3](https://www.python.org/downloads/) installé et les librairies suivantes :
    * `pip install pandas`
 *  [NodeJS](https://nodejs.org/en) installé et les librairies suivantes :
     * `npm i express`



## I - Configurer le LLM
L'ajout et la modification d'informations sur le BTS s'effectue en remplissant le fichier **BTS_SIO_Infos.xlsx**.

Les informations sont définies par catégorie représentées par des pages du tableur.

| Catégorie  | Description |
| ------------- |-------------|
| Présentation Générale| Présente la formation pure du BTS SIO. |
| Option SISR     | Décrit le contenu pédagogique de l'option SISR. |
| Option SLAM      | Décrit le contenu pédagogique de l'option SLAM. |
| Admission     | Indique les critères et modalités pour s'inscrire en première année. |
| Stages     | Décrit l'organisation des périodes de stages ainsi que les missions. |
| Débouchés     | Détail les débouchés professionnels et scolaires pour chaque option.|
| Equipements     | Décrit les locaux du lycée et les équipements disponibles pour l'apprentissage. |
| Emploi du temps     | Décrit un emploi du temps type de première année |
| Vie étudiante     | Liste les évènements du BDE |
| Contact     | Liste les mails, site web, réseaux, dates des portes ouvertes, téléphones |
| Images     | Décrit le nom des images et ce qu'elles représentent. |

### I.a ) Ajout d'une image
Des images peuvent être ajoutées ainsi le LLM peut afficher des photos des locaux ainsi que des schémas explicatifs sur la formation.

Pour ajouter une image, il faut les placer dans le dossier `/WebChat/public/images/`. Pour que le LLM les prenne en compte, il faut remplir la section "Images" du fichier **BTS_SIO_Infos.xlsx**.

## II ) Compilation du LLM
Pour sauvegarder vos modifications, lancez le script **generate_data.py**.

Placer le fichier de sortie **system-prompt.txt** dans le dossier `/WebChat/config/`

#### Le modèle est compilé. 
Les étapes I et II sont à réaliser uniquement lorsque vous souhaitez ajouter/modifier des informations sur la formation.

## III ) Lancer le serveur


1. Déplacer vous dans le dossier WebChat.
2. Lancer Ollama
   * `ollama run llama3.2`
3. Lancer le serveur node JS
   * `npm start`

Le serveur est lancé, vous pouvez commencer à discuter à l'adresse suivante : [http://adresse-machine:3000](http://localhost:3000)