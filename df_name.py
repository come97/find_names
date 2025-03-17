import argparse
import pandas as pd
from dbfread import DBF

def convert_dbf_to_csv(dbf_file, csv_file, dbf_encoding="cp1252", csv_encoding="utf-8"):
    """
    Convertit un fichier DBF en CSV en gérant les erreurs de décodage.
    
    :param dbf_file: Chemin vers le fichier DBF d'entrée.
    :param csv_file: Chemin vers le fichier CSV de sortie.
    :param dbf_encoding: Encodage du fichier DBF (par défaut "cp1252").
    :param csv_encoding: Encodage pour le CSV de sortie (par défaut "utf-8").
    """
    try:
        # Utilisation de char_decode_errors pour remplacer les caractères problématiques
        table = DBF(dbf_file, encoding=dbf_encoding, char_decode_errors='replace', load=True)
        df = pd.DataFrame(iter(table))
        df.to_csv(csv_file, index=False, encoding=csv_encoding)
        print(f"Conversion terminée : {csv_file}")
    except Exception as e:
        print(f"Erreur lors de la conversion : {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convertir un fichier DBF en CSV avec gestion de l'encodage.")
    parser.add_argument("dbf_file", nargs="?", default="nat2022.dbf", help="Chemin vers le fichier DBF d'entrée")
    parser.add_argument("csv_file", nargs="?", default="nat2022_v2.csv", help="Chemin vers le fichier CSV de sortie")
    parser.add_argument("--dbf-encoding", default="cp1252", help="Encodage du fichier DBF (par défaut : cp1252)")
    parser.add_argument("--csv-encoding", default="utf-8", help="Encodage du fichier CSV de sortie (par défaut : utf-8)")
    args = parser.parse_args()

    convert_dbf_to_csv(args.dbf_file, args.csv_file, dbf_encoding=args.dbf_encoding, csv_encoding=args.csv_encoding)

