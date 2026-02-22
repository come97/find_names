import streamlit as st
import pandas as pd
import plotly.express as px
import numpy as np
import os

# --- Configuration initiale de la page ---
st.set_page_config(
    page_title="Trouver le prénom parfait",
    page_icon="💖",
    layout="wide"
)

# --- CSS personnalisé pour une esthétique professionnelle ---
st.markdown("""
    <style>
        .reportview-container {
            background-color: #f7f9fc;
            padding: 2rem;
        }
        h1 {
            text-align: center;
            color: #333;
        }
        .stButton>button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 0.6em 1.2em;
            border-radius: 5px;
            font-size: 1em;
            margin-top: 0.5em;
        }
        .stMultiSelect, .stNumberInput {
            font-size: 1em;
        }
        h2, h3 {
            color: #444;
        }
    </style>
""", unsafe_allow_html=True)

# --- Fonction de chargement et préparation des données ---
@st.cache_data
def load_data(csv_path: str) -> pd.DataFrame:
    """
    Charge et prépare les données depuis le fichier CSV.
    - La colonne 'sexe' est convertie en 'genre' ("Garçon" ou "Fille").
    - Les colonnes 'preusuel' et 'annais' sont nettoyées.
    - Agrégation par (genre, prénom, année) avec le nombre maximum.
    """
    if not os.path.exists(csv_path):
        st.error(f"Le fichier {csv_path} n'existe pas ! Vérifiez le chemin.")
        return None
    try:
        df = pd.read_csv(csv_path, sep=",")
    except Exception as e:
        st.error(f"Erreur lors du chargement du fichier : {e}")
        return None

    # Transformation de la colonne 'sexe' en 'genre'
    df['sexe'] = pd.to_numeric(df['sexe'], errors='coerce')
    df['genre'] = df['sexe'].map({1: "Garçon", 2: "Fille"})
    df['preusuel'] = df['preusuel'].fillna("").astype(str)
    df['annais'] = pd.to_numeric(df['annais'], errors='coerce')
    df = df.dropna(subset=['annais'])
    df['annais'] = df['annais'].astype(int)
    # Agrégation par genre, prénom et année
    df = df.groupby(['genre', 'preusuel', 'annais'], as_index=False).agg({'nombre': 'max'})
    return df

# --- Chargement des données ---
csv_file = "nat2022.csv"  # Vérifiez que le fichier est présent dans le répertoire
with st.spinner("Chargement des données..."):
    df = load_data(csv_file)
if df is None:
    st.stop()

# --- Sélection globale du genre via la sidebar ---
selected_genre = st.sidebar.radio("Sélectionnez le sexe du bébé", ("Tous", "Garçon", "Fille"), index=0)

# Si un genre spécifique est choisi, on filtre les données globalement
if selected_genre != "Tous":
    df = df[df['genre'] == selected_genre]

st.title("Trouver le prénom parfait ! 💖")
st.markdown("Bienvenue sur l'application dédiée à la découverte de prénoms uniques et porteurs d'histoire. Explorez les tendances et laissez-vous inspirer par des suggestions personnalisées.")

# --- Fonction pour l'onglet de sélection directe par prénom ---
def display_choice_tab(dataframe: pd.DataFrame, selected_genre: str):
    st.header("Choisissez le ou les prénom(s) qui font battre votre cœur")
    if selected_genre == "Tous":
        # Concaténation du prénom et du genre pour éviter les ambiguïtés
        df_display = dataframe.copy()
        df_display['display_name'] = df_display['preusuel'] + " (" + df_display['genre'] + ")"
        choices = sorted(df_display['display_name'].unique())
        default_choice = [choices[0]] if choices else []
        selected_choices = st.multiselect("Sélectionnez vos prénoms favoris :", options=choices, default=default_choice)
        if selected_choices:
            filtered_df = df_display[df_display['display_name'].isin(selected_choices)]
            fig = px.line(
                filtered_df, 
                x='annais', 
                y='nombre', 
                color='display_name', 
                markers=True,
                title="Évolution des prénoms sélectionnés"
            )
            fig.update_layout(xaxis_title="Année", yaxis_title="Nombre de naissances")
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Veuillez sélectionner au moins un prénom pour afficher l'évolution.")
    else:
        # Si le genre est fixé, on affiche directement le prénom
        choices = sorted(dataframe['preusuel'].unique())
        default_choice = [choices[0]] if choices else []
        selected_choices = st.multiselect("Sélectionnez vos prénoms favoris :", options=choices, default=default_choice)
        if selected_choices:
            filtered_df = dataframe[dataframe['preusuel'].isin(selected_choices)]
            fig = px.line(
                filtered_df, 
                x='annais', 
                y='nombre', 
                color='preusuel', 
                markers=True,
                title="Évolution des prénoms sélectionnés"
            )
            fig.update_layout(xaxis_title="Année", yaxis_title="Nombre de naissances")
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Veuillez sélectionner au moins un prénom pour afficher l'évolution.")

