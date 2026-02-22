import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import os

@st.cache_data
def load_data(csv_path):
    if not os.path.exists(csv_path):
        st.error(f"Le fichier {csv_path} n'existe pas ! Vérifie le chemin.")
        return None
    # Lecture du CSV nettoyé
    df = pd.read_csv(csv_path, sep=",")
    
    # Correction d'éventuels problèmes d'encodage sur la colonne 'preusuel'
    def fix_encoding(s):
        if isinstance(s, str) and "Ã" in s:
            try:
                return s.encode('latin1').decode('utf-8')
            except Exception:
                return s
        return s
    df['preusuel'] = df['preusuel'].fillna("").astype(str).apply(fix_encoding)
    
    # S'assurer que 'annais' est numérique et convertir 'nombre'
    df = df[df['annais'].astype(str).str.isnumeric()]
    df['annais'] = df['annais'].astype(int)
    df['nombre'] = pd.to_numeric(df['nombre'], errors='coerce')
    df.dropna(subset=['nombre'], inplace=True)
    return df

# Chargement du fichier CSV nettoyé
csv_file = "nat2022.csv"  # Assurez-vous que ce fichier existe
df = load_data(csv_file)
if df is None:
    st.stop()

st.title("Trouvons le prénom parfait ! 💖")

# Deux onglets : un choix direct et une découverte par filtres
tab1, tab2 = st.tabs(["Choix par prénom", "Découverte par critères"])

# ---------------- Onglet 1 : Choix par prénom ----------------
with tab1:
    st.header("Choisis le prénom qui fait battre ton cœur")
    prenoms = sorted(df['preusuel'].unique())
    selected_prenom = st.selectbox("Quel prénom te fait rêver ?", prenoms, key="tab1_prenom")
    
    df_prenom = df[df['preusuel'] == selected_prenom]
    if df_prenom.empty:
        st.write("Oups, aucune donnée pour ce prénom... Peut-être est-il trop unique ?")
    else:
        fig, ax = plt.subplots()
        ax.plot(df_prenom['annais'], df_prenom['nombre'], marker='o')
        ax.set_title(f"L'évolution du prénom {selected_prenom}")
        ax.set_xlabel("Année")
        ax.set_ylabel("Nombre de naissances")
        st.pyplot(fig)
        st.markdown("Regarde comme ce prénom a traversé le temps, tout comme votre amour grandit !")

# ---------------- Onglet 2 : Découverte par critères ----------------
with tab2:
    st.header("Découvrons ensemble des prénoms qui pourraient être parfaits")
    
    st.markdown("### Critère 1 : Nombre de naissances en 2022")
    col1, col2 = st.columns(2)
    with col1:
        min_2022 = st.number_input("Nombre minimum en 2022", min_value=0, value=0, step=1, key="min2022")
    with col2:
        max_2022 = st.number_input("Nombre maximum en 2022", min_value=0, value=100000, step=1, key="max2022")
    
    st.markdown("### Critère 2 : Pourcentage d'augmentation lissé")
    st.write("On calcule la moyenne sur X années entre l'année A et B pour voir si l'évolution vous plaît !")
    col3, col4, col5, col6 = st.columns(4)
    with col3:
        X = st.number_input("X (années de lissage)", min_value=1, value=3, step=1, key="X")
    with col4:
        A = st.number_input("Année de début (A)", min_value=int(df['annais'].min()), max_value=int(df['annais'].max()), value=1980, step=1, key="A")
    with col5:
        B = st.number_input("Année de fin (B)", min_value=int(df['annais'].min()), max_value=int(df['annais'].max()), value=2020, step=1, key="B")
    with col6:
        seuil = st.number_input("Seuil d'augmentation (%)", value=0.0, step=0.1, key="seuil")
    
    st.markdown("**Note :** La moyenne est calculée sur [A, A+X-1] et sur [B-X+1, B].")
    
    # Bouton pour lancer le filtrage et stocker le résultat dans st.session_state
    if st.button("Filtrer les prénoms", key="filter_btn"):
        df_2022 = df[df['annais'] == 2022]
        valid_prenoms = df_2022[(df_2022['nombre'] >= min_2022) & (df_2022['nombre'] <= max_2022)]['preusuel'].unique()
        filtered_prenoms = []
        for prenom in valid_prenoms:
            df_prenom = df[df['preusuel'] == prenom]
            df_A = df_prenom[(df_prenom['annais'] >= A) & (df_prenom['annais'] < A + X)]
            df_B = df_prenom[(df_prenom['annais'] <= B) & (df_prenom['annais'] > B - X)]
            if df_A.empty or df_B.empty:
                continue
            avg_A = df_A['nombre'].mean()
            avg_B = df_B['nombre'].mean()
            if avg_A > 0:
                perc_increase = ((avg_B - avg_A) / avg_A) * 100
            else:
                perc_increase = 0
            if perc_increase >= seuil:
                filtered_prenoms.append(prenom)
        st.session_state.filtered_prenoms = filtered_prenoms
    
    # Affichage de la sélection des prénoms filtrés (si le filtrage a été effectué)
    if "filtered_prenoms" in st.session_state:
        filtered_prenoms = st.session_state.filtered_prenoms
        if not filtered_prenoms:
            st.write("Aucun prénom ne correspond à ces critères... Peut-être faut-il ajuster les filtres, ou votre futur trésor portera un nom totalement inédit !")
        else:
            # Si plus de 5 prénoms, on en choisit 5 aléatoirement
            if len(filtered_prenoms) > 5:
                random_prenoms = np.random.choice(filtered_prenoms, 5, replace=False)
            else:
                random_prenoms = filtered_prenoms
            selected_from_list = st.radio("Cliquez sur un prénom pour en voir l'évolution", random_prenoms, key="filtered_radio")
            
            df_sel = df[df['preusuel'] == selected_from_list]
            if df_sel.empty:
                st.write("Aucune donnée disponible pour ce prénom... Un mystère à découvrir peut-être ?")
            else:
                fig2, ax2 = plt.subplots()
                ax2.plot(df_sel['annais'], df_sel['nombre'], marker='o')
                ax2.set_title(f"L'évolution du prénom {selected_from_list}")
                ax2.set_xlabel("Année")
                ax2.set_ylabel("Nombre de naissances")
                st.pyplot(fig2)
                st.markdown("Voilà comment ce prénom a évolué au fil des années. Un indice pour imaginer l'avenir de votre futur petit ange !")
