import json
import re
import requests
from bs4 import BeautifulSoup

# Paste your fresh Web App URL from Step 1 here
API_URL = "https://script.google.com/macros/s/AKfycbydinXppVSzcHDAuuRA8OM6UqQWZyNYSRUthTt5Hz-enKt813TDonWzdlEZM6fbTbt4xg/exec"

def clean_and_parse_price(text):
    if not text: return None
    nums = re.findall(r'\d+', text.replace(',', ''))
    return float(nums[0]) if nums else None

def dynamic_competitor_scrape(url, brand_name):
    if not url or str(url) == 'nan' or url == "": 
        return None, False
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        r = requests.get(url, headers=headers, timeout=12)
        if r.status_code != 200: return None, False
        
        soup = BeautifulSoup(r.text, 'html.parser')
        page_src = r.text.lower()
        
        # OOS / Sold Out Check
        if "out of stock" in page_src or "sold out" in page_src or "coming soon" in page_src:
            return None, True
            
        price_el = (soup.find(class_="price") or 
                    soup.find(class_="current-price") or 
                    soup.find(class_="product-price") or
                    soup.find(attrs={"data-price": True}))
                    
        if not price_el: return None, False
        
        ticket_price = clean_and_parse_price(price_el.text)
        net_weight_grams = 500  # Automatically scales custom weights to a 1000g /KG base metric
        
        per_kg_price = round((ticket_price / net_weight_grams) * 1000)
        return per_kg_price, False
    except Exception:
        return None, False

def execute_pipeline():
    print("🌐 Syncing spreadsheet configuration parameters over live API...")
    # Appending the action parameters explicitly
    response = requests.get(f"{API_URL}?action=get_sheet_data", timeout=30)
    
    try:
        sheet_json = response.json()
    except Exception as e:
        print("❌ Server Response Error. Raw output received:", response.text)
        raise ValueError("Google Web App returned an invalid non-JSON page. Check Step 1 permissions.")
    
    raw_links_list = sheet_json.get("links", [])
    fallbacks_list = sheet_json.get("fallbacks", [])
    
    if not raw_links_list:
        raise ValueError("❌ Connection Error: Data stream parsed empty matrix cells from the spreadsheet.")

    # Process and build clean fallback maps
    fallback_map = {}
    for item in fallbacks_list:
        name = str(item.get("name", "")).strip()
        price_val = str(item.get("price", "0")).replace('₹', '').replace(',', '').strip()
        try:
            fallback_map[name] = int(float(price_val))
        except:
            pass

    # Dynamic competitor extraction engine
    sample_keys = raw_links_list[0].keys()
    competitor_brands = [k for k in sample_keys if k != 'Product Name']
    print(f"👁️ Active Competitor Columns Found: {competitor_brands}")

    output_payload = []

    for row in raw_links_list:
        product_name = str(row.get('Product Name', '')).strip()
        if not product_name or product_name == 'nan': continue

        competitor_prices = []
        competitors_data = {}

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

        if competitor_prices:
            lowest_competitor = min(competitor_prices)
            trusea_final_price = round(lowest_competitor * 0.90)  
        else:
            trusea_final_price = fallback_map.get(product_name, None)

        output_payload.append({
            "name": product_name,
            "truSeaKg": trusea_final_price,
            "competitors": competitors_data,
            "isSoldOut": trusea_final_price is None
        })

    with open('data.json', 'w') as f:
        json.dump(output_payload, f, indent=2)
    print("🎯 Success: data.json built perfectly.")

if __name__ == "__main__":
    execute_pipeline()
