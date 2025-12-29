
try:
    from nltk.tokenize import sent_tokenize
    from sklearn.feature_extraction.text import TfidfVectorizer
    import nltk
    
    print("Checking NLTK data...")
    try:
        nltk.data.find('tokenizers/punkt')
        print("✅ punkt found")
    except LookupError:
        print("❌ punkt NOT found. Downloading...")
        nltk.download('punkt')
        nltk.download('punkt_tab') # For newer NLTK
        
    try:
        nltk.data.find('corpora/stopwords')
        print("✅ stopwords found")
    except LookupError:
        print("❌ stopwords NOT found. Downloading...")
        nltk.download('stopwords')

    text = "Artificial intelligence (AI) is intelligence demonstrated by machines. AI applications include advanced web search engines. It is cool."
    print(f"Tokenizing text: {text}")
    sents = sent_tokenize(text)
    print(f"Sentences: {sents}")
    
    vect = TfidfVectorizer(stop_words='english')
    vect.fit_transform(sents)
    print("✅ TFIDF success")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
