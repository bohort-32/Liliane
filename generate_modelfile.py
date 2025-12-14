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
        
        # Construction du contenu système
        system_content = "Tu es l'assistant virtuel du BTS SIO (Services Informatiques aux Organisations) du Lycée Saint Louis à Châteaulin.\n\n"
        system_content += "Tu dois répondre de manière claire, professionnelle et accueillante aux questions sur la formation.\n"
        system_content += "Utilise les informations suivantes pour répondre aux questions :\n\n"
        
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
            
            # Ajouter le titre de la catégorie
            system_content += f"\n{'=' * 60}\n"
            system_content += f"📌 {sheet_name.upper()}\n"
            system_content += f"{'=' * 60}\n\n"
            
            # Parcourir chaque ligne de la feuille
            for idx, row in df.iterrows():
                # Parcourir toutes les colonnes
                for col in df.columns:
                    if pd.notna(row[col]):
                        valeur = str(row[col]).strip()
                        if valeur:  # Ignorer les valeurs vides
                            # Si la colonne s'appelle quelque chose de générique, ne pas répéter le nom
                            if col.lower() in ['information', 'contenu', 'description', 'texte']:
                                system_content += f"• {valeur}\n"
                            else:
                                system_content += f"• {col}: {valeur}\n"
                
                system_content += "\n"
        
        # Ajouter des instructions de comportement
        system_content += "\n" + "=" * 60 + "\n"
        system_content += "INSTRUCTIONS DE RÉPONSE :\n"
        system_content += "=" * 60 + "\n"
        system_content += "- Sois enthousiaste et encourageant avec les futurs étudiants\n"
        system_content += "- Si une information n'est pas dans ta base de connaissances, propose de contacter directement le lycée\n"
        system_content += "- Adapte ton niveau de détail selon la question posée\n"
        system_content += "- N'hésite pas à mentionner les points forts de la formation\n"
        system_content += "- Utilise des emojis pertinents pour rendre tes réponses plus engageantes 🎓💻\n"
        system_content += "- Réponds en français de manière naturelle et fluide\n"
        system_content += "- Si on te demande des informations sur les stages, les débouchés, les options, etc., donne des réponses précises et détaillées\n"
        
        # Générer le Modelfile complet
        modelfile_header = f"# Modelfile - BTS SIO Saint Louis Châteaulin\n"
        modelfile_header += f"# Généré le : {datetime.now().strftime('%d/%m/%Y à %H:%M')}\n"
        modelfile_header += f"# Source : {fichier_excel}\n"
        modelfile_header += f"# Nombre de feuilles : {len(excel_file.sheet_names)}\n"
        modelfile_header += f"# Total d'informations : {total_lignes}\n\n"
        
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
        modelfile_content += "PARAMETER repeat_penalty 1.1\n"
        modelfile_content += "PARAMETER num_ctx 4096\n\n"
        
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
        
        # Statistiques détaillées
        print("\n" + "=" * 70)
        print("📊 STATISTIQUES DÉTAILLÉES")
        print("=" * 70)
        print(f"Nombre total de feuilles (catégories) : {len(excel_file.sheet_names)}")
        print(f"Nombre total d'informations : {total_lignes}")
        print("\nRépartition par catégorie :")
        for sheet_name, count in stats_par_feuille.items():
            print(f"  📑 {sheet_name}: {count} entrées")
        
        print("\n" + "=" * 70)
        print("🚀 PROCHAINES ÉTAPES")
        print("=" * 70)
        print(f"1. Créer le modèle :")
        print(f"   ollama create bts-sio-stlouis -f {fichier_sortie}")
        print(f"\n2. Tester le modèle :")
        print(f"   ollama run bts-sio-stlouis")
        print(f"\n3. Exemples de questions :")
        for sheet_name in excel_file.sheet_names[:3]:  # Afficher 3 exemples
            print(f"   - Parle-moi de {sheet_name}")
        print("=" * 70)
        
        # Aperçu du contenu généré
        print("\n📄 APERÇU DU CONTENU GÉNÉRÉ (300 premiers caractères):")
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
