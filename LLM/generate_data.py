# generate_modelfile.py
import pandas as pd
from datetime import datetime
import sys

def generer_modelfile_bts_sio(fichier_excel="BTS_SIO_Infos.xlsx", 
                                fichier_sortie="Modelfile",
                                modele_base="llama3.2"):
    """
    Génère un Modelfile pour Ollama à partir du fichier Excel du BTS SIO
    Chaque feuille = une catégorie
    """
    
    print("=" * 70)
    print("🎓 Générateur de Modelfile - BTS SIO Saint Louis Châteaulin")
    print("=" * 70)
    
    try:
        # Lecture du fichier Excel avec toutes les feuilles
        print(f"\n📖 Lecture du fichier : {fichier_excel}")
        excel_file = pd.ExcelFile(fichier_excel)
        
        print(f"📑 Feuilles détectées : {len(excel_file.sheet_names)}")
        for sheet in excel_file.sheet_names:
            print(f"  - {sheet}")
        
        # Construction du contenu système avec instructions de concision
        system_content = """Tu es Liliane 'assistant virtuel du BTS SIO du Lycée Saint Louis à Châteaulin.

RÈGLES IMPORTANTES :
- Utilise des listes à puces pour les énumérations
- Soit chaleureux et amical
- Tu peux utiliser des emojis
- Donne des informations utiles pour les lycéens et leurs parents

BASE DE CONNAISSANCES :

"""
        
        total_lignes = 0
        stats_par_feuille = {}
        
        # Parcourir chaque feuille (= chaque catégorie)
        for sheet_name in excel_file.sheet_names:
            print(f"\n📄 Traitement de la feuille : {sheet_name}")
            
            # Lire la feuille
            df = pd.read_excel(fichier_excel, sheet_name=sheet_name)
            nb_lignes = len(df)
            total_lignes += nb_lignes
            stats_par_feuille[sheet_name] = nb_lignes
            
            print(f"   ✓ {nb_lignes} lignes lues")
            print(f"   📋 Colonnes : {', '.join(df.columns.tolist())}")
            
            # Ajouter le titre de la catégorie (format compact)
            system_content += f"\n## {sheet_name.upper()}\n"
            
            # Parcourir chaque ligne de la feuille
            for idx, row in df.iterrows():
                # Parcourir toutes les colonnes
                info_ajoutee = False
                for col in df.columns:
                    if pd.notna(row[col]):
                        valeur = str(row[col]).strip()
                        if valeur and len(valeur) > 3:  # Ignorer les valeurs trop courtes
                            # Format compact avec tirets
                            system_content += f"- {valeur}\n"
                            info_ajoutee = True
                
                if info_ajoutee:
                    system_content += "\n"
        
        # Créer le Modelfile avec des paramètres pour la concision
        modelfile_content = f"""# Modelfile pour BTS SIO Saint Louis Châteaulin
# Généré automatiquement le {datetime.now().strftime('%d/%m/%Y à %H:%M')}

FROM {modele_base}

# Instructions système
SYSTEM \"\"\"
{system_content}
\"\"\"

# Paramètres optimisés pour des réponses concises
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40

"""
        
        # Sauvegarder le Modelfile
        with open(fichier_sortie, 'w', encoding='utf-8') as f:
            f.write(modelfile_content)
        
        print("\n" + "=" * 70)
        print("✅ GÉNÉRATION TERMINÉE")
        print("=" * 70)
        print(f"📁 Fichier généré : {fichier_sortie}")
        print(f"📊 Statistiques :")
        print(f"   - Total d'informations : {total_lignes} lignes")
        print(f"   - Taille du contenu : {len(system_content)} caractères")
        print(f"\n📋 Détails par catégorie :")
        for feuille, nb in stats_par_feuille.items():
            print(f"   - {feuille}: {nb} entrées")
        
        print("\n" + "=" * 70)
        print("🚀 COMMANDES SUIVANTES")
        print("=" * 70)
        print(f"1️⃣  Créer le modèle :")
        print(f"    ollama create bts-sio-stlouis -f {fichier_sortie}")
        print(f"\n2️⃣  Tester le modèle :")
        print(f"    ollama run bts-sio-stlouis \"C'est quoi le BTS SIO ?\"")
        print(f"\n3️⃣  Lancer en mode interactif :")
        print(f"    ollama run bts-sio-stlouis")
        print("=" * 70)
        
        # Afficher un aperçu
        print("\n📄 APERÇU DU CONTENU (300 premiers caractères):")
        print("-" * 70)
        preview = system_content[:300].replace('\n', '\n   ')
        print(f"   {preview}...")
        print("-" * 70)
        
        # Sauvegarder aussi un fichier de debug pour vérifier
        debug_file = "debug_content.txt"
        with open(debug_file, 'w', encoding='utf-8') as f:
            f.write(system_content)
        print(f"\n💡 Contenu complet sauvegardé dans : {debug_file}")
        
        return True
        
    except FileNotFoundError:
        print(f"❌ Erreur : Le fichier '{fichier_excel}' n'a pas été trouvé")
        print(f"   Assurez-vous que le fichier Excel est dans le même dossier")
        return False
        
    except Exception as e:
        print(f"❌ Erreur lors de la génération : {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Paramètres par défaut
    fichier_excel = "BTS_SIO_Infos.xlsx"
    fichier_sortie = "Modelfile"
    modele_base = "llama3.2"
    
    # Permettre de passer des arguments
    if len(sys.argv) > 1:
        fichier_excel = sys.argv[1]
    if len(sys.argv) > 2:
        fichier_sortie = sys.argv[2]
    if len(sys.argv) > 3:
        modele_base = sys.argv[3]
    
    print("\n🔧 PARAMÈTRES")
    print("-" * 70)
    print(f"Fichier Excel    : {fichier_excel}")
    print(f"Fichier sortie   : {fichier_sortie}")
    print(f"Modèle de base   : {modele_base}")
    print("-" * 70 + "\n")
    
    # Générer le Modelfile
    succes = generer_modelfile_bts_sio(fichier_excel, fichier_sortie, modele_base)
    
    if succes:
        print("\n✅ Génération terminée avec succès !")
    else:
        print("\n❌ La génération a échoué")
        sys.exit(1)
