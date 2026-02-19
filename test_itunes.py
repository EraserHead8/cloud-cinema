import asyncio
import httpx

async def test_search(query, country=None, lang=None):
    url = "https://itunes.apple.com/search"
    params = {"term": query, "media": "movie", "entity": "movie", "limit": 1}
    if country:
        params["country"] = country
    if lang:
        params["lang"] = lang
        
    print(f"Testing: {query} [country={country}, lang={lang}]")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params)
            print(f"Status: {resp.status_code}")
            data = resp.json()
            print(f"Results: {data['resultCount']}")
            if data['resultCount'] > 0:
                print(f"Title: {data['results'][0]['trackName']}")
                print(f"Poster: {data['results'][0].get('artworkUrl100')}")
    except Exception as e:
        print(f"Error: {e}")
    print("-" * 20)

async def main():
    # Standard example
    await test_search("jack johnson") # minimalist
    
    # Movie tests without country/lang
    await test_search("Matrix")
    
    # Movie tests with just lang
    await test_search("Matrix", lang="ru_RU")
    
    # Movie tests with media=movie only (I will modify test_search slightly)

if __name__ == "__main__":
    asyncio.run(main())
