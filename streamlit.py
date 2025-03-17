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
    df = pd.read_csv(csv_path, sep=",")
    # S'assurer que la colonne 'preusuel' soit bien une chaîne de caractères
    df['preusuel'] = df['preusuel'].fillna("").astype(str)
    return df

# Chargement du fichier CSV nettoyé
csv_file = "nat2022.csv"  # Assurez-vous que ce fichier existe
df = load_data(csv_file)
if df is None:
    st.stop()

st.title("Trouver le prénom parfait ! 💖")

# Création de deux onglets : un pour un choix direct, l'autre pour une découverte par filtres
tab1, tab2 = st.tabs(["Choix par prénom", "Découverte par critères"])

# ----- Onglet 1 : Choix par prénom -----
with tab1:
    st.header("Choisis le prénom qui fait battre ton cœur")
    # On trie la liste des prénoms (tous convertis en chaîne)
    prenoms = sorted(df['preusuel'].unique())
    selected_prenom = st.selectbox("Quel prénom te fait rêver ?", prenoms)
    
    # Filtrer les données pour le prénom sélectionné
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
        st.markdown("Regarde comme ce prénom a traversé le temps, tout comme votre amour grandit !")

# ----- Onglet 2 : Découverte par critères -----
with tab2:
    st.header("Découvrons ensemble des prénoms qui pourraient être parfaits")
    
    st.markdown("### Critère 1 : Nombre de naissances en 2022")
    col1, col2 = st.columns(2)
    with col1:
        min_2022 = st.number_input("Nombre minimum en 2022", min_value=0, value=0, step=1)
    with col2:
        max_2022 = st.number_input("Nombre maximum en 2022", min_value=0, value=100000, step=1)
    
    st.markdown("### Critère 2 : Pourcentage d'augmentation lissé")
    st.write("On va calculer la moyenne sur X années entre l'année A et B pour voir si l'évolution te plaît !")
    col3, col4, col5, col6 = st.columns(4)
    with col3:
        X = st.number_input("X (années de lissage)", min_value=1, value=3, step=1)
    with col4:
        A = st.number_input("Année de début (A)", min_value=int(df['annais'].min()), max_value=int(df['annais'].max()), value=1980, step=1)
    with col5:
        B = st.number_input("Année de fin (B)", min_value=int(df['annais'].min()), max_value=int(df['annais'].max()), value=2020, step=1)
    with col6:
        seuil = st.number_input("Seuil d'augmentation (%)", value=0.0, step=0.1)
    
    st.markdown("**Note :** La moyenne est calculée sur [A, A+X-1] et sur [B-X+1, B].")
    
    if st.button("Filtrer les prénoms"):
        # On filtre selon le nombre de naissances en 2022
        df_2022 = df[df['annais'] == 2022]
        valid_prenoms = df_2022[(df_2022['nombre'] >= min_2022) & (df_2022['nombre'] <= max_2022)]['preusuel'].unique()
        
        filtered_prenoms = []
        for prenom in valid_prenoms:
            df_prenom = df[df['preusuel'] == prenom]
            # Période pour A : [A, A+X-1]
            df_A = df_prenom[(df_prenom['annais'] >= A) & (df_prenom['annais'] < A + X)]
            # Période pour B : [B-X+1, B]
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
        
        if not filtered_prenoms:
            st.write("Aucun prénom ne correspond à ces critères... Peut-être faut-il ajuster les filtres, ou votre futur trésor portera un nom totalement inédit !")
        else:
            if len(filtered_prenoms) > 5:
                random_prenoms = np.random.choice(filtered_prenoms, 5, replace=False)
            else:
                random_prenoms = filtered_prenoms
            
            st.write("Voici quelques suggestions qui pourraient faire chavirer vos cœurs :")
            selected_from_list = st.radio("Cliquez sur un prénom pour en voir l'évolution", random_prenoms)
            
            df_sel = df[df['preusuel'] == selected_from_list]
            if df_sel.empty:
                st.write("Aucune donnée disponible pour ce prénom... un mystère à découvrir peut-être ?")
            else:
                fig2, ax2 = plt.subplots()
                ax2.plot(df_sel['annais'], df_sel['nombre'], marker='o')
                ax2.set_title(f"L'évolution du prénom {selected_from_list}")
                ax2.set_xlabel("Année")
                ax2.set_ylabel("Nombre de naissances")
                st.pyplot(fig2)
                st.markdown("Voilà comment ce prénom a évolué au fil des années. Un indice pour imaginer l'avenir de votre futur petit ange !")
