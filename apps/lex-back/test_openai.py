import os
from openai import OpenAI

# Берём ключ из переменной окружения
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

response = client.chat.completions.create(
    model="gpt-4.1-mini",
    messages=[
        {"role": "system", "content": "Ты — эксперт по backend-разработке."},
        {"role": "user", "content": "Объясни, как сделать JWT авторизацию в FastAPI."}
    ]
)

print(response.choices[0].message.content)