# --- Fonction pour l'onglet de filtrage par critères ---
def display_filter_tab(dataframe: pd.DataFrame, selected_genre: str):
    st.header("Découverte par critères personnalisés")
    st.markdown("Affinez votre recherche grâce aux filtres avancés.")
    
    # Critère 1 : Nombre de naissances en 2022
    st.subheader("Critère 1 : Nombre de naissances en 2022")
    col1, col2 = st.columns(2)
    with col1:
        min_2022 = st.number_input("Nombre minimum en 2022", min_value=0, value=0, step=1)
    with col2:
        max_2022 = st.number_input("Nombre maximum en 2022", min_value=0, value=100000, step=1)
    
    # Critère 2 : Pourcentage d'augmentation entre deux années
    st.subheader("Critère 2 : Pourcentage d'augmentation entre deux années")
    min_year = int(dataframe['annais'].min())
    max_year = int(dataframe['annais'].max())
    col3, col4, col5 = st.columns(3)
    with col3:
        A = st.number_input("Année de début (A)", min_value=min_year, max_value=max_year, value=1980, step=1)
    with col4:
        B = st.number_input("Année de fin (B)", min_value=min_year, max_value=max_year, value=2020, step=1)
    with col5:
        seuil = st.number_input("Seuil d'augmentation (%)", value=0.0, step=0.1)
    
    if st.button("Filtrer les prénoms"):
        # Création d'une table pivot avec un index multi (genre, prénom)
        df_pivot = dataframe.pivot(index=['genre', 'preusuel'], columns='annais', values='nombre')
        if 2022 not in df_pivot.columns:
            st.error("Données pour l'année 2022 non disponibles.")
            return
        
        # Filtrage sur le nombre en 2022
        valid = df_pivot[df_pivot[2022].between(min_2022, max_2022)]
        
        # Filtrage sur la présence d'au moins une naissance chaque année durant les 10 dernières années
        latest_year = dataframe['annais'].max()
        last_10_years = list(range(latest_year - 9, latest_year + 1))
        available_years = [year for year in last_10_years if year in df_pivot.columns]
        valid = valid[valid[available_years].ge(1).all(axis=1)]
        
        # Vérification des données pour les années A et B et calcul de l'augmentation
        valid = valid.dropna(subset=[A, B])
        valid = valid.assign(perc_increase = ((valid[B] - valid[A]) / valid[A]) * 100)
        filtered_index = valid.index[valid['perc_increase'] >= seuil].tolist()
        
        if not filtered_index:
            st.info("Aucun prénom ne correspond à ces critères. Veuillez ajuster les filtres et réessayer.")
        else:
            if selected_genre == "Tous":
                options = [f"{pre} ({gen})" for gen, pre in filtered_index]
            else:
                options = [pre for gen, pre in filtered_index]
            selected_options = st.multiselect("Sélectionnez un ou plusieurs prénoms pour visualiser leur évolution", options=options, default=options)
            if selected_options:
                if selected_genre == "Tous":
                    # Filtrage en découpant la chaîne affichée
                    filtered_df = dataframe[dataframe.apply(lambda row: f"{row['preusuel']} ({row['genre']})", axis=1).isin(selected_options)]
                    filtered_df = filtered_df.copy()
                    filtered_df['display_name'] = filtered_df['preusuel'] + " (" + filtered_df['genre'] + ")"
                    color_field = "display_name"
                else:
                    filtered_df = dataframe[dataframe['preusuel'].isin(selected_options)]
                    color_field = "preusuel"
                
                fig2 = px.line(
                    filtered_df, 
                    x='annais', 
                    y='nombre', 
                    color=color_field, 
                    markers=True,
                    title="Évolution des prénoms sélectionnés"
                )
                fig2.update_layout(xaxis_title="Année", yaxis_title="Nombre de naissances")
                st.plotly_chart(fig2, use_container_width=True)
            else:
                st.info("Veuillez sélectionner au moins un prénom pour visualiser leur évolution.")

# --- Création des onglets ---
tab_choice, tab_filter = st.tabs(["Choix par prénom", "Découverte par critères"])

with tab_choice:
    display_choice_tab(df, selected_genre)

with tab_filter:
    display_filter_tab(df, selected_genre)
