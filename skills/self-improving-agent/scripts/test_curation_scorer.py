from nlm_curation import SourceCurator

c = SourceCurator("vector database for RAG systems")

samples = [
    ("Pinecone vector database tutorial for RAG", "https://docs.pinecone.io/guides/rag", "KEEP"),
    ("Understanding embeddings and vector similarity search", "https://arxiv.org/abs/2401.12345", "KEEP"),
    ("Top 10 AI tools you won't believe exist!", "https://blog.spam.io/top-10-ai-tools", "PRUNE"),
    ("My vacation photos from Hawaii", "https://pinterest.com/pin/12345", "PRUNE"),
    ("RAG vs fine-tuning: when to use each", "https://huggingface.co/blog/rag-vs-finetuning", "KEEP"),
    ("Cheap flights and hotel deals this summer", "https://deals.example.com/summer-coupons", "PRUNE"),
    ("Vector databases explained with PostgreSQL pgvector", "https://www.freecodecamp.org/news/pgvector-rag", "KEEP"),
]

for title, url, expected in samples:
    s = c.score_source(title, url)
    verdict = "KEEP" if s["score"] >= c.threshold else "PRUNE"
    match = "OK " if verdict == expected else "!! "
    print(f"{match} {s['score']:+.2f} [{verdict}] {title[:55]}")
    print(f"      {s['reasons']}")
