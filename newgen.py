import requests
import mysql.connector

# Connect to MySQL
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="TRUEDBTABOO"
)

cursor = db.cursor()

def generate_synonyms_and_save(topic_word):
    prompt = f"List 5 synonyms for the word '{topic_word}':\n1."

    response = requests.post(
        "http://localhost:1234/v1/completions",
        json={
            "prompt": prompt,
            "max_tokens": 100,
            "temperature": 0.7,
            "stop": None
        }
    )

    response_json = response.json()
    output = response_json.get("choices", [{}])[0].get("text", "").strip()

    print("\nGenerated Synonyms:")
    print(output)

    # Split the output into synonyms
    synonyms = output.split('\n')
    synonyms = [word.split('. ')[-1] for word in synonyms if word.strip() != '']

    # Fill up to 5 synonyms, pad if needed
    while len(synonyms) < 5:
        synonyms.append(f"{topic_word}_synonym{len(synonyms) + 1}")

    synonym1, synonym2, synonym3, synonym4, synonym5 = synonyms[:5]

    # Insert into cards table
    sql = """
    INSERT INTO cards (keyword, forbidden1, forbidden2, forbidden3, forbidden4, forbidden5)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    val = (topic_word, synonym1, synonym2, synonym3, synonym4, synonym5)
    
    cursor.execute(sql, val)
    db.commit()

    print("\nSaved to database!")

if __name__ == "__main__":
    word = input("Enter a topic word to generate synonyms: ")
    generate_synonyms_and_save(word)

    cursor.close()
    db.close()
