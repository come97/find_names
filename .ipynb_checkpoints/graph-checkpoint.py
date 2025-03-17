import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def run_query(query):
    """Exécute une requête et gère les exceptions."""
    try:
        results = execute_query(query)  # Assure-toi que cette fonction est bien définie dans ton environnement
        return results
    except Exception as e:
        print(f"Erreur lors de l'exécution de la requête : {e}")
        return None

# Requête SQL
query = """
WITH base AS (
  SELECT
    DATE_TRUNC(Date_start, WEEK) AS Week,
    industry,
    AVG(coverage_phase) AS avg_coverage
  FROM `dataops.coverage_merchants_roadmap_analysis`
  WHERE parser_type = "Transaction"
    AND done_coverage_date IS NOT NULL
    AND coverage_phase > 0
  GROUP BY Week, industry
)

SELECT
  Week,
  AVG(avg_coverage) AS global_avg,
  industry,
  AVG(avg_coverage) AS industry_avg
FROM base
GROUP BY Week, industry
ORDER BY Week
"""

# Exécuter la requête
df = run_query(query)

# Vérifier si les données sont disponibles
if df is not None and not df.empty:
    # Conversion de la colonne 'Week' au format datetime
    df["Week"] = pd.to_datetime(df["Week"])

    # Pivot pour une meilleure visualisation des courbes
    df_pivot = df.pivot(index="Week", columns="industry", values="industry_avg")
    df_pivot["Global Average"] = df.groupby("Week")["global_avg"].mean()

    # Tracer le graphique
    plt.figure(figsize=(14, 7))
    sns.lineplot(data=df_pivot, linewidth=2.5)

    # Mise en forme du graphique
    plt.title("Évolution de la couverture moyenne par industrie", fontsize=14, fontweight='bold')
    plt.xlabel("Semaine", fontsize=12)
    plt.ylabel("Couverture moyenne", fontsize=12)
    plt.xticks(rotation=45)
    plt.legend(title="Industrie", bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.grid(True, linestyle='--', alpha=0.6)

    # Afficher le graphique
    plt.show()
