from jose import jwt
import os

token = jwt.encode({"test": "test"}, "hcverifysecretkey", algorithm="HS256")
try:
    decoded = jwt.decode(token, None, algorithms=["HS256"])
    print("Decoded successfully:", decoded)
except Exception as e:
    print("Exception:", type(e), e)
