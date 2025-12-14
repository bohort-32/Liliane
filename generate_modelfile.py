# generate_modelfile.py
import pandas as pd
from datetime import datetime
import sys

def generer_modelfile_bts_sio(fichier_excel="BTS_SIO_Infos.xlsx", 
                                fichier_sortie="Modelfile",
                                modele_base="llama3.2"):
    """
    Génère un Modelfile pour Ollama à partir du fichier Excel du BTS SIO
    """
    
    print("=" * 70)
    print("🎓 Générateur de Modelfile - BTS SIO Saint Louis Châteaulin")
    print("=" * 70)
    
    try:
        # Lecture du fichier Excel
        print(f"\n📖 Lecture du fichier : {fichier_excel}")
        df = pd.read_excel(fichier_excel)
        print(f"✓ {len(df)} lignes d'informations chargées")
        
        # Afficher les colonnes disponibles
        print(f"📋 Colonnes détectées : {', '.join(df.columns.tolist())}")
        
        # Construction du contenu système
        system_content = "Tu es l'assistant virtuel du BTS SIO (Services Informatiques aux Organisations) du Lycée Saint Louis à Châteaulin.\n\n"
        system_content += "Tu dois répondre de manière claire, professionnelle et accueillante aux questions sur la formation.\n"
        system_content += "Utilise les informations suivantes pour répondre aux questions :\n\n"
        
        # Vérifier si la colonne 'Catégorie' existe
        if 'Catégorie' in df.columns:
            # Organiser les informations par catégorie
            categories = df['Catégorie'].unique()
            
            for categorie in categories:
                if pd.notna(categorie):
                    system_content += f"\n{'=' * 60}\n"
                    system_content += f"📌 {categorie.upper()}\n"
                    system_content += f"{'=' * 60}\n\n"
                    
                    # Filtrer les lignes de cette catégorie
                    lignes_categorie = df[df['Catégorie'] == categorie]
                    
                    for _, row in lignes_categorie.iterrows():
                        # Parcourir toutes les colonnes sauf 'Catégorie'
                        for col in df.columns:
                            if col != 'Catégorie' and pd.notna(row[col]):
                                system_content += f"• {col}: {row[col]}\n"
                        system_content += "\n"
        else:
            # Si pas de catégorie, afficher toutes les informations
            print("⚠️ Colonne 'Catégorie' non trouvée, affichage simple")
            for _, row in df.iterrows():
                for col in df.columns:
                    if pd.notna(row[col]):
                        system_content += f"• {col}: {row[col]}\n"
                system_content += "\n"
        
        # Ajouter des instructions de comportement
        system_content += "\n" + "=" * 60 + "\n"
        system_content += "INSTRUCTIONS DE RÉPONSE :\n"
        system_content += "=" * 60 + "\n"
        system_content += "- Sois enthousiaste et encourageant avec les futurs étudiants\n"
        system_content += "- Si une information n'est pas dans ta base de connaissances, propose de contacter directement le lycée\n"
        system_content += "- Adapte ton niveau de détail selon la question posée\n"
        system_content += "- N'hésite pas à mentionner les points forts de la formation\n"
        system_content += "- Utilise des emojis pertinents pour rendre tes réponses plus engageantes\n"
        system_content += "- Réponds en français de manière naturelle et fluide\n"
        
        # Générer le Modelfile complet
        modelfile_header = f"# Modelfile - BTS SIO Saint Louis Châteaulin\n"
        modelfile_header += f"# Généré le : {datetime.now().strftime('%d/%m/%Y à %H:%M')}\n"
        modelfile_header += f"# Source : {fichier_excel}\n\n"
        
        modelfile_content = modelfile_header
        modelfile_content += f"FROM {modele_base}\n\n"
        modelfile_content += "# Prompt système avec toutes les informations\n"
        modelfile_content += 'SYSTEM """\n'
        modelfile_content += system_content
        modelfile_content += '\n"""\n\n'
        
        modelfile_content += "# Paramètres optimisés pour l'assistance\n"
        modelfile_content += "PARAMETER temperature 0.7\n"
        modelfile_content += "PARAMETER top_p 0.9\n"
        modelfile_content += "PARAMETER top_k 40\n"
        modelfile_content += "PARAMETER repeat_penalty 1.1\n\n"
        
        modelfile_content += "# Template de conversation\n"
        modelfile_content += 'TEMPLATE """\n'
        modelfile_content += "{{ if .System }}{{ .System }}{{ end }}\n\n"
        modelfile_content += "{{ if .Prompt }}User: {{ .Prompt }}{{ end }}\n\n"
        modelfile_content += "Assistant: \n"
        modelfile_content += '"""\n'
        
        # Écriture du fichier
        print(f"\n💾 Écriture du Modelfile : {fichier_sortie}")
        with open(fichier_sortie, 'w', encoding='utf-8') as f:
            f.write(modelfile_content)
        
        print(f"✓ Modelfile généré avec succès !")
        
        # Statistiques
        print("\n" + "=" * 70)
        print("📊 STATISTIQUES")
        print("=" * 70)
        print(f"Nombre total d'informations : {len(df)}")
        
        if 'Catégorie' in df.columns:
            categories = df['Catégorie'].unique()
            print(f"Catégories : {len(categories)}")
            for cat in categories:
                if pd.notna(cat):
                    count = len(df[df['Catégorie'] == cat])
                    print(f"  - {cat}: {count} entrées")
        
        print("\n" + "=" * 70)
        print("🚀 PROCHAINES ÉTAPES")
        print("=" * 70)
        print(f"1. Créer le modèle : ollama create bts-sio-stlouis -f {fichier_sortie}")
        print(f"2. Tester le modèle : ollama run bts-sio-stlouis")
        print(f"3. Exemple de question : 'Quelles sont les options du BTS SIO ?'")
        print("=" * 70)
        
        # Aperçu du contenu généré
        print("\n📄 APERÇU DU CONTENU GÉNÉRÉ (100 premiers caractères):")
        print("-" * 70)
        print(system_content[:200] + "...")
        print("-" * 70)
        
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
    generer_modelfile_bts_sio(fichier_excel, fichier_sortie, modele_base)
