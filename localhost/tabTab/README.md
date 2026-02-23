## Connecting Ollama to This Website

To allow this website to communicate with your local Ollama instance, run the following command in your terminal:

```
OLLAMA_ORIGINS=https://shreeramk.com ollama serve
```

### What does this do?

- **Runs Ollama on your computer.**
- **Only allows [https://shreeramk.com](https://shreeramk.com) to access Ollama.**
- **Does *not* expose Ollama to other websites or the public internet.**

### Why is this necessary?

Web browsers are designed to block websites from directly accessing services running on your computer for security reasons. By setting the `OLLAMA_ORIGINS` environment variable, you are:

- Explicitly specifying *which website* is allowed to connect.
- Limiting *what* it can access (only Ollama).
- Preventing access by *any other* sites.

Without this, the browser will block the connection, even if Ollama is running.

**Rest assured:**  
Only this site will be able to make requests to your Ollama server. Nothing is exposed publicly and no other websites are permitted.