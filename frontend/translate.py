import json
import os
from deep_translator import GoogleTranslator
import time

msg_dir = r"d:\Github\cannathera-saas\frontend\messages"
en_path = os.path.join(msg_dir, "en.json")

with open(en_path, "r", encoding="utf-8") as f:
    en_data = json.load(f)

lang_map = {
    "ar": "ar",
    "ary": "ar",
    "bg": "bg",
    "de": "de",
    "pl": "pl",
    "ro": "ro",
    "ru": "ru",
    "tr": "tr",
    "uk": "uk"
}

def translate_value(val, lang_code):
    if isinstance(val, str):
        try:
            result = GoogleTranslator(source='en', target=lang_code).translate(val)
            time.sleep(0.3)
            return result
        except Exception as e:
            print(f"Error translating: {e}")
            return val
    elif isinstance(val, list):
        return [translate_value(v, lang_code) for v in val]
    elif isinstance(val, dict):
        return {k: translate_value(v, lang_code) for k, v in val.items()}
    return val

def sync_keys(source, target, lang_code, path=""):
    updated = False
    for key, value in source.items():
        curr_path = f"{path}.{key}" if path else key
        if key not in target:
            print(f"[{lang_code}] Missing key: {curr_path}. Translating...")
            target[key] = translate_value(value, lang_code)
            updated = True
        elif isinstance(value, dict) and isinstance(target[key], dict):
            if sync_keys(value, target[key], lang_code, curr_path):
                updated = True
        elif isinstance(value, list) and isinstance(target[key], list):
            # Just force update for 'faq' or 'landing' if missing or changed length
            if len(value) != len(target[key]):
                print(f"[{lang_code}] Array length mismatch: {curr_path}. Translating...")
                target[key] = translate_value(value, lang_code)
                updated = True
            elif curr_path.startswith("landing.features.") and isinstance(value, list):
                # Force translate features bullets to ensure they are updated
                print(f"[{lang_code}] Forcing update of: {curr_path}")
                target[key] = translate_value(value, lang_code)
                updated = True
        elif type(value) == str and type(target.get(key)) == str:
            # Force update if it's one of the keys we just changed
            force_keys = [
                "landing.hero.title", "landing.hero.v2_subtitle", 
                "landing.features.title", "landing.features.subtitle",
                "physicians.hero_title", "physicians.hero_intro", "physicians.f1_text", "physicians.f2_text",
                "pharmacies.hero_title", "pharmacies.hero_intro", 
                "telemedicine.v2_hero_intro", "telemedicine.v2_f1_text",
                # Pharmacy portal overhaul – nav labels
                "pharmacy.shell.nav.reviews",
                "pharmacy.shell.nav.logs",
                "pharmacy.shell.nav.analytics",
                "pharmacy.shell.nav.prescriptions",
                "pharmacy.shell.nav.network",
                "pharmacy.shell.noticeOverdue",
                # Pharmacy dashboard labels
                "pharmacy.dashboard.title",
                "pharmacy.dashboard.subtitle",
                "pharmacy.dashboard.monthlyVolume",
                "pharmacy.dashboard.activeRegulars",
                "pharmacy.dashboard.returningPatients",
                "pharmacy.dashboard.liveOrderTicker",
                "pharmacy.dashboard.viewAllOrders",
                "pharmacy.dashboard.noNewOrders",
                "pharmacy.dashboard.newPrescriptionReceived",
                "pharmacy.dashboard.lowStock",
                "pharmacy.dashboard.noStockAlert",
                "pharmacy.dashboard.colLastReview",
                "pharmacy.dashboard.start",
                "pharmacy.dashboard.noneDue",
                "pharmacy.dashboard.reviewsDue",
                "pharmacy.dashboard.dueThisMonth",
                "pharmacy.dashboard.completed",
                # Pharmacy reviews page
                "pharmacy.reviews.title",
                "pharmacy.reviews.subtitle",
                "pharmacy.reviews.overdue",
                "pharmacy.reviews.tabAll",
                "pharmacy.reviews.tabOverdue",
                "pharmacy.reviews.tabDueSoon",
                "pharmacy.reviews.tabOnTrack",
                "pharmacy.reviews.tabFlagged",
                "pharmacy.reviews.viewLogs",
                "pharmacy.reviews.colLast",
                "pharmacy.reviews.colDue",
                "pharmacy.reviews.startReview",
                "pharmacy.reviews.exportRecords",
                # Pharmacy network
                "pharmacy.network.doctors",
            ]
            if curr_path in force_keys:
                print(f"[{lang_code}] Forcing update of string: {curr_path}")
                target[key] = translate_value(value, lang_code)
                updated = True
    return updated

files = [f for f in os.listdir(msg_dir) if f.endswith(".json") and f != "en.json"]
for file in files:
    lang = file.replace(".json", "")
    target_code = lang_map.get(lang, "en")
    if target_code == "en":
        continue
    
    file_path = os.path.join(msg_dir, file)
    with open(file_path, "r", encoding="utf-8") as f:
        target_data = json.load(f)
    
    print(f"\n--- Synchronizing {file} ---")
    if sync_keys(en_data, target_data, target_code):
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(target_data, f, ensure_ascii=False, indent=2)
        print(f"Saved {file}")
    else:
        print(f"No missing keys in {file}")
