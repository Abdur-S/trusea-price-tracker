import os
import json
import re
import math
import requests
from bs4 import BeautifulSoup
import pandas as pd

def clean_and_parse_price(text):
    if not text: return None
    nums = re.findall(r'\d+', text.replace(',', ''))
    return float(nums[0]) if nums else None

# A generic, flexible scraping parser module
def dynamic_competitor_scrape(url, brand_name):
    if not url or str(url) == 'nan' or url == "": 
        return None, False
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        r = requests.get(url, headers=headers, timeout=12)
        if r.status_code != 200: 
            return None, False
        
        soup = BeautifulSoup(r.text, 'html.parser')
        page_src = r.text.lower()
        
        # Global Stock Out Check
        if "out of stock" in page_src or "sold out" in page_src or "coming soon" in page_src:
            return None, True
            
        # Generic price extraction check (matches standard e-commerce classes dynamically)
        price_el = (soup.find(class_="price") or 
                    soup.find(class_="current-price") or 
                    soup.find(class_="product-price") or
                    soup.find(attrs={"data-price": True}))
                    
        if not price_el: 
            return None, False
        
        ticket_price = clean_and_parse_price(price_el.text)
        net_weight_grams = 500  # Default fallback pack weight
        
        # Calculate dynamic price per KG
        per_kg_price = round((ticket_price / net_weight_grams) * 1000)
        return per_kg_price, False
    except Exception:
        return None, False

def execute_pipeline():
    excel_file = "TruSea Competitor Price Tracker (4).xlsx"
    if not os.path.exists(excel_file):
        print("Excel ledger missing.")
        return

    xls = pd.ExcelFile(excel_file)
    df_link = pd.read_excel(xls, "Link")
    df_trusea = pd.read_excel(xls, "TruSea kg Price")

    # 1. Map Sheet 2 Fallback Database 
    fallback_map = {}
    for _, row in df_trusea.iterrows():
        name = str(row.iloc[0]).strip()
        price = row.iloc[1]
        if name and pd.notna(price):
            fallback_map[name] = int(price)

    # 2. Automatically discover all competitors from sheet 1 headers!
    all_columns = df_link.columns.tolist()
    competitor_brands = [col for col in all_columns if col != 'Product Name']
    print(f"👁️ Automatically detected competitors: {competitor_brands}")

    output_payload = []

    for _, row in df_link.iterrows():
        product_name = str(row['Product Name']).strip()
        if not product_name or product_name == 'nan': 
            continue

        competitor_prices = []
        competitors_data = {}

        # Loop through whatever competitors are present in the sheet dynamically
        for brand in competitor_brands:
            url = row.get(brand, '')
            
            comp_price, is_oos = dynamic_competitor_scrape(url, brand)
            
            if is_oos:
                competitors_data[brand] = "STOCKED OUT"
            elif comp_price:
                competitors_data[brand] = comp_price
                competitor_prices.append(comp_price)
            else:
                competitors_data[brand] = None

        # Apply TruSea Pricing Optimization Rule
        if competitor_prices:
            lowest_competitor = min(competitor_prices)
            trusea_final_price = round(lowest_competitor * 0.90)  # Min competitor price minus 10%
        else:
            # Automatic Fallback to Sheet 2 if links are empty/out-of-stock
            trusea_final_price = fallback_map.get(product_name, None)

        output_payload.append({
            "name": product_name,
            "truSeaKg": trusea_final_price,
            "competitors": competitors_data,
            "isSoldOut": trusea_final_price is None
        })

    # Save output to static JSON
    with open('data.json', 'w') as f:
        json.dump(output_payload, f, indent=2)
    print("🎯 Dynamic live synchronization payload created successfully.")

if __name__ == "__main__":
    execute_pipeline()
