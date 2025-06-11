from transformers import pipeline

generator = pipeline("text2text-generation", model="google/flan-t5-xl")  # larger version

topic = input("Enter a topic word: ")

prompt = f"""In the game Taboo, players must describe a word without using certain related terms.

For example:
Topic: 'car'
Taboo words:
1. Vehicle
2. Drive
3. Wheels
4. Road
5. Engine

Now do the same for:
Topic: '{topic}'
Taboo words:"""


output = generator(prompt, max_length=100, num_return_sequences=1)

print("\nGenerated Words:")
print(output[0]['generated_text'])