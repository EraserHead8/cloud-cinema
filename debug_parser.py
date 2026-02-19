import httpx
import asyncio
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
}

async def debug_search(query):
    base_url = "https://kinogo.la"
    print(f"Deep debugging {base_url} with query '{query}'...")
    
    url = f"{base_url}/index.php?do=search"
    data = {
        "do": "search",
        "subaction": "search",
        "story": query
    }
    
    try:
        async with httpx.AsyncClient(follow_redirects=True, headers=HEADERS, timeout=10.0) as client:
            resp = await client.post(url, data=data)
            print(f"Status: {resp.status_code}")
            print(f"Apparent encoding: {resp.encoding}")
            
            # Kinogo often uses CP1251
            if 'charset=windows-1251' in resp.headers.get('content-type', '').lower():
                resp.encoding = 'windows-1251'
            
            html = resp.text
            soup = BeautifulSoup(html, 'html.parser')
            items = soup.find_all('div', class_='shortstory')
            print(f"Found {len(items)} items (.shortstory)")
            
            # Dump to file
            print("Dumping HTML to debug_kinogo.la.html")
            with open("debug_kinogo.la.html", "w", encoding="utf-8") as f:
                f.write(html)

    except Exception as e:
        print(f"Error: {e}")
        
asyncio.run(debug_search("Dune"))
