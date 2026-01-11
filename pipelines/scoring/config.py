"""
Score Engine Configuration
Genie Game — Big Five Personality Prediction

To work with Google Sheets you need to:
1. Create a Service Account in Google Cloud Console
2. Download credentials.json
3. Share the spreadsheet with the service account email
"""

# === OPERATION MODE ===
# True = read from Google Sheets directly
# False = read from local file (for testing)
USE_GOOGLE_SHEETS = True

# === GOOGLE SHEETS ===
SPREADSHEET_ID = '1lG0_Y_o2jl2rackWJyB1esAUcINb843PhNZBmTwf2L4'
SHEET_TELEMETRY = 'Sheet1'           # Sheet with telemetry from the game
SHEET_OCEAN = 'OCEAN_Facets'         # Sheet for recording predictions
CREDENTIALS_FILE = 'credentials.json' # Service Account keys file

# === LOCAL FILES (for testing) ===
LOCAL_RULEBOOK_FILE = 'rulebook_v2.json'

# === FACET TO BIG FIVE (OCEAN) MAPPING ===
FACET_TO_TRAIT = {
    # ═══════════════════════════════════════
    # OPENNESS (O)
    # ═══════════════════════════════════════
    "Imagination": "Openness",
    "ArtisticInterests": "Openness",
    "Emotionality": "Openness",
    "Adventurousness": "Openness",
    "Intellect": "Openness",
    "Liberalism": "Openness",
    "Adaptability": "Openness",
    "OpennessToExperience": "Openness",
    
    # ═══════════════════════════════════════
    # CONSCIENTIOUSNESS (C)
    # ═══════════════════════════════════════
    "SelfEfficacy": "Conscientiousness",
    "Orderliness": "Conscientiousness",
    "Dutifulness": "Conscientiousness",
    "AchievementStriving": "Conscientiousness",
    "SelfDiscipline": "Conscientiousness",
    "Cautiousness": "Conscientiousness",
    "Deliberation": "Conscientiousness",
    "Consistency": "Conscientiousness",
    "Persistence": "Conscientiousness",
    
    # ═══════════════════════════════════════
    # EXTRAVERSION (E)
    # ═══════════════════════════════════════
    "Friendliness": "Extraversion",
    "Gregariousness": "Extraversion",
    "Assertiveness": "Extraversion",
    "ActivityLevel": "Extraversion",
    "ExcitementSeeking": "Extraversion",
    "Cheerfulness": "Extraversion",
    "SocialBoldness": "Extraversion",
    "Dominance": "Extraversion",
    "RiskTaking": "Extraversion",
    "Decisiveness": "Extraversion",
    
    # ═══════════════════════════════════════
    # AGREEABLENESS (A)
    # ═══════════════════════════════════════
    "Trust": "Agreeableness",
    "Morality": "Agreeableness",
    "Altruism": "Agreeableness",
    "Cooperation": "Agreeableness",
    "Modesty": "Agreeableness",
    "Sympathy": "Agreeableness",
    "Warmth": "Agreeableness",
    
    # ═══════════════════════════════════════
    # NEUROTICISM (N)
    # ═══════════════════════════════════════
    "Anxiety": "Neuroticism",
    "Anger": "Neuroticism",
    "Depression": "Neuroticism",
    "SelfConsciousness": "Neuroticism",
    "Immoderation": "Neuroticism",
    "Impulsiveness": "Neuroticism",
    "Vulnerability": "Neuroticism",
    "Indecisiveness": "Neuroticism",
    "Distractibility": "Neuroticism",
    "Melancholy": "Neuroticism",
    
    # Reverse scales (subtracted from Neuroticism)
    "EmotionalStability": "Neuroticism_Reverse",
    "Calmness": "Neuroticism_Reverse",
    "Confidence": "Neuroticism_Reverse",
}

# === ALL BIG FIVE TRAITS ===
BIG_FIVE_TRAITS = [
    "Openness", 
    "Conscientiousness", 
    "Extraversion", 
    "Agreeableness", 
    "Neuroticism"
]

# === TARGET FACETS ===
# These facets exist in your OCEAN_Facets table as Facet_*_Real and Facet_*_Pred
TARGET_FACETS = [
    # Neuroticism facets
    "Anxiety", "Anger", "Depression", "SelfConsciousness", "Immoderation", "Vulnerability",
    # Extraversion facets
    "Friendliness", "Gregariousness", "Assertiveness", "ActivityLevel", "ExcitementSeeking", "Cheerfulness",
    # Openness facets
    "Imagination", "ArtisticInterests", "Emotionality", "Adventurousness", "Intellect", "Liberalism",
    # Agreeableness facets
    "Trust", "Morality", "Altruism", "Cooperation", "Modesty", "Sympathy",
    # Conscientiousness facets
    "SelfEfficacy", "Orderliness", "Dutifulness", "AchievementStriving", "SelfDiscipline", "Cautiousness"
]
