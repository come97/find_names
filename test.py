import argparse
from dbfread import DBF

def test_encodings(dbf_file, candidate_encodings, search_term=None, max_records=10):
    """
    Teste plusieurs encodages sur le fichier DBF et affiche les enregistrements.

    :param dbf_file: Chemin vers le fichier DBF.
    :param candidate_encodings: Liste d'encodages à tester.
    :param search_term: (Optionnel) Terme à rechercher dans le champ 'preusuel'.
    :param max_records: Nombre maximum d'enregistrements à afficher par encodage.
    """
    for enc in candidate_encodings:
        print("="*40)
        print(f"=== Test avec l'encodage: {enc} ===")
        try:
            table = DBF(dbf_file, encoding=enc, char_decode_errors='replace', load=True)
            count = 0
            for record in table:
                # Si un terme de recherche est spécifié, n'afficher que les enregistrements correspondants
                if search_term is None or search_term.lower() in record['preusuel'].lower():
                    print(record)
                    count += 1
                if count >= max_records:
                    break
            if count == 0:
                print("Aucun enregistrement trouvé pour le terme de recherche spécifié.")
        except Exception as e:
            print(f"Erreur avec l'encodage {enc}: {e}")
        print("\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Test multiple d'encodages sur un fichier DBF pour débugger les problèmes d'affichage des caractères."
    )
    parser.add_argument("dbf_file", help="Chemin vers le fichier DBF d'entrée")
    parser.add_argument(
        "--encodings",
        nargs="+",
        default=["cp1252", "latin1", "utf-8", "iso-8859-15"],
        help="Liste d'encodages à tester (défaut: cp1252 latin1 utf-8 iso-8859-15)"
    )
    parser.add_argument(
        "--search",
        default="C",  # Par défaut, on affiche les enregistrements contenant "C" (pour attraper "Côme")
        help="Terme à rechercher dans le champ 'preusuel' (exemple: 'Côme')"
    )
    parser.add_argument(
        "--max-records",
        type=int,
        default=10,
        help="Nombre maximum d'enregistrements à afficher par encodage."
    )
    args = parser.parse_args()
    
    test_encodings(args.dbf_file, candidate_encodings=args.encodings, search_term=args.search, max_records=args.max_records)
