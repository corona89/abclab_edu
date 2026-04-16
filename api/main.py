from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def hello():
    return {"message": "Hello from FastAPI!"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
