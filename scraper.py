import os
import json
import re
import math
import requests
from bs4 import BeautifulSoup

def clean_and_parse_price(text):
    if not text: return None
    nums = re.findall(r'\d+', text.replace(',', ''))
    return float(nums[0]) if nums else None

def scrape_tendercuts_normalized(url):
    if not url or str(url) == 'nan' or url == "": return None, False
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        r = requests.get(url, headers=headers, timeout=12)
        if r.status_code != 200: return None, False
        
        soup = BeautifulSoup(r.text, 'html.parser')
        page_src = r.text.toLowerCase()
        
        # 1. Detect Stock Out Conditions
        if "out of stock" in page_src or "sold out" in page_src:
            return None, True
            
        # 2. Extract Price and Gross-to-Net Weights (Custom adjustments based on active classes)
        price_el = soup.find(class_="price") or soup.find(class_="current-price")
        if not price_el: return None, False
        
        ticket_price = clean_and_parse_price(price_el.text)
        
        # Mathematical conversion assumption (e.g. 500g net pack standard allocation)
        net_weight_grams = 500 
        
        per_kg_price = math.round((ticket_price / net_weight_grams) * 1000)
        return per_kg_price, False
    except Exception:
        return None, False

def scrape_licious_normalized(url):
    if not url or str(url) == 'nan' or url == "": return None, False
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
        r = requests.get(url, headers=headers, timeout=12)
        if r.status_code != 200: return None, False
        
        soup = BeautifulSoup(r.text, 'html.parser')
        page_src = r.text.lower()
        
        if "out of stock" in page_src or "sold out" in page_src or "coming soon" in page_src:
            return None, True
            
        price_el = soup.find(class_="product-price") or soup.find(class_="price")
        if not price_el: return None, False
        
        ticket_price = clean_and_parse_price(price_el.text)
        net_weight_grams = 500 
        
        per_kg_price = math.round((ticket_price / net_weight_grams) * 1000)
        return per_kg_price, False
    except Exception:
        return None, False

def execute_pipeline():
    # Excel Sheets fallbacks references mapping
    excel_file = "TruSea Competitor Price Tracker (4).xlsx"
    if not os.path.exists(excel_file):
        print("Excel mapping ledger file missing.")
        return

    import pandas as pd
    xls = pd.ExcelFile(excel_file)
    df_link = pd.read_excel(xls, "Link")
    df_trusea = pd.read_excel(xls, "TruSea kg Price")

    # Map Sheet 2 Baseline fallbacks
    fallback_map = {}
    for _, row in df_trusea.iterrows():
        name = str(row.iloc[0]).strip()
        price = row.iloc[1]
        if name and pd.notna(price):
            fallback_map[name] = int(price)

    output_payload = []

    for _, row in df_link.iterrows():
        product_name = str(row['Product Name']).strip()
        if not product_name or product_name == 'nan': continue

        tc_url = row.get('TenderCuts', '')
        lic_url = row.get('Licious', '')

        competitor_prices = []
        competitors_data = {"TenderCuts": None, "Licious": None}

        # Handle TenderCuts Scrape + Stock notification checks
        tc_price, tc_oos = scrape_tendercuts_normalized(tc_url)
        if tc_oos:
            competitors_data["TenderCuts"] = "STOCKED OUT"
        elif tc_price:
            competitors_data["TenderCuts"] = tc_price
            competitor_prices.append(tc_price)

        # Handle Licious Scrape + Stock notification checks
        lic_price, lic_oos = scrape_licious_normalized(lic_url)
        if lic_oos:
            competitors_data["Licious"] = "STOCKED OUT"
        elif lic_price:
            competitors_data["Licious"] = lic_price
            competitor_prices.append(lic_price)

        # Apply Rule Engine: Least Competitor - 10%
        if competitor_prices:
            lowest_competitor = min(competitor_prices)
            trusea_final_price = math.round(lowest_competitor * 0.90)
        else:
            # Automatic Sheet 2 current price fallback rule if competitors are out of stock or empty
            trusea_final_price = fallback_map.get(product_name, None)

        output_payload.append({
            "name": product_name,
            "truSeaKg": trusea_final_price,
            "competitors": competitors_data,
            "isSoldOut": trusea_final_price is None or (tc_oos and lic_oos)
        })

    # Save output as static JSON to bypass runtime API latency blockers completely
    with open('data.json', 'w') as f:
        json.dump(output_payload, f, indent=2)
    print("🎯 Scrape pipeline run successfully complete. Data matrix built.")

if __name__ == "__main__":
    execute_pipeline()
