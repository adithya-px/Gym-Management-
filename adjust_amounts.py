import os

# Note: this is exactly matching the previous file contents to prevent wiping out data.
path = r'C:\Users\garim\.gemini\antigravity\brain\aec41598-45e1-4265-9644-5d8244714f42\production_seed.sql'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace US Dollar seed constants with standard realistic Indian Rupee gym costs
text = text.replace('150.00', '4500.00')
text = text.replace('300.00', '8000.00')
text = text.replace('400.00', '12000.00')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Successfully adjusted amounts to INR.')
