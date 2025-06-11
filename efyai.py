import requests

def generate_synonyms_tinyllama(word):
    prompt = f"""Example:
Word: happy
Synonyms:
1. joyful
2. cheerful
3. delighted
4. glad
5. content

Now do the same for:
Word: {word}
Synonyms:
1."""

    response = requests.post(
        "http://localhost:1234/v1/completions",
        json={
            "prompt": prompt,
            "max_tokens": 60,
            "temperature": 0.7,
            "stop": ["\n\n"]  # optional: helps clean up
        }
    )

    result = response.json()
    text = result.get("choices", [{}])[0].get("text", "")
    print("\nGenerated Synonyms:")
    print("1." + text.strip())

# Example
generate_synonyms_tinyllama("angry")